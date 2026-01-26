import { dbPostQuery } from '../services/db.service'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export function isCurrentClientBlocked(blockers: { blocker_username: string }[], username: string): boolean {
	const isBlocked = blockers.findIndex(c => c.blocker_username === username) !== -1
	console.log(`Is ${username} blocked: `, isBlocked)
	return isBlocked
}

export async function isAtLeastOneBlocked(ws: BunSocketType, blocked_user: string, data: SocketDataType): Promise<string> {
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'SELECT',
			sql: 'SELECT * FROM blocks WHERE (blocker_username = ? AND blocked_username = ?) OR (blocker_username = ? AND blocked_username = ?)',
			data: [ws.data.username, blocked_user, blocked_user, ws.data.username]
		}
	})
	console.log('BLOCK --- isAtLeastOneBlocked: ', res)
	if (res.status == 404)
		return 'false' // no blocks found
	else if (res.status >= 400)
	{
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = res.message
		ws.send(JSON.stringify(data))
		return 'error'
	}
	return 'true'
}

export async function isDoubleBlock(ws: BunSocketType, friend: string, data: SocketDataType): Promise<string> {
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'SELECT',
			sql: 'SELECT * FROM blocks WHERE blocker_username = ? AND blocked_username = ?',
			data: [ws.data.username, friend]
		}
	})
	console.log('BLOCK --- isDoubleBlock: ', res)
	if (res.status == 404)
		return 'false' // no block found
	else if (res.status >= 400)
	{
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = res.message
		ws.send(JSON.stringify(data))
		return 'error'
	}
	return 'true'
}

export async function deblockUser(ws: BunSocketType, blocked_user: string, data: SocketDataType) {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'DELETE',
			sql: 'DELETE FROM blocks WHERE blocker_username = ? AND blocked_username = ?',
			data: [ws.data.username, blocked_user]
		}
	})
	console.log('REMOVE --- deblockUser: ', res)
	if (res.status >= 400) {
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = res.message
		ws.send(JSON.stringify(data))
		return
	}
	console.log('Blocked user removed from DB')
	data.type = 'notification'
	data.notificationLevel = 'info'
	data.msg = `User ${blocked_user} has been unblocked.`
	ws.send(JSON.stringify(data))
}

export async function blockUser(ws: BunSocketType, blocked_user: string, data: SocketDataType): Promise<string> {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'INSERT',
			sql: 'INSERT INTO blocks (blocker_username, blocked_username) VALUES (?, ?)',
			data: [ws.data.username, blocked_user]
		}
	})
	if (res.status >= 400) {
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = res.message
		ws.send(JSON.stringify(data))
		return 'error'
	}
	console.log('Blocked user added to DB')
	data.type = 'notification'
	data.notificationLevel = 'info'
	data.msg = `User ${blocked_user} has been blocked.`
	ws.send(JSON.stringify(data))

	return 'true'
}