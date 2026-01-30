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
import { PARAMS } from '../../types/params.game.js'

const $score = document.getElementById('score') as HTMLElement
const $countdown = document.querySelector('countdown') as HTMLElement | null
const $countdownValue = $countdown?.querySelector('.countdown-value') as HTMLElement | null
const $keyLeft = $countdown?.querySelector('#key-left') as HTMLElement | null
const $keyRight = $countdown?.querySelector('#key-right') as HTMLElement | null

if ($keyLeft) $keyLeft.textContent = PARAMS.key_left
if ($keyRight) $keyRight.textContent = PARAMS.key_right

$countdown?.classList.remove('visible')


const $canvas3D = document.getElementById('canvas3D') as HTMLCanvasElement
const $pageGameRemote = document.querySelector("page[type=game]")!

GameStore.send({type:"navigate", navigate:"remote_game"})

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

await playRemote()

async function playRemote()
{
	ws = GameStore.getWebGameSocket()
	if (ws === null) return await navigate("lobby");
	if ($canvas3D === null) return await navigate("lobby");
	renderer3D = new Renderer3D( {
		color,
		getState: () => state,
		getAnglePlayer: () => anglePlayer,
		getEnd: () => end
	})
	if (renderer3D.setCanvas($canvas3D) === false) return await navigate("lobby")
	ws.send(json_stringify({type:"navigate", navigate:"remote_game"}))
	const pseudo = UserStore.getUserName()
	launchGame(ws, pseudo);
}

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

async function onMessage(e:any)
{
	const data = json_parse(e.data) as GameState | GamePause | Countdown | GameDisconnect
	if (!data) return
	switch (data.type)
	{
		case 'disconnect':
		{
			end = true
			NotificationStore.notify(data.text, "INFO")
			await navigate('lobby')
			return
		}
		case 'state':
		{
			state = data
			if (anglePlayer === -1)
			{
				anglePlayer = initAnglePlayer(state.players)
			}
			break
		}
		case 'end':
		{
			state = data
			end = true
			anglePlayer = -1;
			saveMatchResult(data);
			showVictoryModal(getWinningAliases(data.players))
			break
		}
		case 'countdown':
		{
			if (!$countdown || !$countdownValue) break
			$countdownValue.textContent = data.value.toString()
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
	if (!$score) return
	$score.innerHTML = formatScore(state.players, end)
} //onmessage

function launchGame(webSocket: WebSocket, pseu: string)
{
	pseudo = pseu
	anglePlayer = -1
	
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
		if (keyState[PARAMS.key_left] && !keyState[PARAMS.key_right]) webSocket?.send(json_stringify({ type: 'input', key: '-' }))
		else if (!keyState[PARAMS.key_left] && keyState[PARAMS.key_right]) webSocket?.send(json_stringify({ type: 'input', key: '+' }))
	}, 10)
} //handlePlayerInput

let victoryModalShown = false

function onKeyEscape(event : KeyboardEvent)
{
	if (event.key === 'Escape')
		{
			const modal = document.querySelector('.victory-modal')
			if (modal) modal.remove()
			navigate("lobby")
		}
}

function getWinningAliases(players: any[]): string[]
{
	if (!players?.length) return []

	let bestScore = 0

	for (const p of players)
		if (p.score > bestScore)
			bestScore = p.score

	return players
		.filter(p => p.score === bestScore)
		.map(p => p.pseudo)
}

function showVictoryModal(winnerAliases: string[]): void
{
	if (victoryModalShown) return
	victoryModalShown = true

	const winnersHtml = winnerAliases
		.map(name => `<div class="victory-player">👑 ${name}</div>`)
		.join('')

	const modal = document.createElement('div')
	modal.className = 'victory-modal'
	modal.innerHTML = `
		<div class="victory-content">
			<div class="victory-trophy">🏆</div>
			<div class="victory-title">
				${winnerAliases.length > 1 ? 'Winners' : 'Winner'}
			</div>

			<div class="victory-list">
				${winnersHtml}
			</div>

			<div class="victory-sub">
				${winnerAliases.length > 1
					? 'Win the match!'
					: 'Wins the match!'}
			</div>
		</div>
	`

	modal.addEventListener('click', e => {
		if (e.target === modal)
			modal.remove()
			navigate("lobby")
	})

	document.addEventListener('keydown', onKeyEscape)
	document.body.appendChild(modal)
}

function resetVictoryState(): void
{
	victoryModalShown = false
	document.body.classList.remove('tournament-won')

	document.removeEventListener("keydown", onKeyEscape)
	const modal = document.querySelector('.victory-modal')
	if (modal) modal.remove()
}


function formatScore(players: any, end: boolean = false): string
{
	if (!players.length) return ''

	let bestScore = Math.max(...players.map(p => p.score))

	const colored = players.map((p: any, index: number) => ({
		...p,
		bg: color.player[index],
		fg: color.playerComp[index]
	}))

	if (end) colored.sort((a, b) => b.score - a.score)

	return colored.map((p: any) => {
		const leader = p.score === bestScore ? 'score-leader' : ''
		const AI = p.ai ? '🤖' : ''
		const crown = p.score === bestScore ? '👑' : ''

		return `
			<div class="score-pill ${leader}"
				style="background:${p.bg}; color:${p.fg};">
				<span>${AI}</span>
				<span class="score-name">${p.pseudo.slice(0,8)}</span>
				<span class="score-value">${p.score}</span>
				<span>${crown}</span>
			</div>
		`
	}).join('')
}

function initAnglePlayer(players: any): number
{
	const nbPlayer: number = players.length
	for (let index = 0; index < nbPlayer; index++)
		if (players[index].pseudo === pseudo) return Math.PI * (0.5 - (1 + 2 * index) / nbPlayer)
	return 0
} //initAnglePlayer

function beforeunload(event: BeforeUnloadEvent)
{
	event.preventDefault()
	event.returnValue = ""
}

async function onBackNavigation()
{
	await navigate("lobby")
}

window.addEventListener("beforeunload", beforeunload)
window.addEventListener("popstate", onBackNavigation)

const cleanupGameRemote = () => {
	renderer3D?.destroy()
	ws?.send(json_stringify({type:"navigate", navigate:"quit_game"}))
	ws?.removeEventListener("message", onMessage)
	$pageGameRemote?.removeEventListener("cleanup", cleanupGameRemote);
	document?.removeEventListener("keydown", handleKeyDown)
	document?.removeEventListener("keyup", handleKeyUp)
	LobbyStore.refreshSessionId("")
	resetVictoryState()
	window.removeEventListener("beforeunload", beforeunload)
	window.removeEventListener("popstate", onBackNavigation)
}

$pageGameRemote?.addEventListener("cleanup", cleanupGameRemote)
