import { arena, board } from "../functions/game.scale.js"
import type { GameState } from "../../types/game.type.js"
import * as BABYLON from "babylonjs"

type Mesh3D = {
	ballMesh: BABYLON.Mesh | null,
	paddleMeshes: BABYLON.Mesh[],
	backgroundArcs: BABYLON.Mesh[]
}

export class Renderer3D
{
private boundResize: () => void = ()=>{};	
private mesh3D : Mesh3D = {ballMesh:null, paddleMeshes:[], backgroundArcs:[]}
private color: any
private worldScale = 0.08
private canvas: HTMLCanvasElement | undefined
private engine: BABYLON.Engine
private scene: BABYLON.Scene
private getState: () => GameState | null
private getAnglePlayer: () => number
private getEnd: () => boolean

constructor(deps: {
	color: any,
	getState: () => GameState | null,
	getAnglePlayer: () => number,
	getEnd: () => boolean
}) {
	this.color = deps.color
	this.getState = deps.getState
	this.getAnglePlayer = deps.getAnglePlayer
	this.getEnd = deps.getEnd
}

setCanvas(canvas: HTMLCanvasElement | null) : boolean
{
	if (canvas === null) return false
	this.canvas = canvas
	this.boundResize = this.resizeCanvas.bind(this)
	return true
}

setColor(color:any)
{
	this.color = color;
}

async start()
{
	await this.initBabylon()
	this.resizeCanvas()
	this.engine.runRenderLoop(()=>this.renderCanvas3D())
	window.addEventListener("resize", this.boundResize)
}

public destroy()
{
	window.removeEventListener("resize", this.boundResize)
	this.engine.stopRenderLoop()
	this.engine.dispose()
	this.scene.dispose()
}

private renderCanvas3D()
{
	if (this.getEnd())
	{
		this.destroy()
	}
	else this.scene.render()
} //renderCanvas3D

private resizeCanvas = () => {
    if (!this.canvas) return;

    const verticale = window.innerHeight > window.innerWidth
    const sizeWidth = window.innerWidth
	const sizeHeight = verticale? window.innerWidth : window.innerHeight * 0.9

    // appliquer au style CSS
    this.canvas.style.width = sizeWidth + "px";
    this.canvas.style.height = sizeHeight + "px";

    // appliquer au canvas réel
    this.canvas.width = sizeWidth;
    this.canvas.height = sizeHeight;

    // resize Babylon
    if (this.engine) this.engine.resize();
}



private async initBabylon()
{
	this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true, premultipliedAlpha: true })
	this.scene = new BABYLON.Scene(this.engine)
	this.initScene()
} //initBabylon

private initScene ()
{
	const state = this.getState()
	const radius = arena.radius * this.worldScale

	// scene.clearColor = new BABYLON.Color4(0, 0, 0, 1) // noir pur pour style
	this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)  // transparent

	// 📌 Caméra orbitale autour du centre
	const camDist = radius * 2.5     // distance = à ajuster

	const camera = new BABYLON.ArcRotateCamera(
		"cam",
		this.getAnglePlayer() - Math.PI / 2,          // rotation horizontale
		0,         // inclinaison top-down
		camDist,               // distance
		BABYLON.Vector3.Zero(),
		this.scene
	)

	camera.lowerBetaLimit = 0
	camera.upperBetaLimit = Math.PI
	camera.fov = (this.getState()?.players.length || 3) * 0.3

	camera.attachControl(this.canvas, true)

	const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 10, 0), this.scene)
	light.intensity = 2.2
	// ☀️ Soleil lointain
	const sun = new BABYLON.DirectionalLight(
		'sun',
		new BABYLON.Vector3(-0.6, -1, -0.3), // direction du soleil
		this.scene
	)
	sun.intensity = 2.2

	this.scene.registerBeforeRender(() => {
		if (!state || this.getEnd()) return
		// 🎯 mettre à jour uniquement la rotation caméra si angle joueur change
		camera.alpha = this.getAnglePlayer() - Math.PI / 2
		this.updateBabylonFromState(this.scene)
	})
} //initScene

private createArcMesh(
	id: string,
	centerX: number,
	centerY: number,
	radiusPx: number,
	startAngle: number,
	endAngle: number,
	thickness: number,
	scene: BABYLON.Scene
): BABYLON.Mesh {
	const points: BABYLON.Vector3[] = []
	let steps = Math.max(8, Math.ceil((endAngle - startAngle) * 6))
	for (let i = 0; i <= steps; i++) {
		const t = startAngle + (endAngle - startAngle) * (i / steps)
		const x = centerX + radiusPx * Math.cos(t)
		const y = centerY + radiusPx * Math.sin(t)
		const vx = (x - arena.centerX) * this.worldScale
		const vz = (y - arena.centerY) * this.worldScale * -1
		points.push(new BABYLON.Vector3(vx, 0, vz))
	}
	// Create tube along arc and give it thickness
	return BABYLON.MeshBuilder.CreateTube(id, { path: points, radius: thickness * this.worldScale, updatable: true }, scene)
} //createArcMesh

private initBabylonVisuals(scene: BABYLON.Scene)
{
	const mesh3D = this.mesh3D
	const state = this.getState()
	if (!mesh3D.ballMesh) {
		mesh3D.ballMesh = BABYLON.MeshBuilder.CreateSphere('ball3d', { diameter: 2 * board.ballSize * this.worldScale}, scene)
		const mat = new BABYLON.StandardMaterial('ballMat', scene)
		// mat.diffuseColor = this.hexToColor3(this.color.colorBall)
		mat.diffuseColor = BABYLON.Color3.FromHexString(this.color.colorBall)
		mesh3D.ballMesh.material = mat
	}
	mesh3D.paddleMeshes.forEach(m => m.dispose(true, true))
	mesh3D.backgroundArcs.forEach(m => m.dispose(true, true))
	mesh3D.paddleMeshes = []
	mesh3D.backgroundArcs = []

	const centerX = arena.centerX
	const centerY = arena.centerY
	const radius = arena.radius
	const paddleWidth = board.paddleWidth / 2

	if (!state?.players) return

	state.players.forEach((p: any, i: number) => {
		const base = BABYLON.Color3.FromHexString(this.color.player[i])
		const matPad = this.makePaddleMaterial(scene, base)
		const matBG = this.makeBackgroundMaterial(scene, base)

		const aStart = p.angle - p.paddleSize
		const aEnd = p.angle + p.paddleSize

		// BACKGROUND — 2 zones
		const bg1 = this.createArcMesh(`bg1_${i}`, centerX, centerY, radius + paddleWidth, p.minAngle, aStart, paddleWidth, scene)
		const bg2 = this.createArcMesh(`bg2_${i}`, centerX, centerY, radius + paddleWidth, aEnd, p.maxAngle, paddleWidth, scene)
		bg1.material = bg2.material = matBG

		mesh3D.backgroundArcs.push(bg1, bg2)

		// PADDLE glossy
		const pad = this.createArcMesh(`pad_${i}`, centerX, centerY, radius + paddleWidth, aStart, aEnd, paddleWidth, scene)
		pad.material = matPad
		mesh3D.paddleMeshes.push(pad)
	})
} //initBabylonVisuals

private updateBabylonFromState(scene: BABYLON.Scene)
{
	const mesh3D = this.mesh3D
	const state = this.getState()
	if (!state || !state.ball) return
	if (!mesh3D.ballMesh) this.initBabylonVisuals(scene)

	// compute canvas coords of ball as in 2D draw
	// const ballX = arena.centerX + state.ball.dist * Math.cos(state.ball.theta)
	// const ballY = arena.centerY + state.ball.dist * Math.sin(state.ball.theta)
	const ballX = state.ball.x
	const ballY = state.ball.y

	// map to world coordinates
	const wx = (ballX - arena.centerX) * this.worldScale
	const wz = (ballY - arena.centerY) * this.worldScale * -1
	if (mesh3D.ballMesh) {
		mesh3D.ballMesh.position.x = wx
		mesh3D.ballMesh.position.y = 0 // hauteur fixe
		mesh3D.ballMesh.position.z = wz
	}
	this.initBabylonVisuals(scene)
} //updateBabylonFromState

private makePaddleMaterial(scene: BABYLON.Scene, color: BABYLON.Color3) {
	const mat = new BABYLON.StandardMaterial('padMat', scene)
	mat.diffuseColor = color
	return mat
} //makePaddleMaterial

private makeBackgroundMaterial(scene: BABYLON.Scene, paddleColor: BABYLON.Color3) {
	const bg = new BABYLON.StandardMaterial('bgMat', scene)
	bg.diffuseColor = paddleColor.scale(0.1)
	bg.specularColor = new BABYLON.Color3(0, 0, 0) // pas de brillance
	bg.roughness = 1 // mat max
	return bg
} //makeBackgroundMaterial

} //class Renderer3D
