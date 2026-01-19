import { sendUserList } from '../functions/sendUserList.fn'
import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export function authChannel(ws: BunSocketType, data: SocketDataType) {
	ws.data.username = data.username
	for (let client of clientsList) {
		data.msg = `Player ${data.username} has connected`
		data.type = 'info'
		client.socket.send(JSON.stringify(data))
	}
	clientsList.add({
		socket: ws,
		username: data.username
	})
	sendUserList()
}
