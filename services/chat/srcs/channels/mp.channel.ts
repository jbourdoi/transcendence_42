import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { ClientType } from '../types/client.type'
import { SocketDataType } from '../types/socketData.type'

export function mpChannel(ws: BunSocketType, data: SocketDataType, message: string | Buffer<ArrayBuffer>) {
	let clientFound: ClientType
	// TODO Get user blocked list and don't send message to socket
	for (let client of clientsList) {
		if (client.username === data.to) {
			clientFound = client
		}
	}
	if (clientFound) {
		clientFound.socket.send(message)
		ws.send(message)
	} else {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
