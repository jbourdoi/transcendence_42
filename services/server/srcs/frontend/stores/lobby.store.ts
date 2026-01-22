import { DuelResponse, DuelType } from '../../types/message.type.ts'

type DuelStore = DuelResponse | DuelType

type Subscriber = (message: DuelStore[]) => void

const duels : DuelStore[] = []

function createLobbyStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(duel: DuelStore[]) {
		for (const fn of subscribers) fn(duel)
	}

	function addDuel(duel: DuelStore)
	{
		duels.push(duel)
		console.log("lobbystore, duels", duels)
	}

	function getDuels() {
		return duels
	}

	return { subscribe, emit, getDuels, addDuel }
}

declare global {
	interface Window {
		LobbyStore?: ReturnType<typeof createLobbyStore>
	}
}

export const LobbyStore = (window.LobbyStore ??= createLobbyStore())
