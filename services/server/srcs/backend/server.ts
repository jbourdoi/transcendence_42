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

/********************** Services **********************/
import { log } from './logs.js'
import { totalHttpRequests } from './services/prometheus.service.js'
import { createTransporter } from './services/ethereal.service.js'

/********************** Routes **********************/
import { authRoutes, metricsRoutes, userRoutes } from './routes/handler.route.js'
import { routerRoute } from './routes/router.route.js'
import { getVaultSecret } from './services/vault.service.js'

setDirName(path.resolve())

const cert_crt = await getVaultSecret<string>('services_crt', (value) =>
	value.replace(/\\n/g, '\n').trim()
)
const cert_key = await getVaultSecret<string>('services_key', (value) =>
	value.replace(/\\n/g, '\n').trim()
)
if (!cert_crt || !cert_key)
	console.error('Failed to load TLS certificates from Vault service.')

const fastify: FastifyInstance = Fastify({
	https: {
		key: cert_key as string,
		cert: cert_crt as string
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

// createAccount()
createTransporter()

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
