import { authChannel } from './channels/auth.channel'
import { duelChannel } from './channels/duel.channel.js'
import { inputChannel } from './channels/input.channel.js'
import { navigateChannel } from './channels/navigate.channel.js'
import JSONParser from './functions/json_parser.fn'
import { clientsList, clientsSocket } from './state/clients.state'
import { BunSocketType } from './types/bunSocket.type'
import { sendUserList } from './functions/sendUserList.fn'
import { getVaultSecret } from './services/vault.service.js'
import Lobby from './classes/Lobby.js'
import { MessageType } from './types/message.type.js'
import { createGameChannel } from './channels/create.game.channel.js'

const cert_crt = await getVaultSecret<string>('services_crt', (value) =>
	value.replace(/\\n/g, '\n').trim()
)
const cert_key = await getVaultSecret<string>('services_key', (value) =>
	value.replace(/\\n/g, '\n').trim()
)
if (!cert_crt || !cert_key)
	console.error('Failed to load TLS certificates from Vault service.')

const lobby = new Lobby()

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
		open(ws)
		{
			clientsSocket.add(ws)
			ws.send(
				JSON.stringify({
					type: 'system',
					message: 'Welcome to the game!'
				})
			)
		},
		message(ws: BunSocketType, message)
		{
			const data: MessageType = JSONParser(message)
			if (data === undefined) return
			switch (data.type)
			{
				case 'auth' : return authChannel(ws, data, lobby);
				case 'navigate' : return navigateChannel(ws, data);
				case 'duel' : return duelChannel(ws, data, lobby);
				case 'input' : return inputChannel(ws, data, lobby);
				case 'create-game' : return createGameChannel(ws, data, lobby);
			}
		},
		close(ws: BunSocketType)
		{
			const info = {
				type: 'info',
				msg: `Player ${ws.data.username} has disconnected`
			}
			for (const client of clientsList) {
				if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
					client.socket.send(JSON.stringify(info))
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
