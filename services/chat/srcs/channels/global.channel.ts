import { clientsSocket } from '../state/clients.state'

export function globalChannel(message: string | Buffer<ArrayBuffer>) {
	// TODO Get user blocked list and don't send message to socket
	for (const client of clientsSocket) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message)
		}
	}
}
