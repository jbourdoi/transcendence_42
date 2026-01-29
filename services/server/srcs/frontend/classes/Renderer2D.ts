import { arena, board } from "../functions/game.scale.js"
import type { GameState, Impact } from "../../types/game.type.js";

type Point = {
	x: number
	y: number
}

export class Renderer2D
{
private ctx: CanvasRenderingContext2D
private color: any
private paused: boolean = false
private getState: () => GameState | null
private getAnglePlayer: () => number
private getEnd: () => boolean
// private drawPredictionsRotated: any

constructor(canvas: HTMLCanvasElement, deps: {
    color: any,
    getState: () => GameState | null,
    getAnglePlayer: () => number,
    getEnd: () => boolean,
    // drawPredictionsRotated: any,
}) {
    this.ctx = canvas.getContext("2d")!;
    this.color = deps.color;
    this.getState = deps.getState;
    this.getAnglePlayer = deps.getAnglePlayer;
    this.getEnd = deps.getEnd;
    // this.drawPredictionsRotated = deps.drawPredictionsRotated;

    canvas.width = board.width;
    canvas.height = board.height;
    canvas.style.position = "fixed"
    canvas.style.top = "100px"
    canvas.style.left = "100px"
}

pause() { this.paused = true; }

resume() { this.paused = false; }

start()
{
    const loop = () => {
        const end = this.getEnd();
        if (!end) {
            if (!this.paused)
                this.draw();
            requestAnimationFrame(loop);
        }
    };
    requestAnimationFrame(loop);
}

private draw()
{
    const state = this.getState();
    if (!state || !state.players || !state.ball) return;

    const ctx = this.ctx;

    ctx.clearRect(0, 0, board.width, board.height);

    this.drawPredictionsRotated(
        ctx,
        { ...state.ball },
        state.impacts,
        { x: arena.centerX, y: arena.centerY },
        this.getAnglePlayer()
    );

    this.drawPlayers(ctx, state);
    this.drawBall(ctx, state);
}

private drawBall(ctx: CanvasRenderingContext2D, state: GameState)
{
    const angle = this.getAnglePlayer();
    const { centerX, centerY } = arena;

    const ballX =
        centerX + state.ball.dist * Math.cos(state.ball.theta + angle);
    const ballY =
        centerY + state.ball.dist * Math.sin(state.ball.theta + angle);

    ctx.beginPath();
    ctx.fillStyle = this.color.colorBall;
    ctx.arc(ballX, ballY, board.ballSize, 0, Math.PI * 2);
    ctx.fill();
}

private drawPlayers(ctx: CanvasRenderingContext2D, state: GameState)
{
    const angle = this.getAnglePlayer()
    const { centerX, centerY, radius } = arena
    const paddleWidth = board.paddleWidth / 2

    state.players.forEach((p, index) => {
        const aStart = p.angle - p.paddleSize + angle;
        const aEnd = p.angle + p.paddleSize + angle;

        const bgStart = p.minAngle + angle;
        const bgEnd = p.maxAngle + angle;

        // background arc
        ctx.beginPath();
        ctx.strokeStyle = this.color.playerComp[index];
        ctx.lineWidth = 2 * paddleWidth;
        ctx.arc(centerX, centerY, radius + paddleWidth, bgStart, bgEnd);
        ctx.stroke();

        // paddle arc
        ctx.beginPath();
        ctx.strokeStyle = this.color.player[index];
        ctx.lineWidth = 2 * paddleWidth;
        ctx.arc(centerX, centerY, radius + paddleWidth, aStart, aEnd);
        ctx.stroke();

        // Optionnel : petit repère pour voir le centre du joueur
        const x = centerX + (radius + paddleWidth) * Math.cos(p.angle + angle)
        const y = centerY + (radius + paddleWidth) * Math.sin(p.angle + angle)
        ctx.beginPath()
        ctx.arc(x, y, paddleWidth, 0, Math.PI * 2)
        ctx.fillStyle = this.color.colorBall
        ctx.fill()
    });
}

private rotatePoint(p: Point, cx: number, cy: number, angle: number): Point
{
	const dx = p.x - cx
	const dy = p.y - cy
	const cosA = Math.cos(angle)
	const sinA = Math.sin(angle)
	return {
		x: cx + dx * cosA - dy * sinA,
		y: cy + dx * sinA + dy * cosA
	}
}

private drawLine(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, colorStrike: string = 'black', width: number = 1)
{
	ctx.beginPath()
	ctx.moveTo(p1.x, p1.y)
	ctx.lineTo(p2.x, p2.y)
	ctx.strokeStyle = colorStrike
	ctx.lineWidth = width
	ctx.stroke()
}

private drawPredictionsRotated(ctx: CanvasRenderingContext2D, ball: Point, impacts: Impact[], center: Point, angle: number)
{
	if (!impacts || impacts.length === 0) return
	let prev = this.rotatePoint(ball, center.x, center.y, angle)
	for (let i = 0; i < impacts.length; i++) {
		const impact = impacts[i] as Impact
		const next = this.rotatePoint({ x: impact.impactX, y: impact.impactY }, center.x, center.y, angle)
		this.drawLine(ctx, prev, next, 'yellow', 2)
		prev = next
	}
}
}
