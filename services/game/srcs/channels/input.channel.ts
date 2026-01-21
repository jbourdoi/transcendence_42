
import { BunSocketType } from '../types/bunSocket.type'
import User from '../classes/User.js'
import Lobby from '../classes/Lobby.js'
import { InputType } from '../types/message.type.js';

export function inputChannel(ws: BunSocketType, data: InputType, lobby : Lobby) {
	const user : User = ws.data.user;
	lobby.handleInputKey(user, data)
}
