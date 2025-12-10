import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import path from 'path'
import { readFile } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import sanitizeHtml from 'sanitize-html'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import { applyTemplate } from './functions/applyTemplate.fn.js'
import __dirname, { setDirName } from './functions/dirname.fn.js'
import { publicWatcher } from './services/publicWatcher.service.js'
import cookie from '@fastify/cookie'
import { authRoutes, metricsRoutes, userRoutes } from './routes/handler.route.js'
import { totalHttpRequests } from './services/prometheus.service.js'
import { log } from './logs.js'
import { applyError } from './functions/applyError.fn.js'
import fs from 'fs'
import Lobby from './classes/Lobby.js'
import { json_parse, json_stringify } from './public/functions/json_wrapper.js'
import { MessageType } from './types/message.type.js'

import { v4 as uuidv4 } from 'uuid'

const MAX_MESSAGE_LENGTH = 150

const validRoutes = ['index', 'about', 'login', 'options', 'register', 'dashboard', 'users', 'game', 'lobby', 'chat']

const fastify: FastifyInstance = Fastify({
	https: {
		key: fs.readFileSync(path.join(__dirname(), 'certs/key.pem')),
		cert: fs.readFileSync(path.join(__dirname(), 'certs/cert.pem'))
	}
})

const lobby = new Lobby()

await fastify.register(fastifyWebsocket)

// const fastify: FastifyInstance = Fastify()

fastify.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply) => {
	totalHttpRequests.inc({
		method: request.method,
		route: request.url,
		status_code: reply.statusCode
	})
})

fastify.register(cookie)

setDirName(path.resolve())
publicWatcher()

fastify.register(fastifyStatic, {
	root: path.join(__dirname(), 'dist/public'),
	prefix: '/'
})

async function getHTML(route: string, type?: string, error?: number): Promise<string> {
	return new Promise(async (resolve, reject) => {
		const filePath = path.join(__dirname(), 'srcs/pages', `${type !== 'error' ? route : 'error'}.html`)

		if (!existsSync(filePath)) return reject()

		let pageContent = await readFile(filePath, 'utf8')
		if (pageContent === null) return reject()

		if (type === 'render') {
			pageContent = await applyTemplate(pageContent)
		} else if (type === 'error') {
			pageContent = await applyTemplate(pageContent)
			pageContent = await applyError(pageContent, error)
		}
		resolve(pageContent)
	})
}

await metricsRoutes(fastify)
await authRoutes(fastify)
await userRoutes(fastify)

fastify.post('/api/auth', async (req, reply) => {
	const { code } = json_parse(req.body)

	const url =
		'https://api.intra.42.fr/oauth/token?' +
		new URLSearchParams({
			client_id: 'u-s4t2ud-9f30b2430e51c381ae5e38158295eef89230a74b070231a798bd1bcb7a01709c',
			grant_type: 'authorization_code',
			client_secret: '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',
			code,
			redirect_uri: 'https://localhost/register',
			state: uuidv4()
		})

	const token = await fetch(url, { method: 'POST' })
		.then(res => res.json())
		.then(res => res?.access_token)

	if (token) {
		const infoFetch = await fetch('https://api.intra.42.fr/v2/me', {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
			.then(res => res.json())
			.then(res => {
				const { email, login, first_name, last_name } = res
				return { email, login, firstName: first_name, lastName: last_name }
			})
		return reply.send(infoFetch)
	} else {
		return reply.send({ status: 413 }).status(413)
	}
})

fastify.get('/api/hello', (req, reply) => {
	reply.send({ type: 'message', message: 'hello' })
})

fastify.get('/api/lobby', (req, reply) => {
	reply.send(lobby)
})

fastify.get('/api/user', (req, reply) => {
	const query: any = req.query
	const { userId } = query
	const cleanId = sanitizeHtml(userId)
	const user = lobby.getUser(sanitizeHtml(cleanId))
	if (!user) return reply.code(403).send({ error: `userId ${cleanId} invalid` })
	return reply.send({ userId: cleanId, pseudo: user.pseudo })
})

fastify.post('/api/lobby', (req, reply) => {
	const body: any = req.body
	const { pseudo } = body
	const cleanPseudo = sanitizeHtml(pseudo)
	const payload = lobby.addUser(cleanPseudo)
	if (payload.id === '0') return reply.code(403).send({ error: `${cleanPseudo} already taken` })
	return reply.send(payload)
})

fastify.delete('/api/lobby', (req, reply) => {
	const body: any = req.body
	const { userId } = body
	const cleanId = sanitizeHtml(userId)
	const user = lobby.getUser(cleanId)
	if (!user) return reply.code(403).send({ error: `userId ${cleanId} invalid` })
	lobby.removeUser(user)
	reply.send({ success: true })
})

fastify.get('/api/ws', { websocket: true }, (socket, req) => {
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
			socket.send(json_stringify({ type: 'error', text: `message too long (${MAX_MESSAGE_LENGTH} bytes max for the json)` }))
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
})

fastify.route({
	method: 'GET',
	url: '/:route',
	exposeHeadRoute: false,
	handler: async (req: FastifyRequest, reply: FastifyReply) => {
		let route = (req.params as { route: string | undefined })['route'] || ''
		const type = req.headers.type as string
		if (route === '') route = 'index'
		if (validRoutes.includes(route)) {
			const html = await getHTML(route, type || 'render')
			if (html) return reply.type('text/html').send(html)
			else {
				const html = await getHTML(route, 'error', 404)
				return reply.type('text/html').send(html)
			}
		} else {
			const filePath = path.join(__dirname(), 'dist/public', route)
			if (existsSync(filePath)) {
				const fileData = readFileSync(filePath, { encoding: 'utf8' })
				return reply.type('text/javascript').send(fileData)
			}
		}
		const html = await getHTML(route, 'error', 404)
		return reply.type('text/html').send(html)
	}
})

const start = async () => {
	try {
		await fastify.listen({ host: '0.0.0.0', port: 3000 })
		console.log('Server running on http://localhost:3000')
		log('Server running on http://localhost:3000', 'info')
	} catch (err) {
		fastify.log.error(err)
		log(`Server failed to start: ${err}`, 'error')
		process.exit(1)
	}
}

start()
