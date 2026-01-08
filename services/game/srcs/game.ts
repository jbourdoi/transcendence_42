/********************** Fastify **********************/
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import cookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import cors from '@fastify/cors'

/********************** Libs **********************/
import fs from 'fs'
import path from 'path'

/********************** Functions **********************/
import __dirname, { setDirName } from './functions/dirname.fn.js'

/********************** Services **********************/
import { log } from './logs.js'

/********************** Routes **********************/
import { gameRoutes } from './routes/game.route.js'

setDirName(path.resolve())

const fastify: FastifyInstance = Fastify({
	https: {
		key: fs.readFileSync(path.join(__dirname(), 'certs/key.pem')),
		cert: fs.readFileSync(path.join(__dirname(), 'certs/cert.pem'))
	}
})

await fastify.register(cors, {
	origin: ['https://localhost']
})

fastify.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply) => {
	totalHttpRequests.inc({
		method: request.method,
		route: request.url,
		status_code: reply.statusCode
	})
})

fastify.register(fastifyStatic, {
	root: path.join(__dirname(), 'dist/public'),
	prefix: '/'
})

fastify.register(cookie)
await fastify.register(fastifyWebsocket)
gameRoutes(fastify)

// publicWatcher()

const start = async () => {
	try {
		await fastify.listen({ host: '0.0.0.0', port: 3333 })
		console.log('Server running on http://localhost:3333')
		log('Server running on http://localhost:3333', 'info')
	} catch (err) {
		fastify.log.error(err)
		log(`Server failed to start: ${err}`, 'error')
		process.exit(1)
	}
}

start()
