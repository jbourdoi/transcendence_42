import { BunSocketType } from '../types/bunSocket.type'
import { NavigateType } from '../types/message.type.js'

export function navigateChannel(ws: BunSocketType, data: NavigateType) {
	console.log(`${ws.data.user.pseudo} navigate to '${data.navigate}'`)
	 ws.data.user.navigate = data.navigate;
}
