import { FrontType, MessageType } from '../../types/message.type.ts'
import { UserStore } from './user.store'
import { NotificationStore } from './notification.store'
import { json_parse, json_stringify } from '../functions/json_wrapper.ts'
import { navigate } from '../js/routing.ts'
import { LobbyStore } from './lobby.store.ts'

type Subscriber = (message: MessageType[]) => void

let ws: WebSocket | null = null

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
		if (ws && ws.readyState === WebSocket.OPEN) ws.send(json_stringify(message))
	}

	function removeWebGameSocket() {
		ws?.close()
		ws = null
	}

	function addWebGamesocket(username: string){
		if (ws !== null) return;
		ws = new WebSocket(`wss://${location.host}/gamews`);
		ws.onopen = e => {
				if (!ws) return ;
				ws.send(json_stringify({type: 'auth',username: UserStore.getUserName()}));
			}
		ws.onmessage = e => {
			const message: FrontType = json_parse(e.data) as FrontType
			if (!message) return
			switch (message.type)
			{
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
					LobbyStore.refreshSessionId("")
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
				case 'list-user':
				{
					return (LobbyStore.setUserList(message.users));
				}
				case 'duel':
				{
					switch (message.action)
					{
						case 'accept':
						{
							if (LobbyStore.removeDuel(message.from))
								NotificationStore.notify(`${message.from} accept you duel`, "INFO");
							return ;
						}
						case 'decline':
						{
							if (LobbyStore.removeDuel(message.from))
								NotificationStore.notify(`Duel has been declined from ${message.from}`, "INFO");
							return ;
						}
						case 'propose':
						{
							if (LobbyStore.addIncomingDuel(message.from))
								NotificationStore.notify(`${message?.from} send you a duel`, "INFO");
							return ;
						}
					}
				}
			}
		}
		ws.onclose = e => {
			NotificationStore.notify("You are now logged out.", "INFO")
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
