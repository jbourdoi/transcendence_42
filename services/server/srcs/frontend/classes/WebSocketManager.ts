// const websocketHost = "localhost:3333";
const websocketHost = `${location.host}/gamews`
// ws = new WebSocket(`wss://${location.host}/gamews`)

type EventType = 'chat' | 'game'
type Listener = (payload: any) => void

export class WebSocketManager {
	private static instance: WebSocketManager
	private socket: WebSocket | null = null

	private listeners: Map<EventType, Set<Listener>> = new Map()

	private reconnectAttempts = 0
	private manualClose = false

	private constructor() {}

	public static getInstance(): WebSocketManager {
		if (!WebSocketManager.instance) {
			WebSocketManager.instance = new WebSocketManager()
		}
		return WebSocketManager.instance
	}

	// -------------------------
	// PUBLIC API
	// -------------------------

	public on(eventType: EventType, callback: Listener) {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set())
		}
		this.listeners.get(eventType)!.add(callback)
	}

	public off(eventType: EventType, callback: Listener) {
		this.listeners.get(eventType)?.delete(callback)
	}

	public send(data: any) {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			console.warn("[WS] Can't send: socket not open")
			return
		}
		this.socket.send(JSON.stringify(data))
	}

	public getSocket(): WebSocket {
		if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
			this.connect()
		}
		return this.socket!
	}

	public close() {
		this.manualClose = true
		this.socket?.close()
	}

	// -------------------------
	// INTERNAL
	// -------------------------

	private getUserId(): string | null {
		return localStorage.getItem('userID')
	}

	private getReconnectDelay(): number {
		return Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
	}

	private connect() {
		const userId = this.getUserId()
		if (!userId) {
			console.warn('[WS] No userId yet → retry in 1s')
			setTimeout(() => this.connect(), 1000)
			return
		}

		this.socket = new WebSocket(`wss://${websocketHost}/api/ws?userId=${userId}`)

		this.socket.addEventListener('open', () => {
			console.log('[WS] Connected')
			this.reconnectAttempts = 0
		})

		this.socket.addEventListener('message', ev => {
			this.handleMessage(ev.data)
		})

		this.socket.addEventListener('close', () => {
			console.warn('[WS] Closed')

			if (!this.manualClose) {
				this.scheduleReconnect()
			}
		})

		this.socket.addEventListener('error', err => {
			console.error('[WS] Error', err)
		})
	}

	private scheduleReconnect() {
		this.reconnectAttempts++
		const delay = this.getReconnectDelay()
		console.warn(`[WS] Reconnecting in ${delay / 1000}s...`)

		setTimeout(() => this.connect(), delay)
	}

	private handleMessage(raw: string) {
		let msg: any

		try {
			msg = JSON.parse(raw)
		} catch {
			console.error('[WS] Invalid JSON:', raw)
			return
		}

		const { type, payload } = msg

		if (!this.listeners.has(type)) {
			console.warn(`[WS] No listeners for event type "${type}"`)
			return
		}

		for (const listener of this.listeners.get(type)!) {
			listener(payload)
		}
	}
}
