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

async function insertFriendRequest(ws: BunSocketType, new_friend: string, data: SocketDataType): Promise<boolean> {
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

async function isFriend(ws: BunSocketType, friend: string, data: SocketDataType): Promise<boolean> {
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

async function isDoubleFriendRequest(ws: BunSocketType, friend: string, data: SocketDataType): Promise<string> {
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'SELECT',
			sql: 'SELECT * FROM friend_requests WHERE from_username = ? AND to_username = ?',
			data: [ws.data.username, friend]
		}
	})
	console.log('INSERT FRIEND REQUEST --- isDoubleFriendRequest: ', res)
	if (res.status >= 400 && res.status !== 404)
	{
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return 'error'
	}
	else if (res.data) {
		data.msg = 'Cannot send friend request as you have already sent one to this user.'
		data.type = 'info'
		ws.send(JSON.stringify(data))
		return 'true'
	}
	return 'false'
}

async function isInFriendRequests(ws: BunSocketType, friend: string, data: SocketDataType): Promise<string> {
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'SELECT',
			sql: 'SELECT * FROM friend_requests WHERE from_username = ? AND to_username = ?',
			data: [friend, ws.data.username]
		}
	})
	console.log('INSERT FRIEND REQUEST --- isInFriendRequests: ', res)
	if (res.status >= 400 && res.status !== 404)
	{
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return 'error'
	}
	else if (res.data) {
		data.msg = 'Cannot send friend request as it is already pending. Add them as friends.'
		data.type = 'info'
		ws.send(JSON.stringify(data))
		return 'true'
	}
	return 'false'
}

async function insertFriendship(ws: BunSocketType, new_friend: ClientType, data: SocketDataType): Promise<boolean> {
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

async function removeFromFriendRequests(ws: BunSocketType, friend: string, data: SocketDataType): Promise<boolean> {
	const res = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'DELETE',
			sql: 'DELETE FROM friend_requests WHERE (from_username = ? AND to_username = ?) OR (from_username = ? AND to_username = ?)',
			data: [ws.data.username, friend, friend, ws.data.username]
		}
	})
	console.log('INSERT FRIEND REQUEST --- removeFromFriendRequests: ', res)
	if (res.status >= 400) {
		data.msg = res.message
		data.type = 'error'
		ws.send(JSON.stringify(data))
		return false
	}
	console.log('Friend request removed from DB')
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
		if (await isClientBlocked(ws, clientFound.username, data)) return
		console.log('User not blocked, check if friends')

		if (await isFriend(ws, clientFound.username, data)) return
		console.log('Users are not friends, check if double friend request')

		const doubleFriendRequest = await isDoubleFriendRequest(ws, clientFound.username, data)
		if (doubleFriendRequest === 'error' || doubleFriendRequest === 'true') return
		console.log('No double friend request, check if the other user has sent a friend request')
		const inFriendRequests = await isInFriendRequests(ws, clientFound.username, data)
		if (inFriendRequests === 'error') return
		else if (inFriendRequests === 'true')
		{
			console.log('User is in friend requests, add to friendships')

			if (!await insertFriendship(ws, clientFound, data)) return
			console.log('Friendship added to DB')

			await removeFromFriendRequests(ws, clientFound.username, data)
			console.log('Friend request removed from DB')
			return
		}

		console.log('User is not in friend requests, send friend request')
		if (!await insertFriendRequest(ws, clientFound.username, data)) return
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
