import { json_stringify } from '../functions/json_wrapper.js'
import { KeyType, StatusType } from '../types/message.type.js'
import { BunSocketType } from '../types/bunSocket.type.js'

export default class User {
	public pseudo: string
	public socket: BunSocketType
	public status: StatusType = 'chat'
	public navigate: string = ""
	public key: KeyType = 'none'
	constructor(public readonly id: string, pseudo: string | undefined)
	{
		this.navigate = "game"
		this.pseudo = pseudo?.trim() || `Player-${Math.floor(Math.random() * 1000)}`
		this.socket = undefined
		console.log(`new user ${this.id} ${this.pseudo}`)
	}

	send(data: any) {
		if (this.isConnected()) {
			this.socket?.send(json_stringify(data))
		}
	}

	close(reason?: string) {
		this.socket?.close(1000, reason)
	}

	isConnected() {
		return (this.socket?.readyState === WebSocket.OPEN)
	}

	isInGame() {
		return (this.isConnected() && this.navigate === "game")
	}

	toJSON() {
		return {
			pseudo: this.pseudo,
			connected: this.isConnected(),
			status: this.status
		}
	}
}
