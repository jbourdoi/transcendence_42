import { board, arena } from "./board.js"
import { Player  } from "./Player.js"
import { Ball } from "./Ball.js"
import User from "./User.js"

export default function createGameServer(player0 : User, player1: User)
{
	if (!player0 || !player1) return
	const ball: Ball = new Ball(arena.centerX, arena.centerY)

	const players : Player[] = [
		new Player(0, 2, player0),
		new Player(1, 2, player1),
	]

	function broadcast(data: any) : void
	{
		const msg = JSON.stringify(data)
		players.forEach(p=>p.user.socket?.send(msg))
	}//broadcast

	console.log("👤 Joueurs connectés")

	players.forEach((p : Player)=>{
		p.user.socket?.on("message", (msg:any)=>{
		const data = JSON.parse(msg.toString())
			if (data.type === "input")
			{
				p.key = data.key
				if (data.key === "-" || data.key === "+") p.move(data.key)
				if (data.key === "space") p.togglePause()
			}
		})
		p.user.socket?.on("close", ()=>players.forEach(p=>p.user.status = "chat"))
	})

	// Boucle du jeu
	const idInterval = setInterval(() => {
		if (players.some(p=>p.pause)) return

		ball.x += ball.vx
		ball.y += ball.vy

		const dx : number = ball.x - arena.centerX
		const dy : number = ball.y - arena.centerY
		const dist : number = Math.sqrt(dx * dx + dy * dy)
		let changeColor : boolean = false

		if (dist >= arena.radius - board.ballSize)
		{
			changeColor = true
			let bounced : boolean = false
			let endgame : boolean = false
			const nx : number = dx / dist
			const ny : number = dy / dist
			let angleBall : number = Math.atan2(dy, dx)
			if (angleBall < Math.PI / 2) angleBall += 2 * Math.PI
			const dot : number = ball.vx * nx + ball.vy * ny

			for (let p of players)
			{
				if (angleBall >= p.minAngle && angleBall <= p.maxAngle)
				{
					if (angleBall >= p.angle - p.paddleSize && angleBall <= p.angle + p.paddleSize)
					{
						const conv = 57.2957795131 // 180 / Pi
						console.log(`collision ${p.user.pseudo}`, Math.round(angleBall * conv), Math.round(p.minAngle * conv), Math.round(p.maxAngle * conv))
						bounced = true
					}
					else
					{
						p.score--
						if(p.score === 0) endgame = true
					}
					break
				}
			}

			if (endgame)
			{
				const message : string = formatRanking(players)
				broadcast({
					type:"end",
					end: {message}
						})
				players.forEach((p:Player)=>p.user.status = "chat")
				return clearInterval(idInterval)
			}
			if (bounced)
			{
				ball.vx -= 2.1 * dot * nx
				ball.vy -= 2.1 * dot * ny
				const margin = 0.5; // petite marge
				ball.x = arena.centerX + nx * (arena.radius - board.ballSize - margin)
				ball.y = arena.centerY + ny * (arena.radius - board.ballSize - margin)
			}
			else
			{
				ball.reset(getRandomWeightedPlayer(players).defaultAngle)
				players.forEach(p=>p.resetAngle())
			}
		}

		broadcast({
			type: "state",
			ball,
			players: players.map((p:Player,index:number)=>{
					return {
						pseudo:p.user.pseudo,
						angle:p.angle,
						side:index,
						score:p.score,
						paddleSize:p.paddleSize
					}
				}),
			changeColor
		}) //broadcast()
	}, 15) //setInterval()
} //createGameServer()

function formatRanking(players:Player[]) : string
{
  if (!players.length) return "";

  // Tri décroissant par score
  const sorted : Player[] = [...players].sort((a, b) => b.score - a.score);

  // Le meilleur joueur reçoit la couronne
  const bestScore : number = sorted[0].score;

  return sorted
    .map(p => {
      const crown = p.score === bestScore ? " 👑" : "";
      return `${p.user.pseudo}${crown} (${p.score}pts)`;
    })
    .join(", ");
}

function getRandomWeightedPlayer(players:Player[]) : Player
{
	const total : number = players.reduce((sum:number, p:Player) => sum + p.score, 0);
	if (total === 0) return players[Math.floor(Math.random() * players.length)];

	let r : number = Math.random() * total;

	for (const p of players)
	{
		if (r < p.score) return p;
		r -= p.score;
	}

	return players[players.length - 1]; // fallback (normalement jamais utilisé)
}
