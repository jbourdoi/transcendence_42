import { isAtLeastOneBlocked } from '../crud/block.crud'
import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { ClientType } from '../types/client.type'
import { SocketDataType } from '../types/socketData.type'

export async function mpChannel(ws: BunSocketType, data: SocketDataType, message: string | Buffer<ArrayBuffer>) {
	let clientFound: ClientType
	for (let client of clientsList) {
		if (client.username === data.to) {
			clientFound = client
		}
	}
	if (clientFound && !await isAtLeastOneBlocked(ws, data.to, data)) {
		clientFound.socket.send(message)
		ws.send(message)
	} else if (!clientFound) {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
