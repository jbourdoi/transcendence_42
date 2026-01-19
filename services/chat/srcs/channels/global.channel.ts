import { clientsSocket } from '../state/clients.state'

export function globalChannel(message: string | Buffer<ArrayBuffer>) {
	for (const client of clientsSocket) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message)
		}
	}
}
