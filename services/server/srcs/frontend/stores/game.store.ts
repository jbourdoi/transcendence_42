import { FrontType, MessageType } from '../../types/message.type.ts'
import { UserStore } from './user.store'
import { NotificationStore } from './notification.store'
import { json_parse, json_stringify } from '../functions/json_wrapper.ts'
import { navigate } from '../js/routing.ts'
import { LobbyStore } from './lobby.store.ts'

type Subscriber = (message: MessageType[]) => void

let ws: WebSocket | null = null

// if (!ws) {
// 	UserStore.subscribe(userStore => {
// 		if (userStore.isValid) {
// 			ws = new WebSocket(`wss://${location.host}/gamews`)
// 			// ws = new WebSocket('ws://localhost:3333')
// 			if (!ws) return NotificationStore.notify("Network error, websocket shutdown 1", "ERROR");
// 			ws.onopen = e => {
// 				if (!ws) return NotificationStore.notify("Network error, websocket shutdown 2", "ERROR");
// 				ws.send(json_stringify({type: 'auth',username: UserStore.getUserName()}));
// 			}
// 			ws.onmessage = e => {
// 				const message: FrontType = json_parse(e.data) as FrontType
// 				if (!message) return
// 				switch (message.type) {
// 					case 'error':
// 					if (message.text && message.text != "undefined")
// 					{
// 						NotificationStore.notify(message.text, "ERROR")
// 					}
// 					return ;
// 					case 'system':
// 					if (message.text && message.text != "undefined")
// 					{
// 						NotificationStore.notify(message.text, "INFO")
// 					}
// 					return ;
// 					case 'info':
// 					if (message.text && message.text != "undefined")
// 					{
// 						NotificationStore.notify(message.text, "INFO")
// 					}
// 					return ;
// 					case 'start-game':
// 					{
// 						NotificationStore.notify("START remote game", "SUCCESS");
// 						return navigate('remote_game');
// 					}
// 					case 'session-id':
// 					{
// 						return (LobbyStore.refreshSessionId(message.sessionId));
// 					}
// 					case 'list-game':
// 					{
// 						return (LobbyStore.setGamePendings(message.games))
// 					}
// 					case 'duel':
// 					{
// 						switch (message.action)
// 						{
// 							case 'accept':
// 							{
// 								LobbyStore.removeDuel(message.from);
// 								return NotificationStore.notify(`${message.from} accept you duel`, "INFO")
// 							}
// 							case 'decline':
// 							{
// 								LobbyStore.removeDuel(message.from)
// 								return NotificationStore.notify(`Duel has been declined from ${message.from}`, "INFO")
// 							}
// 							case 'propose':
// 							{
// 								LobbyStore.addIncomingDuel(message.from)
// 								return NotificationStore.notify(`${message?.from} send you a duel`, "INFO")
// 							}
// 						}
// 					}
// 				}
// 			}
// 			ws.onclose = e => {
// 				NotificationStore.notify("WebSocket closed", "INFO")
// 			}
// 		}
// 	})
// }

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

	function removeWebGameSocket() {
		ws?.close()
		ws = null
	}

	function addWebGamesocket(username: string){
		if (ws !== null) return;
		ws = new WebSocket(`wss://${location.host}/gamews`);
		ws.onopen = e => {
				if (!ws) return NotificationStore.notify("Network error, websocket shutdown 2", "ERROR");
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
				}
				return ;
				case 'system':
				if (message.text && message.text != "undefined")
				{
					NotificationStore.notify(message.text, "INFO")
				}
				return ;
				case 'info':
				if (message.text && message.text != "undefined")
				{
					NotificationStore.notify(message.text, "INFO")
				}
				return ;
				case 'start-game':
				{
					NotificationStore.notify("START remote game", "SUCCESS");
					return navigate('remote_game');
				}
				case 'session-id':
				{
					return (LobbyStore.refreshSessionId(message.sessionId));
				}
				case 'list-game':
				{
					return (LobbyStore.setGamePendings(message.games))
				}
				case 'duel':
				{
					switch (message.action)
					{
						case 'accept':
						{
							LobbyStore.removeDuel(message.from);
							return NotificationStore.notify(`${message.from} accept you duel`, "INFO")
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
			NotificationStore.notify("WebGameSocket OFF", "INFO")
		}
	}

	function getWebGameSocket() {
		return ws
	}

	return { subscribe, emit, send, getWebGameSocket, removeWebGameSocket, addWebGamesocket }
}

declare global {
	interface Window {
		GameStore?: ReturnType<typeof createGameStore>
	}
}

export const GameStore = (window.GameStore ??= createGameStore())
