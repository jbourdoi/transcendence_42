import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import path from 'path'
import { readFile } from 'fs/promises'
import { existsSync, readFileSync, readSync } from 'fs'
import fastifyStatic from '@fastify/static'
import { renderTemplateFromFile } from './functions/renderTemplateFromFile.fn.js'
import { publicWatcher } from './services/publicWatcher.service.js'
import __dirname, { setDirName } from './functions/dirname.fn.js'
import cookie from '@fastify/cookie'
import { authRoutes, metricsRoutes, userRoutes } from './routes/handler.route.js'
import { totalHttpRequests } from './services/prometheus.service.js'

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

async function getHTML(route: string, type?: string): Promise<any> {
	return new Promise(async (resolve, reject) => {
		let page

		if (type === 'hydrate') {
			const filePath = path.join(__dirname(), 'srcs/pages', `${route}.html`)
			page = await readFile(filePath, 'utf8').catch(() => reject(null))
		} else {
			page = await renderTemplateFromFile(`${route}.html`).catch(() => reject(null))
		}
		resolve(page)
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
			const html = await getHTML(route, type).catch(() => {
				return reply.status(404).send()
			})
			return reply.type('text/html').send(html)
		} else {
			const filePath = path.join(__dirname(), 'dist/public', route)
			if (existsSync(filePath)) {
				const fileData = readFileSync(filePath, { encoding: 'utf8' })
				return reply.type('text/javascript').send(fileData)
			}
		}
		return reply.status(404).send()
	}
})

const start = async () => {
	try {
		await fastify.listen({ host: '0.0.0.0', port: 3000 })
		console.log('Server running on http://localhost:3000')
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}

start()
