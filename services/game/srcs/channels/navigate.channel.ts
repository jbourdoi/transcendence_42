import User from '../classes/User.js';
import { BunSocketType } from '../types/bunSocket.type'
import { NavigateType } from '../types/message.type.js'

export function navigateChannel(ws: BunSocketType, data: NavigateType)
{
	let currentUser : User = ws.data.user
	if (!currentUser) return ;

	if (currentUser.status === "game")
	{
		console.log(`${ws.data.user.pseudo} navigate to '${data.navigate}'`)
		currentUser.navigate = data.navigate;
	}
}
