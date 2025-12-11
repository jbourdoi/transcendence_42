import { FastifyInstance } from 'fastify'
import { json_parse, json_stringify } from '../../frontend/functions/json_wrapper.js'
import sanitizeHtml from 'sanitize-html'
import Lobby from '../classes/Lobby.js'
import fastifyWebsocket from '@fastify/websocket'
import { MessageType } from '../../types/message.type.js'

const MAX_MESSAGE_LENGTH = 150
const lobby = new Lobby()

export async function gameRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'GET',
		url: '/api/hello',
		handler: (req, reply) => {
			reply.send({ type: 'message', message: 'hello' })
		}
	})

	fastify.route({
		method: 'GET',
		url: '/api/lobby',
		handler: (req, reply) => {
			reply.send(lobby)
		}
	})

	fastify.route({
		method: 'POST',
		url: '/api/lobby',
		handler: (req, reply) => {
			const body: any = req.body
			const { pseudo } = body
			const cleanPseudo = sanitizeHtml(pseudo)
			const payload = lobby.addUser(cleanPseudo)
			if (payload.id === '0') return reply.code(403).send({ error: `${cleanPseudo} already taken` })
			return reply.send(payload)
		}
	})

	fastify.route({
		method: 'GET',
		url: '/api/user',
		handler: (req, reply) => {
			const query: any = req.query
			const { userId } = query
			const cleanId = sanitizeHtml(userId)
			const user = lobby.getUser(sanitizeHtml(cleanId))
			if (!user) return reply.code(403).send({ error: `userId ${cleanId} invalid` })
			return reply.send({ userId: cleanId, pseudo: user.pseudo })
		}
	})

	fastify.route({
		method: 'POST',
		url: '/api/user',
		handler: (req, reply) => {
			const body: any = req.body
			const { pseudo } = body
			const cleanPseudo = sanitizeHtml(pseudo)
			const payload = lobby.addUser(cleanPseudo)
			if (payload.id === '0') return reply.code(403).send({ error: `${cleanPseudo} already taken` })
			return reply.send(payload)
		}
	})

	fastify.route({
		method: 'DELETE',
		url: '/api/user',
		handler: (req, reply) => {
			const body: any = req.body
			const { userId } = body
			const cleanId = sanitizeHtml(userId)
			const user = lobby.getUser(cleanId)
			if (!user) return reply.code(403).send({ error: `userId ${cleanId} invalid` })
			lobby.removeUser(user)
			reply.send({ success: true })
		}
	})

	fastify.route({
		method: 'GET',
		url: '/api/ws',
		websocket: true,
		handler: (socket, req) => {
			const query: any = req.query
			console.log(query)
			const { userId } = query
			const cleanId = sanitizeHtml(userId)
			console.log(`Connexion avec userId='${cleanId}'`)
			const user = lobby.getUser(cleanId)
			if (!user) return socket.close()
			console.log('Socket closed')
			lobby.refreshWebsocket(cleanId, socket)
			socket.on('message', (raw: any) => {
				const rawString = sanitizeHtml(raw.toString())
				// Vérifier la taille maximale
				if (rawString.length > MAX_MESSAGE_LENGTH) {
					console.warn(`Message too long from ${cleanId}, ignored`)
					socket.send(
						json_stringify({ type: 'error', text: `message too long (${MAX_MESSAGE_LENGTH} bytes max for the json)` })
					)
					return
				}
				const msg = json_parse(rawString) as MessageType
				if (!msg) {
					console.warn(`Json invalid from ${cleanId}, ignored`)
					socket.send(json_stringify({ type: 'error', text: `Invalid json format`, timestramp: Date.now() }))
					return
				}
				lobby.handleMessage(user, msg)
			})
		}
	})
}
