/********************** Fastify **********************/
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import cookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import multipart from '@fastify/multipart'

/********************** Libs **********************/
import fs from 'fs'
import path from 'path'

/********************** Functions **********************/
import __dirname, { setDirName } from './functions/dirname.fn.js'
import { publicWatcher } from './services/publicWatcher.service.js'
import { getCertValue } from './crud/certs.crud.js'

/********************** Services **********************/
import { log } from './logs.js'
import { totalHttpRequests } from './services/prometheus.service.js'

/********************** Routes **********************/
import { authRoutes, metricsRoutes, userRoutes } from './routes/handler.route.js'
import { routerRoute } from './routes/router.route.js'

setDirName(path.resolve())

const cert_crt = await getCertValue('services_crt')
const cert_key = await getCertValue('services_key')

const fastify: FastifyInstance = Fastify({
	https: {
		key: cert_key,
		cert: cert_crt
	}
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

fastify.register(multipart, {
	limits: {
		fileSize: 100 * 1024, // 100 Ko
		files: 1,
		parts: 6
	}
})

fastify.register(cookie)
await fastify.register(fastifyWebsocket)
metricsRoutes(fastify)
authRoutes(fastify)
userRoutes(fastify)
routerRoute(fastify)

publicWatcher()

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
