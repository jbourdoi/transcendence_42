import Lobby from "../classes/Lobby.js"
import User from "../classes/User.js"
import { BunSocketType } from "../types/bunSocket.type.js"
import { json_stringify } from "../functions/json_wrapper.js"
import { LeaveGameType } from "../types/message.type.js"

export function leaveGameChannel(
	ws: BunSocketType,
	_data: LeaveGameType,
	lobby: Lobby
)
{
	const user: User = ws.data.user

	const success = lobby.gameManager.leaveSession(user)

	// if (!success)
	// {
	// 	return ws.send(json_stringify({
	// 		type: "error",
	// 		text: "You are not waiting in a game"
	// 	}))
	// }

	ws.send(json_stringify({type: "session-id", sessionId: ""}));

	lobby.broadcast({
		type: "list-game",
		games: lobby.gameManager.getJoinableSessionsInfo()
	})
}
