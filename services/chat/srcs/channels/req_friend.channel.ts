import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export function reqFriendChannel(ws: BunSocketType, data: SocketDataType) {
	let clientFound
	console.log('Friends request')
	for (let client of clientsList) {
		if (client.username === data.msg) {
			clientFound = client
		}
	}
	console.log('Client Found: ', clientFound)
	if (clientFound) {
		//TODO Add to DB the friends req
		data.msg = clientFound.username
		data.type = 'req-friend'
		clientFound.socket.send(JSON.stringify(data))

		data.type = 'notification'
		data.msg = `User ${ws.data.username} wants to be friends!`
		clientFound.socket.send(JSON.stringify(data))
	} else {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
