import { board, arena } from "./board.js";
import { Player } from "./Player.js";
import { Ball } from "./Ball.js";
import User from "./User.js";

export class Game
{

private players: Player[];
private ball: Ball;
private intervalId : any;

constructor (player0: User, player1: User)
{
	if (!player0 || !player1) throw new Error("Deux joueurs sont requis");

	this.ball = new Ball(arena.centerX, arena.centerY);

	this.players = [
		new Player(0, 5, player0),
		new Player(1, 5, player1),
		new Player(2, 5, new User("", "AI_1")),
		new Player(3, 5, new User("", "AI_2")),
		new Player(4, 5, new User("", "AI_3")),
	];

	this.setupSockets();
	this.startGameLoop();
}//constructor()

public destroy()
{
	// 1. Stopper la boucle de jeu
	if (this.intervalId)
	{
	clearInterval(this.intervalId);
	this.intervalId = null;
	}

	// 2. Débrancher les écouteurs de socket
	this.players.forEach(p => {
		p.user.status = "chat";
	// const socket = p.user.socket;
	// if (socket) {
	// 	socket.removeAllListeners("message");
	// 	socket.removeAllListeners("close");
	// }
	// 3. Remettre l'état du joueur à "chat" ou autre
	});

	// 4. Nettoyage interne (facultatif mais sûr)
	this.players = [];
	this.ball = null as any;
}//destroy()

private broadcast(data: any): void
{
	const msg = JSON.stringify(data);
	this.players.forEach(p => p.user.socket?.send(msg));
}//broadcast

private setupSockets()
{
	this.players.forEach((p: Player) => {
	p.user.socket?.on("message", (msg: any) => {
		const data = JSON.parse(msg.toString());
		if (data.type === "input")
		{
			p.key = data.key;
			if (data.key === "-" || data.key === "+") p.move(data.key);
			if (data.key === "space") p.togglePause();
		}
	})

	p.user.socket?.on("close", () => this.destroy())
	})
}//setupSockets()

private startGameLoop()
{
	this.intervalId = setInterval(() => this.gameTick(), 15);
}//startGameLoop()

private gameTick()
{
	if (this.players.some(p => p.pause)) return;

	this.ball.x += this.ball.vx;
	this.ball.y += this.ball.vy;

	const dx = this.ball.x - arena.centerX;
	const dy = this.ball.y - arena.centerY;
	const dist = Math.sqrt(dx * dx + dy * dy);
	let changeColor = false;

	if (dist >= arena.radius - board.ballSize)
	{
		changeColor = true;
		let bounced = false;
		let endgame = false;
		const nx = dx / dist;
		const ny = dy / dist;
		let angleBall = Math.atan2(dy, dx);
		if (angleBall < Math.PI / 2) angleBall += 2 * Math.PI;
		const dot = this.ball.vx * nx + this.ball.vy * ny;

		for (let p of this.players)
		{
			if (angleBall >= p.minAngle && angleBall <= p.maxAngle)
			{
				if (angleBall >= p.angle - p.paddleSize && angleBall <= p.angle + p.paddleSize)
				{
					const conv = 57.2957795131;
					console.log(`collision ${p.user.pseudo}`, Math.round(angleBall * conv), Math.round(p.minAngle * conv), Math.round(p.maxAngle * conv));
					bounced = true;
				}
				else
				{
					p.score--;
					if (p.score === 0) endgame = true;
				}
				break;
			}
		}

		if (endgame)
		{
			const message = this.formatRanking();
			this.broadcast({ type: "end", end: { message } });
			this.destroy()
			return;
		}

		if (bounced)
		{
			this.ball.vx -= 2.1 * dot * nx;
			this.ball.vy -= 2.1 * dot * ny;

			// 1) angle actuel
			const angle = Math.atan2(this.ball.vy, this.ball.vx);

			// 2) perturbation aléatoire (en radians)
			const randomAngle = (Math.random() - 0.5) * 0.5; // ±0.125 rad ≈ ±7°

			// 3) appliquer la rotation
			const speed = Math.sqrt(this.ball.vx**2 + this.ball.vy**2);
			const newAngle = angle + randomAngle;

			this.ball.vx = speed * Math.cos(newAngle);
			this.ball.vy = speed * Math.sin(newAngle);

			// repositionnement
			const margin = 0.5;
			this.ball.x = arena.centerX + nx * (arena.radius - board.ballSize - margin);
			this.ball.y = arena.centerY + ny * (arena.radius - board.ballSize - margin);
		}

		else
		{
			this.ball.reset(this.getRandomWeightedPlayer().defaultAngle);
			this.players.forEach(p => p.resetAngle());
		}
	}

	this.broadcast({
	type: "state",
	ball: this.ball,
	players: this.players.map((p, index) => ({
		pseudo: p.user.pseudo,
		angle: p.angle,
		score: p.score,
		paddleSize: p.paddleSize
	})),
	changeColor
	});
}//gameTick()

private formatRanking(): string
{
	const sorted = [...this.players].sort((a, b) => b.score - a.score);
	const bestScore = sorted[0].score;
	return sorted.map(p => {
	const crown = p.score === bestScore ? " 👑" : "";
	return `${p.user.pseudo}${crown} (${p.score}pts)`;
	}).join(", ");
}//formatRanking()

private getRandomWeightedPlayer(): Player
{
	const total = this.players.reduce((sum, p) => sum + p.score, 0);
	if (total === 0) return this.players[Math.floor(Math.random() * this.players.length)];

	let r = Math.random() * total;
	for (const p of this.players) {
	if (r < p.score) return p;
	r -= p.score;
	}
	return this.players[this.players.length - 1];
}//getRandomWeightedPlayer

}//class Game
