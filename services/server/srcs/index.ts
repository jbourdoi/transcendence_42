import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import path from 'path'
import { readFile } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import sanitizeHtml from 'sanitize-html'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import cors from '@fastify/cors'
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

const MAX_MESSAGE_LENGTH = 150

const validRoutes = ['index', 'about', 'login', 'options', 'register', 'dashboard', 'users', 'game']

const fastify: FastifyInstance = Fastify({
	https: {
		key: fs.readFileSync(path.join(__dirname(), 'certs/key.pem')),
		cert: fs.readFileSync(path.join(__dirname(), 'certs/cert.pem'))
	}
})

await fastify.register(cors, {
	origin: 'https://localhost:5173',
	credentials: true
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
	console.log('User lobby: ', user)
	if (!user) return socket.close()
		console.log('Socket closed')
	lobby.refreshWebsocket(cleanId, socket)
	console.log('User lobby: ', user?.socket?._readyState)
	// lobby.broadcast({})
	lobby.broadcast({
		id: user.id
	})
	socket.on('close', () => lobby.broadcast({}))
	socket.on('message', (raw: any) => {
		const rawString = sanitizeHtml(raw.toString())
		// Vérifier la taille maximale
		if (rawString.length > MAX_MESSAGE_LENGTH) {
			console.warn(`Message too long from ${cleanId}, ignored`)
			socket.send(json_stringify({ type: 'error', text: `message too long (${MAX_MESSAGE_LENGTH} bytes max for the json)` }))
			return
		}
		const msg = json_parse(rawString)
		if (!msg) {
			console.warn(`Json invalid from ${cleanId}, ignored`)
			socket.send(JSON.stringify({ type: 'error', text: `Invalid json format` }))
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
