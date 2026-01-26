import { sendUserList } from '../functions/sendUserList.fn'
import { clientsSocket } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export function authChannel(ws: BunSocketType, data: SocketDataType) {
	for (const socket of clientsSocket) {
		console.log('Client:', socket.data.username, 'Incoming:', data.username, socket.data.username === data.username)

		if (socket.data.username === data.username) {
			console.log('Deleting client:', socket.data.username)
			socket.close(1000, 'Logged in from another device')
			clientsSocket.delete(socket)
			break
		}
	}
	ws.data.username = data.username
	clientsSocket.add(ws)

	for (const socket of clientsSocket) {
		socket.send(
			JSON.stringify({
				type: 'info',
				msg: `Player ${data.username} has connected`
			})
		)
	}

	sendUserList()
}
