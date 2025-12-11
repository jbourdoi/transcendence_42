import { Player } from "./Player.js";
import { Ball } from "./Ball.js";
import User from "./User.js";
import { arena, board } from "../../frontend/functions/game.scale.js"
import type { Impact, GameState, Countdown, GamePause } from "../../types/game.type.js";

const hertz = 60
const tick_ms = 1000 / hertz
const tick_ai = 1000

export class Game
{

private players: Player[]
private ball: Ball
private predictions : Impact[]
private intervalId : NodeJS.Timeout | undefined
private IAinterval : NodeJS.Timeout | undefined
private status : 'state' | 'end' = 'state'
private nbFrame : number = 0

constructor (player0: User, player1: User)
{
	if (!player0 || !player1) throw new Error("Deux joueurs sont requis");

	this.ball = new Ball()
	this.predictions = this.ball.predictImpact(hertz)
	const nbPlayer = 5

	this.players = [
		new Player(0, nbPlayer, player0),
		new Player(1, nbPlayer, player1),
		new Player(2, nbPlayer, new User("", "Neo")),
		new Player(3, nbPlayer, new User("", "Mia")),
		new Player(4, nbPlayer, new User("", "Pac")),
		// new Player(5, nbPlayer, new User("", "Man")),
		// new Player(6, nbPlayer, new User("", "Wai")),
		// new Player(7, nbPlayer, new User("", "Tai")),
		// new Player(8, nbPlayer, new User("", "Boa")),
		// new Player(9, nbPlayer, new User("", "Noa")),
		// new Player(10, nbPlayer, new User("", "Nim")),
		// new Player(11, nbPlayer, new User("", "Wix")),
		// new Player(12, nbPlayer, new User("", "Rio")),
	];
	this.setupSockets();
	this.startGameLoop();
}//constructor()

public destroy()
{
	// 1. Stopper la boucle de jeu
	console.log("game be destroyed")
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

	// 2. Débrancher les écouteurs de socket
	this.players.forEach(p => {
		p.user.status = "chat";
	// const socket = p.user.socket;
	// if (socket) {
	// 	socket.removeListener("message", this.handleInput);
	// }
	// 3. Remettre l'état du joueur à "chat" ou autre
	});

	// 4. Nettoyage interne (facultatif mais sûr)
	this.players = []
	this.ball = null as any
	this.predictions = []
}//destroy()

private broadcast(data: GameState | Countdown | GamePause): void
{
	this.players.forEach(p => p.user.send(data))
}//broadcast

private async startCountdown(): Promise<void>
{
	let count = 3;
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
				setTimeout(() => {
					resolve();
				}, 500);
			}
		}, 1000);
	});
}


private setupSockets()
{
	this.players.forEach((p: Player) => {
		p.user.socket?.on("close", () => this.destroy())
	})
}//setupSockets()

private startGameLoop()
{
	// 1) Arrête la balle
	this.ball.vx = 0
	this.ball.vy = 0
	// 2) Lancer le countdown
	this.startCountdown().then(() => {
		if (!this.ball) return
		// 3) Quand le décompte est fini → vraie remise en jeu
		this.ball.reset(this.getRandomWeightedPlayer().defaultAngle)
		this.players.forEach(p => p.resetAngle())
		this.predictions = this.ball.predictImpact(hertz)
		this.intervalId = setInterval(() => this.gameTick(), tick_ms)
		this.IAinterval = setInterval(() => { this.predictions=this.ball.predictImpact(hertz) }, tick_ai)
	});
}//startGameLoop()

private gameTick()
{
	this.players.forEach(p=>p.handleKey(this.predictions))

	if (this.players.some(p => p.pause)) return this.broadcast({ type: "pause" });

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
		const dot = this.ball.vx * nx + this.ball.vy * ny
		for (let p of this.players)
		{
			if (theta >= p.minAngle && theta <= p.maxAngle)
			{
				if (theta >= p.angle - p.paddleSize && theta <= p.angle + p.paddleSize)
				{
					// const conv = 57.2957795131;
					// console.log(`collision ${p.user.pseudo}`, Math.round(angleBall * conv), Math.round(p.minAngle * conv), Math.round(p.maxAngle * conv));
					playerBounced = p
				}
				else
				{
					p.score--;
					if (p.score === 0) endgame = true;
				}
				break;
			}
		}
		this.status = 'state'
		if (endgame) this.status = 'end'
		if (playerBounced)
		{
			let coef = 2
			if (this.ball.vx*this.ball.vx + this.ball.vy*this.ball.vy < 300) coef = 2.05
			this.ball.vx -= coef * dot * nx
			this.ball.vy -= coef * dot * ny

			// 1) angle actuel
			const angle = Math.atan2(this.ball.vy, this.ball.vx)
			// 2) perturbation en fonction des derniers deplacement du joueur
			const speed = Math.sqrt(this.ball.vx**2 + this.ball.vy**2)
			const newAngle = angle + playerBounced.tangenteSpeed
			this.ball.vx = speed * Math.cos(newAngle)
			this.ball.vy = speed * Math.sin(newAngle)
			// 4) repositionnement
			const margin = 0.5
			this.ball.x = arena.centerX + nx * (arena.radius - board.ballSize - margin)
			this.ball.y = arena.centerY + ny * (arena.radius - board.ballSize - margin)
		}
		else // one player missed
		{
			// 1) Arrête la balle et recentre la balle
			this.ball.vx = 0
			this.ball.vy = 0
			this.ball.x = arena.centerX
			this.ball.y = arena.centerY
			// this.players.forEach(p => p.resetAngle());
			// 2) Lancer le countdown
			this.startCountdown().then(() => {
				if (!this.ball) return
				// 3) Quand le décompte est fini → vraie remise en jeu
				this.ball.reset(this.getRandomWeightedPlayer().defaultAngle);
				// 4) Recalcul de trajectoire IA
				this.predictions = this.ball.predictImpact(hertz);
			});
		}
	}

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
	if (this.status === "end") this.destroy()
}//gameTick()

private getRandomWeightedPlayer(): Player
{
	const total = this.players.reduce((sum, p) => sum + p.score, 0);
	if (total === 0) return this.players[Math.floor(Math.random() * this.players.length)] as Player;

	let r = Math.random() * total;
	for (const p of this.players) {
	if (r < p.score) return p;
	r -= p.score;
	}
	return this.players[this.players.length - 1] as Player;
}//getRandomWeightedPlayer

}//class Game
