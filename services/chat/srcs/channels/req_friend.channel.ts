import { dbPostQuery } from '../services/db.service'
import { clientsList } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { ClientType } from '../types/client.type'
import { SocketDataType } from '../types/socketData.type'

async function isClientBlocked(ws: BunSocketType, blocked_user: string, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'SELECT',
			sql: 'SELECT * FROM blocks WHERE (blocker_username = ? AND blocked_username = ?) OR (blocker_username = ? AND blocked_username = ?)',
			data: [ws.data.username, blocked_user, blocked_user, ws.data.username]
		}
	})
	console.log('INSERT FRIEND REQUEST --- isClientBlocked: ', res)
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

async function tryInsertFriendRequest(ws: BunSocketType, new_friend: string, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'INSERT',
			sql: 'INSERT INTO friend_requests (from_username, to_username) VALUES (?, ?)',
			data: [ws.data.username, new_friend]
		}
	})
	console.log('INSERT FRIEND REQUEST --- insertFriendRequest: ', res)
	if (res.status >= 400) {
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return false
	}
	return true
}

export async function reqFriendChannel(ws: BunSocketType, data: SocketDataType) {
	let clientFound: ClientType
	console.log('Friends request')
	for (let client of clientsList) {
		if (client.username === data.msg) {
			clientFound = client
		}
	}
	console.log('Client Found: ', clientFound)
	if (clientFound) {
		// if already in friendships, cannot send request -> SELECT from friendships, if here stop if not here INSERT send request
		// if A already sent request to B, cannot send request again from B -> DELETE from friend_requests and INSERT to friendships
		if (await isClientBlocked(ws, clientFound.username, data)) return
		console.log('User not blocked, send friend request')

		if (!await tryInsertFriendRequest(ws, clientFound.username, data)) return
		console.log('Friend request sent to DB')

		data.msg = clientFound.username
		data.type = 'req-friend'
		clientFound.socket.send(JSON.stringify(data))

		data.type = 'notification'
		data.notificationLevel = 'info'
		data.msg = `User ${ws.data.username} wants to be friends!`
		clientFound.socket.send(JSON.stringify(data))

		data.msg = `Friend request sent to ${ws.data.username}!`
		ws.send(JSON.stringify(data))
	} else {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
