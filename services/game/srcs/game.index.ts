import { authChannel } from './channels/auth.channel'
import JSONParser from './functions/json_parser.fn'
import { clientsList, clientsSocket } from './state/clients.state'
import { SocketDataType } from './types/socketData.type'
import { BunSocketType } from './types/bunSocket.type'
import { sendUserList } from './functions/sendUserList.fn'
import { getVaultSecret } from './services/vault.service.js'

const cert_crt = await getVaultSecret<string>('services_crt', (value) =>
	value.replace(/\\n/g, '\n').trim()
)
const cert_key = await getVaultSecret<string>('services_key', (value) =>
	value.replace(/\\n/g, '\n').trim()
)
if (!cert_crt || !cert_key)
	console.error('Failed to load TLS certificates from Vault service.')

const server = Bun.serve({
	port: 3333,
	// key: cert_key,
	// cert: cert_crt,
	fetch(req, server) {
		if (req.url === '/health') return new Response('OK', { status: 200 })
		if (
			server.upgrade(req, {
				data: { username: '' }
			})
		) {
			return
		}
		return new Response('WebSocket game server running', {
			status: 200
		})
	},
	websocket: {
		open(ws) {
			clientsSocket.add(ws)
			ws.send(
				JSON.stringify({
					type: 'system',
					message: 'Welcome to the game!'
				})
			)
		},
		message(ws: BunSocketType, message) {
			const data: SocketDataType = JSONParser(message)
			if (data === undefined) return
			console.log('New Incoming message: ', data)
			if (data.type === 'auth')
			{
				authChannel(ws, data)
			}
			// else if (data.type === 'global')
			// {
			// 	globalChannel(ws, message)
			// }
			// else if (data.type === 'mp')
			// {
			// 	mpChannel(ws, data, message)
			// }
			// else if (data.type === 'req-friend')
			// {
			// 	reqFriendChannel(ws, data)
			// }
			// else if (data.type === 'block-user')
			// {
			// 	blockUserChannel(ws, data)
			// }
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

console.log(`Game server running on ws://localhost:${server.port}`)
