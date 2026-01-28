import Lobby from '../classes/Lobby.js'
import { BunSocketType } from '../types/bunSocket.type'
import { AuthType } from '../types/message.type.js'

export function authChannel(ws: BunSocketType, data: AuthType, lobby : Lobby) {
	ws.data.username = data.username
	const user = lobby.createUser(data.username)
	user.socket = ws
	ws.data.user = user
}
