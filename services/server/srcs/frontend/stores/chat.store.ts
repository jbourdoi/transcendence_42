import { type MessageType } from '../../types/chat.type'
import { NotificationStore } from './notification.store'
import { PageUpdateStore } from './page_state'
import { UserStore } from './user.store'

type Subscriber = (message: MessageType[]) => void

let ws: WebSocket | null = null

const chats: MessageType[] = []

function createChatStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(chat: MessageType[]) {
		for (const fn of subscribers) fn(chat)
	}

	function send(message: MessageType) {
		if (ws === null) return
		ws.send(JSON.stringify(message))
	}

	function addWebsocket(username: string) {
		if (ws !== null) return
		ws = new WebSocket(`wss://${location.host}/chatws`)
		ws.addEventListener('open', () => {
			if (ws === null) return
			ws.send(
				JSON.stringify({
					type: 'auth',
					username
				})
			)
		})
		ws.onmessage = event => {
			const msg = JSON.parse(event.data)

			if (msg.type === 'mp' && PageUpdateStore.getPageName() !== 'chat' && UserStore.getUserName() === msg.to) {
				let msgContent: string = msg.msg
				if (msg.msg.length > 10) {
					msgContent = msgContent.slice(0, 10)
					msgContent += '...'
				}
				NotificationStore.notify(`${msg.user} mp: ${msgContent}`, 'INFO')
			}

			if (msg.type === 'system') return
			if (msg.type === 'req-friend') {
				return
			}
			if (msg.type === 'notification') {
				NotificationStore.notify(msg.msg, 'INFO')
				return
			}
			chats.push(msg)
			ChatStore.emit(chats)
		}
		ws.onclose = event => {}
	}

	function removeWebsocket() {
		ws?.close()
		ws = null
	}

	function getChats() {
		return chats
	}

	return { subscribe, emit, send, getChats, addWebsocket, removeWebsocket }
}

declare global {
	interface Window {
		ChatStore?: ReturnType<typeof createChatStore>
	}
}

export const ChatStore = (window.ChatStore ??= createChatStore())
