import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { ClientType } from '../types/client.type'
import { SocketDataType } from '../types/socketData.type'

export function blockUserChannel(ws: BunSocketType, data: SocketDataType) {
	let clientFound: ClientType
	console.log('Block user')
	for (let client of clientsList) {
		if (client.username === data.msg) {
			clientFound = client
		}
	}
	console.log('Client Found: ', clientFound)
	if (clientFound) {
		//TODO Add to DB the blocked user
		// If client is blocked properly
		data.msg = `User ${clientFound.username} has been blocked`
		data.type = 'notification'
		data.notificationLevel = 'error'
		ws.send(JSON.stringify(data))
	} else {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
