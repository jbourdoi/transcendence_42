import { DuelType, FrontType, type MessageType } from '../../types/message.type.ts'
import { UserStore } from './user.store'
import { NotificationStore } from './notification.store'
import { json_parse, json_stringify } from '../functions/json_wrapper.ts'
import { navigate } from '../js/routing.ts'
import { LobbyStore } from './lobby.store.ts'

type Subscriber = (message: MessageType[]) => void

let ws: WebSocket | undefined = undefined

if (!ws) {
	UserStore.subscribe(userStore => {
		if (userStore.isValid) {
			ws = new WebSocket(`wss://${location.host}/gamews`)
			// ws = new WebSocket('ws://localhost:3333')
			if (!ws) return NotificationStore.notify("Network error, websocket shutdown", "ERROR");
			console.log("gamesocket created")
			ws.onopen = e => {
				if (!ws) return NotificationStore.notify("Network error, websocket shutdown", "ERROR");
				ws.send(JSON.stringify({type: 'auth',username: UserStore.getUserName()}))
			}
			ws.onmessage = e => {
				const message: FrontType = json_parse(e.data) as FrontType
				if (!message) return
				switch (message.type) {
					case 'error':
					if (message.text && message.text != "undefined")
					{
						NotificationStore.notify(message.text, "ERROR")
						console.warn('received:', message.text)
					}
					return ;
					case 'system':
					if (message.text && message.text != "undefined")
					{
						NotificationStore.notify(message.text, "INFO")
						console.warn('received:', message.text)
					}
					return ;
					case 'duel':
					{
						if (!ws) return
						switch (message.action)
						{
							case 'accept':
								NotificationStore.notify(`${message.from} accept you duel`, "INFO")
								LobbyStore.addDuel(message)
								return navigate('game')
							case 'decline':
								LobbyStore.addDuel(message)
								return NotificationStore.notify(`duel has been declined from ${message.from}`, "INFO")
								// return console.log(`duel has been declined from ${message.from}`)
							case 'propose': {
								NotificationStore.notify(`${message?.from} send you a duel, do you accept?`, "INFO")
								LobbyStore.addDuel(message)
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
			ws.onclose = e => {
				NotificationStore.notify("WebSocket closed", "INFO")
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
		if (!ws || ws.readyState >= WebSocket.CLOSING) return NotificationStore.notify("Network error, websocket shutdown", "ERROR")
		ws.send(JSON.stringify(message))
	}

	function closeSocket() {
		ws?.close()
	}

	function getSocket() {
		return ws
	}

	return { subscribe, emit, send, getSocket, closeSocket }
}

declare global {
	interface Window {
		GameStore?: ReturnType<typeof createGameStore>
	}
}

export const GameStore = (window.GameStore ??= createGameStore())
