import { dbPostQuery } from '../services/db.service'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export async function isFriend(ws: BunSocketType, friend: string, data: SocketDataType): Promise<string> {
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'SELECT',
			sql: 'SELECT * FROM friendships WHERE (username_1 = ? AND username_2 = ?) OR (username_1 = ? AND username_2 = ?)',
			data: [ws.data.username, friend, friend,  ws.data.username]
		}
	})
	console.log('INSERT FRIEND REQUEST --- isFriend: ', res)
	if (res.status >= 400 && res.status !== 404)
	{
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = res.message
		ws.send(JSON.stringify(data))
		return 'error'
	}
	else if (res.data) {
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = `You and user ${friend} are already friends.`
		ws.send(JSON.stringify(data))
		return 'true'
	}
	return 'false'
}

export async function insertFriendship(ws: BunSocketType, new_friend: BunSocketType, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'INSERT',
			sql: 'INSERT INTO friendships (username_1, username_2) VALUES (?, ?)',
			data: [ws.data.username, new_friend.data.username]
		}
	})
	console.log('INSERT FRIEND REQUEST --- insertFriendship: ', res)
	if (res.status >= 400) {
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = res.message
		ws.send(JSON.stringify(data))
		return false
	}
		data.type = 'notification'
		data.notificationLevel = 'info'
		data.msg = `You and user ${ws.data.username} are now friends!`
		new_friend.send(JSON.stringify(data))

		data.msg = `You and user ${new_friend.data.username} are now friends!`
		ws.send(JSON.stringify(data))
	return true
}

export async function removeFromFriendships(ws: BunSocketType, friend: BunSocketType, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'DELETE',
			sql: 'DELETE FROM friendships WHERE (username_1 = ? AND username_2 = ?) OR (username_1 = ? AND username_2 = ?)',
			data: [ws.data.username, friend.data.username, friend.data.username, ws.data.username]
		}
	})
	console.log('REMOVE --- removeFromFriendships: ', res)
	if (res.status >= 400) {
		data.type = 'notification'
		data.notificationLevel = 'error'
		data.msg = res.message
		ws.send(JSON.stringify(data))
		return false
	}
	console.log('Friendship removed from DB')

	return true
}