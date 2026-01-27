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
			ws.onopen = e => {
				if (!ws) return NotificationStore.notify("Network error, websocket shutdown", "ERROR");
				ws.send(json_stringify({type: 'auth',username: UserStore.getUserName()}));
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
					case 'start-game':
					{
						NotificationStore.notify("start_remote_game", "SUCCESS");
						return navigate('remote_game');
					}
					case 'list-game':
					{
						return (LobbyStore.setGamePendings(message.games))
					}
					case 'duel':
					{
						if (!ws) return
						switch (message.action)
						{
							case 'accept':
							{
								LobbyStore.removeDuel(message.from);
								NotificationStore.notify(`${message.from} accept you duel`, "INFO")
								return navigate('remote_game')
							}
							case 'decline':
							{
								LobbyStore.removeDuel(message.from)
								return NotificationStore.notify(`Duel has been declined from ${message.from}`, "INFO")
							}
							case 'propose':
							{
								LobbyStore.addIncomingDuel(message.from)
								return NotificationStore.notify(`${message?.from} send you a duel`, "INFO")
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
		ws.send(json_stringify(message))
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
