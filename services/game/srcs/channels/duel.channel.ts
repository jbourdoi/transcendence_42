import { BunSocketType } from '../types/bunSocket.type'
import User from '../classes/User.js'
import Lobby from '../classes/Lobby.js'
import { DuelType } from '../types/message.type.js'

export function duelChannel(ws: BunSocketType, data: DuelType, lobby : Lobby) {
	const user : User = ws.data.user;
	lobby.handleDuel(user, data)
}
