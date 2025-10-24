import { board }  from "../public/board.js"
import { WebSocketServer, WebSocket } from "ws"

interface Player {
	id: number;
	socket: WebSocket;
	y: number;
	score: number;
	ready: boolean;
	key: string;
	paddleSize: number;
}

interface Ball {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

const ball: Ball = {
	x: board.width / 2,
	y: board.height / 2,
	vx: 0,
	vy: 0
}

const players: Player[] = []

let nbPlayer = 0

let gravity = 0.1

export function createGameServer(webSocketServer: WebSocketServer)
{
	function broadcast(data: any)
	{
		const msg = JSON.stringify(data);
		for (const p of players) p.socket.send(msg);
	}

	function onConnection(webSocket: WebSocket, foo:any)
	{
		if (players.length >= 2)
		{
			webSocket.send(JSON.stringify({ type: "error", message: "Partie pleine" }));
			webSocket.close();
			return;
		}
		const player: Player = {
			id: ++nbPlayer,
			socket: webSocket,
			y: board.height / 2,
			score: 0,
			ready: false,
			key: "none",
			paddleSize: 50
		};
		players.push(player);
		console.log("👤 Joueur connecté:", player.id);
		webSocket.send(JSON.stringify({type:"onopen", id:player.id, message:`Bienvenue joueur ${player.id}`}))

		webSocket.on("message", (msg) => {
			const data = JSON.parse(msg.toString());
			if (data.type === "input") {
				player.key = data.key
				if (data.key === "up" && player.y > player.paddleSize) player.y -= 10
				if (data.key === "down" && player.y < board.height - player.paddleSize) player.y += 10
				if (data.key === "space") player.ready = !player.ready;
			}
		});

		webSocket.on("close", () => {
			const i = players.indexOf(player);
			if (i >= 0) players.splice(i, 1);
			console.log("🚪 Joueur déconnecté:", player.id);
		});
	}

  // Gestion des connexions
	webSocketServer.on("connection", (webSocket:WebSocket)=> onConnection(webSocket, "sdf"));

// Fonction pour initialiser la balle
function resetBall(ball: Ball, players: Player[]) {

	// Position au centre
	ball.x = board.width / 2;
	ball.y = board.height / 2;
	ball.vx = 0
	ball.vy = 0
	gravity = 0;
	const maxVx = 8;   // vitesse horizontale maximale
	const baseVx = 4;  // vitesse de base
	const baseVy = 2;  // vitesse verticale de base

	// Calcul de la différence de score
	const diff = Math.abs(players[0].score - players[1].score);
	players[0].y = board.height / 2
	players[1].y = board.height / 2

	// Direction : vers le joueur qui mène
	const leader = players[0].score > players[1].score ? 0 : 1;
	const direction = leader === 0 ? -1 : 1; // 1 = vers joueur 2, -1 = vers joueur 1

	// Vitesse horizontale proportionnelle à l'écart de score (limite max)
	// ball.vx = 2

	// Composante verticale aléatoire
	const randomVy = Math.random() * baseVy * 2 - baseVy; // -baseVy ... +baseVy
	ball.vx = Math.min(baseVx * (1 + diff), maxVx) * direction;
	ball.vy = randomVy;
	// setTimeout(() => {
	// }, 750);
}

// Boucle du jeu (50 fps)
	setInterval(() => {
	if (players.length >= 2 && players[0].ready && players[1].ready) {
		ball.x += ball.vx;
		ball.y += ball.vy;
		ball.vy += gravity;
		if (ball.vx === 0) { resetBall(ball, players);}
		if (ball.y > board.height - board.ballSize) {ball.vy = -1 * Math.abs(ball.vy); gravity = 0;}
		if (ball.y < board.ballSize) {ball.vy = Math.abs(ball.vy); gravity = 0;}
		const [p1, p2] = players;
		if (ball.x <= 2 * board.paddleWidth + board.ballSize && Math.abs(ball.y - p1.y) <= p1.paddleSize) {ball.vx = Math.abs(ball.vx); if (p1.key === "up") gravity = -0.05; else if (p1.key === "down") gravity = 0.05; else gravity = 0;}
		if (ball.x >= board.width - 2 * board.paddleWidth - board.ballSize && Math.abs(ball.y - p2.y) <= p2.paddleSize) {ball.vx = -1 * Math.abs(ball.vx); if (p2.key === "up") gravity = -0.05; else if (p2.key === "down") gravity = 0.05; else gravity = 0}
		if (ball.x < 2 * board.paddleWidth + board.ballSize && ball.vx < 0)
		{
			players[1].score += 1
			resetBall(ball, players)
		}
		else if (ball.x > board.width - 2 * board.paddleWidth - board.ballSize && ball.vx > 0)
		{
			players[0].score += 1
			resetBall(ball, players)
		}
		// Diffuser l'état
		broadcast({
			type: "state",
			ball,
			players: players.map((p, i) => ({ id: p.id, y: p.y, side: i, score:p.score, paddleSize:p.paddleSize })),
		});
	}
	}, 15);
}
