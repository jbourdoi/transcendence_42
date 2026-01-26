import { randomUUID, UUID } from 'crypto'
import { Player } from "./Player.js";
import { Ball } from "./Ball.js";
import User from "./User.js";
import { arena, board } from "../functions/game.scale.js"
import type { Impact, GameState, Countdown, GamePause, GameDisconnect } from "../types/game.type.js";

const hertz = 60
const tick_ms = 1000 / hertz
const tick_ai = 1000

export class RemoteGame
{

private players: Player[]
private ball: Ball
private predictions : Impact[]
private intervalId : NodeJS.Timeout | undefined
private IAinterval : NodeJS.Timeout | undefined
private status : 'state' | 'end' = 'state'
private nbFrame : number = 0
private gameUUID : UUID

constructor ( users: User[])
{
	this.gameUUID = randomUUID()
	this.ball = new Ball()
	this.predictions = this.ball.predictImpact(hertz)
	const nbPlayer = users.length
	this.players = users.map((u:User, index:number) => new Player(index, nbPlayer, u))
	this.startGameLoop();
	console.log(`${this.gameUUID} game start`)
}//constructor()

public destroy()
{
	console.log(`${this.gameUUID} game destroy`)
	if (this.intervalId)
	{
		clearInterval(this.intervalId)
		this.intervalId = undefined
	}
	if (this.IAinterval)
	{
		clearInterval(this.IAinterval)
		this.IAinterval = undefined
	}
	this.players.forEach(p => { p.user.status = "chat"; p.user.navigate = "home"; });
	this.players = []
	this.ball = null
	this.predictions = []
}//destroy()

private broadcast(data: GameState | Countdown | GamePause | GameDisconnect): void
{
	this.players.forEach(p => p.user.send(data))
}//broadcast

private async startCountdown(): Promise<void>
{
	let count = 3;
	this.broadcastState();
	this.broadcast({ type: "countdown", value: count.toString() });
	return new Promise(resolve => {
		const timer = setInterval(() => {
			count--;
			if (count > 0)
			{
				this.broadcast({ type: "countdown", value: count.toString() })
			}
			else
			{
				clearInterval(timer);
				this.broadcast({ type: "countdown", value: "GO" })
				setTimeout(() => { resolve(); }, 500);
			}
		}, 1000);
	});
}//startCountdown

private startGameLoop()
{
	this.ball.vx = 0
	this.ball.vy = 0
	this.intervalId = setInterval(() => this.gameTick(), tick_ms)
	this.startCountdown().then(() => {
		if (!this.ball) return
		// 3) Quand le décompte est fini → vraie remise en jeu
		this.ball.reset(this.getRandomWeightedPlayer().defaultAngle)
		this.players.forEach(p => p.resetAngle())
		this.predictions = this.ball.predictImpact(hertz)
		this.IAinterval = setInterval(() => { this.predictions=this.ball.predictImpact(hertz) }, tick_ai)
	});
}//startGameLoop()

private checkDisconnection() : boolean
{
	let disconnect = false
	let text : string = ""
	this.players.forEach(p=>{
		if (p.user.id != "" && p.user.isOutGame())
		{
			disconnect = true;
			text += ` | ${p.user.pseudo} has left the game`
			console.log(`${p.user.pseudo} is not ingame : ${p.user.navigate}`)
		}
	})
	if (text)
	{
		text = text.substring(3);
	}
	if (disconnect)
	{
		this.broadcast({type:'disconnect', text});
	}
	return disconnect;
}

private gameTick()
{
	if (this.checkDisconnection())
	{
		console.log("destroy from checkDisconnection")
		return this.destroy()
	}
	this.players.forEach(p=>p.handleKey(this.predictions))
	if (this.ball.vx === 0 && this.ball.vy === 0)
	{
		return this.broadcastState()
	}
	// if (this.players.some(p => p.pause))
	// {
	// 	return this.broadcast({ type: "pause" });
	// }
	this.ball.x += this.ball.vx
	this.ball.y += this.ball.vy
	const dx = this.ball.x - arena.centerX
	const dy = this.ball.y - arena.centerY
	let dist = Math.sqrt(dx * dx + dy * dy)
	let theta = Math.atan2(dy, dx)
	if (theta < 0) theta += 2 * Math.PI
	let changeColor = false
	if (dist >= arena.radius - board.ballSize)
	{
		dist = arena.radius - board.ballSize
		changeColor = true
		let playerBounced : Player | undefined = undefined
		let endgame : boolean = false
		const nx = dx / dist
		const ny = dy / dist
		for (let p of this.players)
		{
			if (theta >= p.minAngle && theta <= p.maxAngle)
			{
				if (theta >= p.angle - p.paddleSize && theta <= p.angle + p.paddleSize)
				{
					playerBounced = p
				}
				else
				{
					p.score--;
					if (p.score === 0)
					{
						endgame = true;
					}
				}
				break;
			}
		}
		this.status = 'state'
		if (endgame)
		{
			this.status = 'end'
			this.broadcastState(dist, theta, changeColor);
			return (this.destroy())
		}
		if (playerBounced)
		{
			const impactOffset = (playerBounced.angle - theta) / playerBounced.paddleSize;
			const clamped = Math.max(-1, Math.min(1, impactOffset));

			const MAX_BOUNCE_ANGLE = Math.PI / 3;
			const bounceAngle = clamped * MAX_BOUNCE_ANGLE;

			const normalAngle = Math.atan2(ny, nx);
			const newAngle = normalAngle + Math.PI + bounceAngle;

			let speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
			const BOOST = 1.03;
			const MAX_SPEED = 25;
			speed = Math.min(speed * BOOST, MAX_SPEED);

			this.ball.vx = speed * Math.cos(newAngle);
			this.ball.vy = speed * Math.sin(newAngle);

			const margin = 0.5;
			this.ball.x = arena.centerX + nx * (arena.radius - board.ballSize - margin);
			this.ball.y = arena.centerY + ny * (arena.radius - board.ballSize - margin);
		}
		else // one player missed
		{
			// 1) Arrête la balle et recentre la balle
			this.ball.vx = 0
			this.ball.vy = 0
			this.ball.x = arena.centerX
			this.ball.y = arena.centerY
			// recentrer les paddles des joueurs?
			// this.players.forEach(p => p.resetAngle());
			// 2) Lancer le countdown
			this.startCountdown().then(() => {
				if (!this.ball) return
				// 3) Quand le décompte est fini → vraie remise en jeu
				this.ball.reset(this.getRandomWeightedPlayer().defaultAngle);
				// 4) Recalcul de trajectoire IA au relancement de la balle
				this.predictions = this.ball.predictImpact(hertz);
			});
		}
	}
	this.broadcastState(dist, theta, changeColor);
}//gameTick()

private broadcastState(dist: number = 0, theta: number = 0, changeColor: boolean = false )
{
	this.broadcast({
	type: this.status,
	ball: { dist, theta, x:this.ball.x, y:this.ball.y },
	impacts:this.predictions,
	players: this.players.map(p => ({
		pseudo: p.user.pseudo,
		score: p.score,
		ai:p.ai,
		angle: p.angle,
		minAngle:p.minAngle,
		maxAngle:p.maxAngle,
		paddleSize: p.paddleSize
	})),
	changeColor,
	nbFrame: (++this.nbFrame)
	});
}

private getRandomWeightedPlayer(): Player
{
	const total = this.players.reduce((sum, p) => sum + p.score, 0);
	if (total === 0)
	{
		return this.players[Math.floor(Math.random() * this.players.length)] as Player;
	}
	let r = Math.random() * total;
	for (const p of this.players)
	{
		if (r < p.score)
		{
			return p;
		}
		r -= p.score;
	}
	return this.players[this.players.length - 1] as Player;
}//getRandomWeightedPlayer

}//class Game
