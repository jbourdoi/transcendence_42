import type { Countdown, GamePause, GameState, GameDisconnect } from '../../types/game.type.js'
import { json_parse, json_stringify } from '../functions/json_wrapper.js'
import { color } from '../functions/pickerColor.js'
import { Renderer3D } from '../classes/Renderer3D.js'
import { GameStore } from '../stores/game.store.js'
import { UserStore } from '../stores/user.store.js'
import { NotificationStore } from '../stores/notification.store.js'
import { navigate } from '../js/routing.js'
import { LobbyStore } from '../stores/lobby.store.js'
import { MatchTypeToSave, saveMatch } from '../functions/saveMatch.js'

const $score = document.getElementById('score') as HTMLElement
const $debug = document.getElementById('debug') as HTMLElement
const $countdown = document.querySelector('countdown') as HTMLElement
const $canvas3D = document.getElementById('canvas3D') as HTMLCanvasElement
const $pageGameRemote = document.querySelector("page[type=game]")!

if (!$canvas3D) navigate("lobby")
	
	$canvas3D.width = 0
	$canvas3D.height = 0
	$countdown.textContent = ""
	$countdown.classList.remove('visible')
	
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
	let ws : WebSocket | null;
	let renderer3D : Renderer3D;
	let keyState: any = {}
	
	
	function playRemote()
	{
	ws = GameStore.getWebGameSocket()
	if (!ws) return ;
	ws.send(json_stringify({type:"navigate", navigate:"remote_game"}))
	const pseudo = UserStore.getUserName()
	launchGame(ws, pseudo);
}
playRemote()

function buildMatchPayload(gameState: GameState): MatchTypeToSave {
  const winnerScore = Math.max(...gameState.players.map(p => p.score))

  return {
    matchType: 'classic',
    players: gameState.players.map(p => ({
      username: p.pseudo,
      gameRes: p.score === winnerScore ? 'win' : 'lose'
    }))
  }
}


function isSaver(gameState: GameState, myPseudo: string): boolean {
  const pseudos = gameState.players
    .filter(p => !p.ai)
    .map(p => p.pseudo)
    .sort()

  return pseudos[0] === myPseudo
}

function saveMatchResult(data:GameState)
{
	if (isSaver(data, UserStore.getUserName()))
		saveMatch(buildMatchPayload(data))
}

function onMessage(e:any)
{
	const data = json_parse(e.data) as GameState | GamePause | Countdown | GameDisconnect
	if (!data) return
	switch (data.type)
	{
		case 'disconnect':
		{
			end = true
			NotificationStore.notify(data.text, "INFO")
			navigate('lobby')
			return
		}
		case 'state':
		{
			state = data
			if (anglePlayer === -1)
			{
				anglePlayer = initAnglePlayer(state.players)
			}
			$debug.textContent = data.nbFrame.toString()
			break
		}
		case 'end':
		{
			state = data
			end = true
			anglePlayer = -1;
			$debug.textContent = data.nbFrame.toString()
			saveMatchResult(data);
			break
		}
		case 'countdown':
		{
			$countdown.textContent = data.value.toString()
			if (data.value != "GO")
			{
				$countdown.classList.add('visible')
			}
			else
			{
				$countdown.classList.remove('visible')
			}
			break
		}
	}
	$score.innerHTML = formatScore(state.players, end)
} //onmessage

function launchGame(webSocket: WebSocket, pseu: string)
{
	pseudo = pseu
	anglePlayer = -1
	renderer3D = new Renderer3D($canvas3D, {
		color,
		getState: () => state,
		getAnglePlayer: () => anglePlayer,
		getEnd: () => end
	})
	webSocket.addEventListener("message", onMessage)
	end = false
	handlePlayerInput(webSocket)
	renderer3D.start()
} //launchGame

function handleKeyDown(e:any) {
	keyState[e.key] = true
}

function handleKeyUp(e:any) {
	keyState[e.key] = false
}

function handlePlayerInput(webSocket: WebSocket)
{
	document?.addEventListener('keydown', handleKeyDown)
	document?.addEventListener('keyup', handleKeyUp)
	const idInterval = setInterval(async () => {
		if (end) return clearInterval(idInterval)
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
	const nbPlayer: number = players.length
	for (let index = 0; index < nbPlayer; index++)
		if (players[index].pseudo === pseudo) return Math.PI * (0.5 - (1 + 2 * index) / nbPlayer)
	return 0
} //initAnglePlayer

const cleanupGameRemote = () => {
	renderer3D?.destroy()
	ws?.send(json_stringify({type:"navigate", navigate:"quit_game"}))
	ws?.removeEventListener("message", onMessage)
	$pageGameRemote?.removeEventListener("cleanup", cleanupGameRemote);
	document?.removeEventListener("keydown", handleKeyDown)
	document?.removeEventListener("keyup", handleKeyUp)
	LobbyStore.refreshSessionId("")
}

$pageGameRemote?.addEventListener("cleanup", cleanupGameRemote)
