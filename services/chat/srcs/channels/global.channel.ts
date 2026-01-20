import { dbPostQuery } from '../services/db.service'
import { clientsSocket } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'

function isClientBlocked(blockedClients: { blocked_username: string }[], username: string): boolean {
	const isBlocked = blockedClients.findIndex(c => c.blocked_username === username) !== -1
	console.log(`Is ${username} blocked: `, isBlocked)
	return isBlocked
}

export async function globalChannel(ws: BunSocketType, message: string | Buffer<ArrayBuffer>) {
	const res = await dbPostQuery({
		endpoint: 'dbAll',
		query: {
			verb: 'SELECT',
			sql: 'SELECT blocked_username FROM blocks WHERE blocker_username = ?',
			data: [ws.data.username]
		}
	})
	if (res.status >= 400) {
		console.log('status: ', res.status, 'message: ', res.message)
		return
	}
	const clients = res.data as { blocked_username: string }[]
	console.log('Clients blocked: ', clients)
	for (const client of clientsSocket) {
		if (client.readyState === WebSocket.OPEN && !isClientBlocked(clients, client.data.username)) {
			client.send(message)
		}
	}
}
