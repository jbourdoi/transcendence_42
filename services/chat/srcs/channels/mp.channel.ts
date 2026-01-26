import { isAtLeastOneBlocked } from '../crud/block.crud'
import { clientsSocket } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export async function mpChannel(ws: BunSocketType, data: SocketDataType, message: string | Buffer<ArrayBuffer>) {
	let clientFound: BunSocketType
	for (let client of clientsSocket) {
		if (client.data.username === data.to) {
			clientFound = client
		}
	}
	const blockedStatus = await isAtLeastOneBlocked(ws, data.to, data)
	if (blockedStatus === 'error') return
	if (blockedStatus === 'true') {
		data.type = 'error'
		data.msg = `Cannot send message. You or user ${data.to} has blocked the other.`
		ws.send(JSON.stringify(data))
		return
	}
	if (clientFound && blockedStatus == 'false') {
		clientFound.send(message)
		ws.send(message)
	} else if (!clientFound) {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
