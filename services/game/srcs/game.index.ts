import { authChannel } from './channels/auth.channel'
import { duelChannel } from './channels/duel.channel.js'
import { inputChannel } from './channels/input.channel.js'
import { navigateChannel } from './channels/navigate.channel.js'
import JSONParser from './functions/json_parser.fn'
import { BunSocketType } from './types/bunSocket.type'
// import { getVaultSecret } from './services/vault.service.js'
import Lobby from './classes/Lobby.js'
import { MessageType } from './types/message.type.js'
import { createGameChannel } from './channels/create.game.channel.js'
import { GameManager } from './classes/GameManager.js'
import { joinGameChannel, listGamesChannel } from './channels/join.game.channel.js'
import { leaveGameChannel } from './channels/leave.game.channel.js'

// const cert_crt = await getVaultSecret<string>('services_crt', (value) =>
// 	value.replace(/\\n/g, '\n').trim()
// )
// const cert_key = await getVaultSecret<string>('services_key', (value) =>
// 	value.replace(/\\n/g, '\n').trim()
// )
// if (!cert_crt || !cert_key)
// 	console.error('Failed to load TLS certificates from Vault service.')

const gameManager = new GameManager()
const lobby = new Lobby(gameManager)

const server = Bun.serve({
	port: 3333,
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
		open(ws: BunSocketType)
		{
			// const info : FrontSystemType = {
			// 	type: 'system',
			// 	text: 'WebGameSocket ON'
			// }
			// ws.send(json_stringify(info))
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
				case 'join-game': return joinGameChannel(ws, data, lobby);
				case 'list-game': return listGamesChannel(ws, lobby);
				case 'leave-game': return leaveGameChannel(ws, data, lobby);
			}
		},
		close(ws: BunSocketType)
		{
			const user = ws.data.user
			if (!user) return ;
			if (lobby.gameManager.leaveSession(user))
			{
				lobby.broadcast({
					type: "list-game",
					games: lobby.gameManager.getJoinableSessionsInfo()
				})
			}
			lobby.removeUser(user)
		}
	}
})

console.log(`Game server running on ws://localhost:${server.port}`)
