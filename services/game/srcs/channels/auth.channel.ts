import Lobby from '../classes/Lobby.js'
import { sendUserList } from '../functions/sendUserList.fn'
import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { AuthType, InfoType, MessageType } from '../types/message.type.js'

export function authChannel(ws: BunSocketType, data: AuthType, lobby : Lobby) {
	ws.data.username = data.username
	const user = lobby.createUser(data.username)
	user.socket = ws
	ws.data.user = user
	const info : InfoType = {
		msg : `Player ${data.username} has connected`,
		type: 'info'
	}
	for (let client of clientsList) {
		client.socket.send(JSON.stringify(info))
	}
	clientsList.add({
		socket: ws,
		username: data.username
	})
	sendUserList()
}
