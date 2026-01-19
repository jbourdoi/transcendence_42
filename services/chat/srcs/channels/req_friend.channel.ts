import { dbPostQuery } from '../services/db.service'
import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { ClientType } from '../types/client.type'
import { SocketDataType } from '../types/socketData.type'

export async function reqFriendChannel(ws: BunSocketType, data: SocketDataType) {
	let clientFound: ClientType
	console.log('Friends request')
	for (let client of clientsList) {
		if (client.username === data.msg) {
			clientFound = client
		}
	}
	console.log('Client Found: ', clientFound)
	if (clientFound) {
		const res = await dbPostQuery({
			endpoint: 'dbRun',
			query: {
				verb: 'INSERT',
				sql: 'INSERT INTO friend_requests (from_username, to_username) VALUES (?, ?)',
				data: [ws.data.username, clientFound.username]
			}
		})
		if (res.status >= 400) console.log('status: ', res.status, 'message: ', res.message)
		console.log('Friend request sent to DB: ', res)
		data.msg = clientFound.username
		data.type = 'req-friend'
		clientFound.socket.send(JSON.stringify(data))

		data.type = 'notification'
		data.notificationLevel = 'info'
		data.msg = `User ${ws.data.username} wants to be friends!`
		clientFound.socket.send(JSON.stringify(data))
		
		data.msg = `Friend request sent to ${ws.data.username}!`
		ws.send(JSON.stringify(data))
	} else {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
