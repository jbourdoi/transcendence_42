import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getHTML } from '../functions/getHTML.fn.js'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import __dirname from '../functions/dirname.fn.js'

const validRoutes = [
	'home',
	'update_profile',
	'login',
	'options',
	'register',
	'users',
	'remote_game',
	'lobby',
	'chat',
	'local_game',
	'create_game',
	'tournament_select',
	'tournament_tree',
	'tournament_match',
	'forbidden',
	'profile',
	'friends'
]

export function routerRoute(fastify: FastifyInstance) {
	fastify.route({
		method: 'GET',
		url: '/:route',
		exposeHeadRoute: false,
		handler: async (req: FastifyRequest, reply: FastifyReply) => {
			let route = (req.params as { route: string | undefined })['route'] || ''
			const type = req.headers.type as string
			if (route === '') route = 'home'
			if (validRoutes.includes(route)) {
				const html = await getHTML(route, type || 'render')
				if (html) return reply.type('text/html').send(html)
				else {
					const html = await getHTML(route, 'error', 404)
					return reply.type('text/html').send(html)
				}
			} else {
				const filePath = path.join(__dirname(), 'dist/public/', route)
				if (existsSync(filePath)) {
					const fileData = readFileSync(filePath, { encoding: 'utf8' })
					return reply.type('text/javascript').send(fileData)
				}
			}
			const html = await getHTML(route, 'error', 404)
			return reply.type('text/html').send(html)
		}
	})
}
