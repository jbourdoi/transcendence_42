import { type MessageType } from '../../types/message.type.ts'
import { UserStore } from './user.store'
import { NotificationStore } from './notification.store'

type Subscriber = (message: MessageType[]) => void

let ws: WebSocket | null = null

const games: MessageType[] = []

if (ws === null) {
	UserStore.subscribe(userStore => {
		if (userStore.isValid) {
			ws = new WebSocket('ws://localhost:3333')
			if (ws === null) return
			console.log("gamesocket created")
			ws.addEventListener('open', () => {
				if (ws === null) return
				ws.send(
					JSON.stringify({
						type: 'auth',
						username: UserStore.getUserName()
					})
				)
			})
			ws.onmessage = event => {
				const msg = JSON.parse(event.data)
				console.log(msg)
			}
		}
	})
}

function createGameStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(game: MessageType[]) {
		for (const fn of subscribers) fn(game)
	}

	function send(message: MessageType) {
		if (ws === null) return
		ws.send(JSON.stringify(message))
	}

	function getGames() {
		return games
	}

	return { subscribe, emit, send, getGames }
}

declare global {
	interface Window {
		GameStore?: ReturnType<typeof createGameStore>
	}
}

export const GameStore = (window.GameStore ??= createGameStore())
