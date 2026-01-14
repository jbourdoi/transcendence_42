import { v4 as uuidv4 } from 'uuid'
import { type MessageType } from '../../types/chat.type'

type Subscriber = (message: MessageEvent<any>) => void

const ws = new WebSocket('ws://localhost:4444')

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
		emit(JSON.parse(event.data))
	}

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(message: MessageEvent<any>) {
		for (const fn of subscribers) fn(message)
	}

	function send(message: MessageType) {
		ws.send(JSON.stringify(message))
	}

	return { subscribe, emit, send }
}

declare global {
	interface Window {
		ChatStore?: ReturnType<typeof createChatStore>
	}
}

export const ChatStore = (window.ChatStore ??= createChatStore())
