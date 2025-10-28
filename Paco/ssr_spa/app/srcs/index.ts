import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import path from 'path'
import { readFile } from 'fs/promises'
import fastifyStatic from '@fastify/static'
import { renderTemplateFromFile } from './functions/renderTemplateFromFile.fn.js'
import { publicWatcher } from './services/publicWatcher.service.js'
import __dirname ,{setDirName} from './functions/dirname.fn.js'

const fastify: FastifyInstance = Fastify()
const validRoutes = ['index', 'about']

setDirName(path.resolve())
publicWatcher()

fastify.register(fastifyStatic, {
	root: path.join(__dirname(), 'dist/public'),
	prefix: '/public/'
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

fastify.route({
	method: 'GET',
	url: '/*',
	exposeHeadRoute: false,
	handler: async (req: FastifyRequest, reply: FastifyReply) => {
		let route = (req.params as { '*': string | undefined })['*'] || ''
		const type = req.headers.type as string
		if (route === '') route = 'index'
		if (validRoutes.includes(route)) {
			const html = await getHTML(route, type).catch(() => {
				return reply.status(404).send()
			})
			reply.type('text/html').send(html)
		} else reply.status(404).send()
	}
})

const start = async () => {
	try {
		await fastify.listen({host:"0.0.0.0", port: 3000 })
		console.log('Server running on http://localhost:3000')
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}

start()
