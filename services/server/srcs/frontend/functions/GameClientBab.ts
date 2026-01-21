import type { Countdown, GamePause, GameState } from '../../types/game.type.js'
import { json_parse, json_stringify } from './json_wrapper.js'
import { color } from './pickerColor.js'
import { Renderer2D } from '../classes/Renderer2D.js'
import { Renderer3D } from '../classes/Renderer3D.js'
import { GameStore } from '../stores/game.store.js'
import { UserStore } from '../stores/user.store.js'

const score = document.getElementById('score') as HTMLDivElement
const debug = document.getElementById('debug') as HTMLDivElement
const canvas2D = document.getElementById('canvas2D') as HTMLCanvasElement
const canvas3D = document.getElementById('canvas3D') as HTMLCanvasElement
canvas3D.width = 0
canvas3D.height = 0

let state : GameState = {
	type: 'state',
	ball: { dist: 0, theta: 0, x: 0, y: 0 },
	impacts: [],
	players: [],
	changeColor: false,
	nbFrame: 0
}
let end: boolean = false
let pseudo: string = ''
let anglePlayer: number = -1

export function playRemote()
{
	const ws = GameStore.getSocket()
	if (!ws) return
	const pseudo = UserStore.getUserName()
	launchGame(ws, pseudo);
}
playRemote()

export function launchGame(webSocket: WebSocket, pseu: string)
{
	console.log('start a new game')
	pseudo = pseu
	anglePlayer = -1
	const renderer2D = new Renderer2D(canvas2D, {
		color,
		getState: () => state,
		getAnglePlayer: () => anglePlayer,
		getEnd: () => end
	})
	// const renderer3D = new Renderer3D(canvas3D, {
	// 	color,
	// 	getState: () => state,
	// 	getAnglePlayer: () => anglePlayer,
	// 	getEnd: () => end
	// })
	webSocket.onmessage = (e: any) => {
		const data = json_parse(e.data) as GameState | GamePause | Countdown
		if (!data) return
		switch (data.type)
		{
			case 'state':
				{
					state = data
					renderer2D.resume()
					if (anglePlayer === -1)
					{
						anglePlayer = initAnglePlayer(state.players)
						console.log('anglePlayer', anglePlayer)
					}
					debug.textContent = data.nbFrame.toString()
					break
				}
			case 'pause':
				{
					renderer2D.pause()
					break
				}
			case 'end':
				{
					state = data
					end = true
					console.log('data.end', data)
					debug.textContent = data.nbFrame.toString()
					break
				}
			case 'countdown':
				{
					debug.textContent = data.value
				}
		}
		score.innerHTML = formatScore(state.players, end)
	} //onmessage
	end = false
	handlePlayerInput(webSocket)
	renderer2D.start()
	// renderer3D.start()
} //launchGame

function handlePlayerInput(webSocket: WebSocket)
{
	let keyState: any = {}
	document.addEventListener('keydown', e => {
		keyState[e.key] = true
	})
	document.addEventListener('keyup', e => {
		keyState[e.key] = false
	})
	const idInterval = setInterval(async () => {
		if (end) return clearInterval(idInterval)
		if (keyState['i']) {
			keyState['i'] = false
			return webSocket?.send(json_stringify({ type: 'input', key: 'chatGPT' }))
		}
		if (keyState[' ']) {
			keyState[' '] = false
			return webSocket?.send(json_stringify({ type: 'input', key: 'space' }))
		}
		if (keyState['s'] && !keyState['d']) webSocket?.send(json_stringify({ type: 'input', key: '-' }))
		else if (!keyState['s'] && keyState['d']) webSocket?.send(json_stringify({ type: 'input', key: '+' }))
	}, 10)
} //handlePlayerInput

function formatScore(players: any, end: boolean = false): string
{
	if (!players.length) return ''

	let bestScore = 0
	players.forEach((p: any) => {
		if (p.score > bestScore) bestScore = p.score
	})

	const colored = players.map((p: any, index: number) => {
		return { ...p, bg: color.player[index], color: color.playerComp[index] }
	})

	if (end) colored.sort((a: any, b: any) => b.score - a.score)
	return colored
		.map((p: any) => {
			const crown = p.score === bestScore ? '👑' : ''
			const AI = p.ai ? '🤖' : ''
			return `<span style="background-color:${p.bg}; color:${p.color
				};" class="font-extrabold whitespace-nowrap break-keep">${AI}${p.pseudo.slice(0, 5)}${crown} (${p.score})</span>`
		})
		.join('')
} //formatScore

function initAnglePlayer(players: any): number
{
	console.log('pseudo', pseudo, 'players', players)
	const nbPlayer: number = players.length
	for (let index = 0; index < nbPlayer; index++)
		if (players[index].pseudo === pseudo) return Math.PI * (0.5 - (1 + 2 * index) / nbPlayer)
	return 0
} //initAnglePlayer
