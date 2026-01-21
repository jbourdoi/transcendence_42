import { FrontType, type MessageType } from '../../types/message.type.ts'
import { UserStore } from './user.store'
import { NotificationStore } from './notification.store'
import { json_parse, json_stringify } from '../functions/json_wrapper.ts'
import { launchGame, playRemote } from '../functions/GameClientBab.ts'
import { navigate } from '../js/routing.ts'

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
			ws.onmessage = e => {
				const message: FrontType = json_parse(e.data) as FrontType
						console.log(message)
						if (!message) return
						switch (message.type) {
							case 'error':
								return console.warn('received:', message.text)
							case 'system':
								return console.warn('received:', message.text)

							case 'duel': {
								if (!ws) return
								switch (message.action) {
									case 'accept':
										return navigate('game')
									case 'decline':
										return console.log(`duel has been declined from ${message.from}`)
									case 'propose': {
										if (confirm(`${message?.from} send you a duel, do you accept?`))
										{
											ws.send(json_stringify({ type: 'duel', to: message?.from, action: 'accept' }));
											return navigate('game');
										} else return ws.send(json_stringify({ type: 'duel', to: message?.from, action: 'decline' }))
									}
								}
							}
						}
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

	function getSocket() {
		return ws
	}

	return { subscribe, emit, send, getSocket }
}

declare global {
	interface Window {
		GameStore?: ReturnType<typeof createGameStore>
	}
}

export const GameStore = (window.GameStore ??= createGameStore())
