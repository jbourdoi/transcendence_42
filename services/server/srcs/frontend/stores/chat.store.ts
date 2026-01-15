import { v4 as uuidv4 } from 'uuid'
import { type MessageType } from '../../types/chat.type'

type Subscriber = (message: MessageType[]) => void

const ws = new WebSocket('ws://localhost:4444')

const chats: MessageType[] = []

ws.addEventListener('open', () => {
	ws.send(
		JSON.stringify({
			type: 'auth',
			userId: uuidv4()
		})
	)
})

function createChatStore() {
	const subscribers = new Set<Subscriber>()

	ws.onmessage = event => {
		const msg = JSON.parse(event.data)
		if (msg.type === 'system') return
		chats.push(msg)
		emit(chats)
	}

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(chat: MessageType[]) {
		for (const fn of subscribers) fn(chat)
	}

	function send(message: MessageType) {
		ws.send(JSON.stringify(message))
	}

	function getChats() {
		return chats
	}

	return { subscribe, emit, send, getChats }
}

declare global {
	interface Window {
		ChatStore?: ReturnType<typeof createChatStore>
	}
}

export const ChatStore = (window.ChatStore ??= createChatStore())
