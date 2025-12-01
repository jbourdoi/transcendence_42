import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import path from 'path'
import { readFile } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import fastifyStatic from '@fastify/static'
import { applyTemplate } from './functions/applyTemplate.fn.js'
import { publicWatcher } from './services/publicWatcher.service.js'
import __dirname, { setDirName } from './functions/dirname.fn.js'
import cookie from '@fastify/cookie'
import { authRoutes, metricsRoutes, userRoutes } from './routes/handler.route.js'
import { totalHttpRequests } from './services/prometheus.service.js'
import { log } from './logs.js'
import { applyError } from './functions/applyError.fn.js'

const fastify: FastifyInstance = Fastify()
const validRoutes = ['index', 'about', 'login', 'options', 'register', 'dashboard', 'users']

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
