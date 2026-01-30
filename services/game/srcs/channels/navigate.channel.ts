import User from '../classes/User.js';
import { BunSocketType } from '../types/bunSocket.type'
import { NavigateType } from '../types/message.type.js'

export function navigateChannel(ws: BunSocketType, data: NavigateType)
{
	let currentUser : User = ws.data.user
	if (!currentUser) return ;

	currentUser.navigate = data.navigate
	if (currentUser.status === "game")
	{
		console.log(`${ws.data.user.pseudo} navigate to '${data.navigate}'`)
	}
	else
	{
		if (data.navigate === "tournament")
			currentUser.status = "tournament";
		else if (data.navigate === "local_game")
			currentUser.status = "local_game"
	}
}
