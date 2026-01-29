import type { GamePending } from '../../types/message.type.ts'

export type LobbyDuel = {
	from: string
	status: 'pending'
}


export type LobbyState = {
	gamePendings: GamePending[],
	duels: LobbyDuel[],
	sessionId : string
}

type Subscriber = (state: LobbyState) => void

const state: LobbyState = {
	gamePendings: [],
	duels: [],
	sessionId: ""
}

function createLobbyStore()
{
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber)
	{
		subscribers.add(fn)
		fn(state) // 🔥 push initial state
		return () => subscribers.delete(fn)
	}

	function emit()
	{
		for (const fn of subscribers) fn(state)
	}

	function addIncomingDuel(from: string) : boolean
	{
		const exists = state.duels.some(d => d.from === from)
		if (exists) return false

		state.duels.push({ from, status: 'pending' })
		emit()
		return true
	}

	function removeDuel(from: string)
	{
		const exists = state.duels.some(d => d.from === from)
		if (!exists) return true
		state.duels = state.duels.filter(d => d.from !== from)
		emit()
		return false
	}


	// ---- GAME PENDING ----
	function setGamePendings(games: GamePending[])
	{
		state.gamePendings = games
		emit()
	}

	function refreshSessionId(sessionId: string)
	{
		state.sessionId = sessionId
		emit()
	}

	function clearGamePendings()
	{
		state.gamePendings = []
		emit()
	}

	function getState()
	{
		return state
	}

	return {
		subscribe,
		getState,
		setGamePendings,
		clearGamePendings,
		addIncomingDuel,
		removeDuel,
		refreshSessionId
	}
}

declare global {
	interface Window {
		LobbyStore?: ReturnType<typeof createLobbyStore>
	}
}

export const LobbyStore = (window.LobbyStore ??= createLobbyStore())
