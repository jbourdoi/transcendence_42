import { dbPostQuery } from '../services/db.service'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export function isCurrentClientBlocked(blockers: { blocker_username: string }[], username: string): boolean {
	const isBlocked = blockers.findIndex(c => c.blocker_username === username) !== -1
	console.log(`Is ${username} blocked: `, isBlocked)
	return isBlocked
}

export async function isAtLeastOneBlocked(ws: BunSocketType, blocked_user: string, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'SELECT',
			sql: 'SELECT * FROM blocks WHERE (blocker_username = ? AND blocked_username = ?) OR (blocker_username = ? AND blocked_username = ?)',
			data: [ws.data.username, blocked_user, blocked_user, ws.data.username]
		}
	})
	console.log('BLOCK --- isAtLeastOneBlocked: ', res)
	if (res.status >= 400 && res.status !== 404)
	{
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return true
	}
	else if (res.data) {
		data.msg = 'Cannot send friend request. One of the users has blocked the other.'
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return true
	}
	return false
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
	if (res.status >= 400 && res.status !== 404)
	{
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return 'error'
	}
	else if (res.data) {
		data.msg = 'Cannot block user as you have already blocked them. Deblocking the user.'
		data.type = 'info'
		ws.send(JSON.stringify(data))
		return 'true'
	}
	return 'false'
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
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
	console.log('Blocked user removed from DB')
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
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return 'error'
	}
	console.log('Blocked user added to DB')
	return 'true'
}