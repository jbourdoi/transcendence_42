import { clientsSocket } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'

export function globalChannel(ws: BunSocketType, message: string | Buffer<ArrayBuffer>) {
	// TODO Get user blocked list and don't send message to socket
	// ws.data.username Proprio de la websocket
	for (const client of clientsSocket) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message)
		}
	}
}
