import { WebSocket } from "ws"

import User from "./User.js"
import type { Impact } from "../../types/game.type.js"

const MaxTangenteSpeed = 0.2

export class Player
{
	readonly index: number
	readonly nbPlayer : number
	readonly defaultAngle: number
	readonly minAngle: number
	readonly maxAngle: number
	readonly user: User
	paddleSize: number
	angle: number
	score: number
	pause: boolean
	ai: boolean
	pseudo: string
	tangenteSpeed: number

	constructor(index: number, nbPlayer: number, user: User)
	{
		this.index = index
		this.nbPlayer = nbPlayer
		this.paddleSize = 0.25 * Math.PI / nbPlayer
		this.user = user
		this.tangenteSpeed = 0
		this.pause = false
		this.ai = true
		this.score = Math.round(70 / nbPlayer)
		this.pseudo = ""
		const twoPiOverPlayers = (2 * Math.PI) / this.nbPlayer
		this.minAngle = this.index * twoPiOverPlayers
		this.maxAngle = (this.index + 1) * twoPiOverPlayers
		this.defaultAngle = this.minAngle + (twoPiOverPlayers / 2)
		this.angle = this.defaultAngle
		console.log(`created player${index} angle ${this.angle} min ${this.minAngle} max ${this.maxAngle}`)
		user.status = "game"
	}


	handleIA(predictionIA:Impact[])
	{
		this.pseudo = "🤖" + this.user.pseudo
		let theta = this.defaultAngle
		for (const pr of predictionIA) {
			if (pr.theta > this.minAngle && pr.theta < this.maxAngle)
			{
				theta = pr.theta
				break   // <--- sort de la boucle dès qu'on trouve le premier
			}
		}
		if (this.angle > theta + this.paddleSize / 2) this.decrementAngle()
		else if (this.angle < theta - this.paddleSize / 2) this.incrementAngle()
	}

	handleKey(predictionIA: Impact[])
	{
		const lastKey = this.user.key
		this.user.key = "none"
		if (lastKey === "space") return this.togglePause()
		if (lastKey === "chatGPT") this.ai = !this.ai
		if (this.ai)  return this.handleIA(predictionIA)
		this.pseudo = this.user.pseudo
		if (this.user.socket && this.user.socket.readyState !== WebSocket.OPEN) return this.togglePause()

		if (lastKey === "none") this.decreaseTangenteSpeed()
		else if (lastKey === "-") this.incrementAngle()
		else if (lastKey === "+") this.decrementAngle()
	}

	togglePause()
	{
		this.pause = !this.pause
		if (this.pause) console.log(`⏸️ Joueur ${this.pseudo} toggle pause`)
	}

	resetAngle()
	{
		this.angle = this.defaultAngle
		this.tangenteSpeed = 0
	}

	private decreaseTangenteSpeed()
	{
		if (this.tangenteSpeed > 0.02) this.tangenteSpeed -= 0.02
		if (this.tangenteSpeed < -0.02) this.tangenteSpeed += 0.02
	}

	private decrementAngle()
	{
		this.angle -= 0.05
		if (this.angle - this.paddleSize < this.minAngle)
			this.angle = this.minAngle + this.paddleSize
		this.tangenteSpeed += 0.02
		if (this.tangenteSpeed > MaxTangenteSpeed) this.tangenteSpeed = MaxTangenteSpeed
	}

	private incrementAngle()
	{
		this.angle += 0.05
		if (this.angle + this.paddleSize > this.maxAngle)
			this.angle = this.maxAngle - this.paddleSize
		this.tangenteSpeed -= 0.02
		if (this.tangenteSpeed < -MaxTangenteSpeed) this.tangenteSpeed = -MaxTangenteSpeed
	}
}
