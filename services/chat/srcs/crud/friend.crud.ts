import { dbPostQuery } from '../services/db.service'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'
import { ClientType } from '../types/client.type'

export async function isFriend(ws: BunSocketType, friend: string, data: SocketDataType): Promise<boolean> {
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
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return true
	}
	else if (res.data) {
		data.msg = 'Cannot send friend request. Users are already friends.'
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return true
	}
	return false
}

export async function insertFriendship(ws: BunSocketType, new_friend: ClientType, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'INSERT',
			sql: 'INSERT INTO friendships (username_1, username_2) VALUES (?, ?)',
			data: [ws.data.username, new_friend.username]
		}
	})
	console.log('INSERT FRIEND REQUEST --- insertFriendship: ', res)
	if (res.status >= 400) {
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return false
	}
		data.type = 'notification'
		data.notificationLevel = 'info'
		data.msg = `User ${ws.data.username} wants to be friends!`
		new_friend.socket.send(JSON.stringify(data))

		data.msg = `Friend request sent to ${ws.data.username}!`
		ws.send(JSON.stringify(data))
	return true
}

export async function removeFromFriendships(ws: BunSocketType, friend: string, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'DELETE',
			sql: 'DELETE FROM friendships WHERE (username_1 = ? AND username_2 = ?) OR (username_1 = ? AND username_2 = ?)',
			data: [ws.data.username, friend, friend, ws.data.username]
		}
	})
	console.log('REMOVE --- removeFromFriendships: ', res)
	if (res.status >= 400) {
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return false
	}
	console.log('Friendship removed from DB')
	return true
}