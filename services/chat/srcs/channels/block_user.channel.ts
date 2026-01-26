import { blockUser, deblockUser, isDoubleBlock } from '../crud/block.crud'
import { removeFromFriendships } from '../crud/friend.crud'
import { removeFromFriendRequests } from '../crud/request.crud'
import { clientsSocket } from '../state/clients.state'
import { BunSocketType } from '../types/bunSocket.type'
import { SocketDataType } from '../types/socketData.type'

export async function blockUserChannel(ws: BunSocketType, data: SocketDataType) {
	let clientFound: BunSocketType
	console.log('Block user')
	for (let socket of clientsSocket) {
		if (socket.data.username === data.msg) {
			clientFound = socket
		}
	}
	console.log('Client Found: ', clientFound)
	if (clientFound) {
		const doubleBlockStatus = await isDoubleBlock(ws, clientFound.data.username, data)
		if (doubleBlockStatus === 'error') return
		else if (doubleBlockStatus === 'true') {
			await deblockUser(ws, clientFound.data.username, data)
			return
		}
		console.log('User not already blocked, continue to block')

		const blockUserStatus = await blockUser(ws, clientFound.data.username, data)
		if (blockUserStatus === 'error') return
		if (blockUserStatus === 'true') {
			removeFromFriendRequests(ws, clientFound.data.username, data)
			removeFromFriendships(ws, clientFound, data)
		}
	} else {
		data.msg = 'Player not found'
		data.type = 'error'
		ws.send(JSON.stringify(data))
	}
}
