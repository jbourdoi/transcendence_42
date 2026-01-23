import { RemoteGame } from '../classes/RemoteGame.js'
import Lobby from '../classes/Lobby.js'
import User from '../classes/User.js'
import { json_stringify } from '../functions/json_wrapper.js'
import { BunSocketType } from '../types/bunSocket.type'
import { CreateGameType } from '../types/message.type.js'

export function createGameChannel(ws: BunSocketType, data: CreateGameType, lobby : Lobby)
{
	const currentUser : User = ws.data.user;
	const { comCount, playersCount } = data.gameInit
	console.log(`${ws.data.username} create game: `, data.gameInit);
	if (playersCount === 1)
	{
		if (comCount < 1 || comCount > 7)
			return ws.send(json_stringify({
				type: "error",
				text: `Too many or too few players`
		}))
		let users : User[] = []
		users.push(currentUser)
		for (let i=0; i < comCount; i++)
		{
			users.push(new User("", `bot_${i}`));
		}
		new RemoteGame(users);
		return ws.send(json_stringify({
			type: 'start-game',
			text: ""
		}))
	}
}
