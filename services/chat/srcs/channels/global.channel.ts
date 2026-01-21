import { dbPostQuery } from '../services/db.service'
import { clientsSocket } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { isCurrentClientBlocked } from '../crud/block.crud'

export async function globalChannel(ws: BunSocketType, message: string | Buffer<ArrayBuffer>) {
	const res = await dbPostQuery({
		endpoint: 'dbAll',
		query: {
			verb: 'SELECT',
			sql: 'SELECT blocker_username FROM blocks WHERE blocked_username = ?',
			data: [ws.data.username]
		}
	})
	if (res.status >= 400) {
		console.log('status: ', res.status, 'message: ', res.message)
		return
	}
	const blockers = res.data as { blocker_username: string }[]
	console.log('Clients blockers: ', blockers)
	for (const client of clientsSocket) {
		if (client.readyState === WebSocket.OPEN && !isCurrentClientBlocked(blockers, client.data.username)) {
			client.send(message)
		}
	}
}
