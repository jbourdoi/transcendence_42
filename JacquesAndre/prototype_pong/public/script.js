import { board } from "./board.js"

const canvas = document.createElement("canvas")
const ctx = canvas.getContext("2d")
const score = document.getElementById("score")
const buttonP1 = document.getElementById("button1")
const buttonP2 = document.getElementById("button2")
let ws1
let ws2

canvas.width = board.width
canvas.height = board.height
document.body.appendChild(canvas)

function handleP1()
{
	ws1 = new WebSocket(`wss://${location.host}`)
	buttonP1.style.display = "none"
	ws1.onmessage = (e) => {
		const data = JSON.parse(e.data);
		if (data.type ==="onopen") { console.log(data.message); player1 = data.id; }
		if (data.type === "state") { state = data; }
	}
}

function handleP2()
{
	ws2 = new WebSocket(`wss://${location.host}`)
	buttonP2.style.display = "none"
	ws2.onmessage = (e) => {
		const data = JSON.parse(e.data);
		if (data.type ==="onopen") { console.log(data.message); player2 = data.id; }
	}
}
buttonP1.addEventListener("click", handleP1);
buttonP2.addEventListener("click", handleP2);

let state = { ball: {}, players: [] }
let modeAi1 = false
let modeAi2 = false
let player1
let player2
let keyState = {}



document.addEventListener("keydown", (e) => { keyState[e.key] = true })

document.addEventListener("keyup", (e)=>{ keyState[e.key] = false })

document.addEventListener("mousemove", (e) => {
	if (e.movementY > 1) { keyState["z"] = true ; keyState["a"] = false; }
	else if (e.movementY < -1){ keyState["z"] = false ; keyState["a"] = true; }
	else {keyState["z"] = false; keyState["a"] = false; }
})

function drawline(x1, y1, x2, y2)
{
	// Définir le style du trait
ctx.strokeStyle = "white";   // couleur
ctx.lineWidth = 1;         // épaisseur

// Commencer un nouveau chemin
ctx.beginPath();

// Position de départ
ctx.moveTo(x1, y1);

// Position d’arrivée
ctx.lineTo(x2, y2);

// Tracer le trait
ctx.stroke();
}

function draw()
{
	if (state.players[1]) score.innerText = `Player1 ${state.players[0].score} | Player2 ${state.players[1].score}`
	ctx.clearRect(0, 0, board.width, board.height);
	ctx.fillStyle = "white";

	// balle
	ctx.beginPath();
	ctx.arc(state.ball.x, state.ball.y, board.ballSize, 0, Math.PI * 2);
	ctx.fill();
	drawline(2 * board.paddleWidth, 0, 2 * board.paddleWidth, board.height)
	drawline(board.width - 2 * board.paddleWidth, 0, board.width - 2 * board.paddleWidth, board.height)

	// raquettes
	state.players.forEach((p) => {
		const x = p.side === 0 ? board.paddleWidth : board.width - 2 * board.paddleWidth;
		ctx.fillRect(x, p.y - p.paddleSize, board.paddleWidth, 2 * p.paddleSize);
	});
	requestAnimationFrame(draw);
}

setInterval(()=>
{
	if (keyState["i"]){ modeAi1 = !modeAi1; keyState["i"] = false;}
	if (keyState["o"]){ modeAi2 = !modeAi2; keyState["o"] = false;}
	if (keyState[" "])
	{
		ws1.send(JSON.stringify({ type: "input", key: "space" })); keyState[" "] = false
		ws2.send(JSON.stringify({ type: "input", key: "space" })); keyState[" "] = false
		return ;
	}
	if (state.players.length !== 2) return
	if (modeAi1)
	{
		const diff1 = state.ball.y - state.players[player1-1].y
		if (diff1 > 20) ws1.send(JSON.stringify({ type: "input", key: "down" }))
		else if (diff1 < -20) ws1.send(JSON.stringify({ type: "input", key: "up" }))
		else ws1.send(JSON.stringify({type:"input", key: "none"}))
	}
	else
	{
		if (keyState["a"] && !keyState["z"]) ws1.send(JSON.stringify({ type: "input", key: "up" }))
		else if (!keyState["a"] && keyState["z"]) ws1.send(JSON.stringify({ type: "input", key: "down" }))
		else ws1.send(JSON.stringify({type:"input", key: "none"}))

	}
	if (!player2) return
	if (modeAi2)
	{
		const diff2 = state.ball.y - state.players[player2-1].y
		if (diff2 > 20) ws2.send(JSON.stringify({ type: "input", key: "down" }))
		else if (diff2 < -20) ws2.send(JSON.stringify({ type: "input", key: "up" }))
		else ws2.send(JSON.stringify({type:"input", key: "none"}))
	}
	else
	{
		if (keyState["j"] && !keyState["n"]) ws2.send(JSON.stringify({ type: "input", key: "up"}))
		else if (!keyState["j"] && keyState["n"]) ws2.send(JSON.stringify({ type: "input", key: "down"}))
		else ws2.send(JSON.stringify({type:"input", key: "none"}))
	}
}, 20);

draw();
