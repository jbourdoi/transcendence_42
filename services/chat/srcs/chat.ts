import { authChannel } from './channels/auth.channel'
import { globalChannel } from './channels/global.channel'
import { mpChannel } from './channels/mp.channel'
import { reqFriendChannel } from './channels/req_friend.channel'
import JSONParser from './functions/json_parser.fn'
import { clientsList, clientsSocket } from './state/clients.state'
import { SocketDataType } from './types/socketData.type'
import { BunSocketType } from './types/bunSocket.type'
import { sendUserList } from './functions/sendUserList.fn'

const server = Bun.serve({
	port: 4444,
	fetch(req, server) {
		if (req.url === '/health') return new Response('OK', { status: 200 })
		if (
			server.upgrade(req, {
				data: { username: '' }
			})
		) {
			return
		}
		return new Response('WebSocket chat server running', {
			status: 200
		})
	},
	websocket: {
		open(ws) {
			clientsSocket.add(ws)
			ws.send(
				JSON.stringify({
					type: 'system',
					message: 'Welcome to the chat!'
				})
			)
		},
		message(ws: BunSocketType, message) {
			const data: SocketDataType = JSONParser(message)
			if (data === undefined) return
			console.log('New Incoming message: ', data)
			if (data.type === 'auth') {
				authChannel(ws, data)
			} else if (data.type === 'global') {
				globalChannel(message)
			} else if (data.type === 'mp') {
				mpChannel(ws, data, message)
			} else if (data.type === 'req-friend') {
				reqFriendChannel(ws, data)
			}
		},
		close(ws: BunSocketType) {
			const message = {
				type: 'info',
				msg: `Player ${ws.data.username} has disconnected`
			}
			for (const client of clientsList) {
				if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
					client.socket.send(JSON.stringify(message))
				}
				if (client.socket === ws) {
					clientsList.delete(client)
				}
			}
			clientsSocket.delete(ws)
			sendUserList()
		}
	}
})

console.log(`Chat server running on ws://localhost:${server.port}`)
