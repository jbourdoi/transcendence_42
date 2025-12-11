import { FastifyInstance } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import { json_parse } from '../../frontend/functions/json_wrapper.js'

export async function apiRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'POST',
		url: '/api/auth',
		handler: handlePOSTApiAuth
	})
}

async function handlePOSTApiAuth(req, reply) {
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
}
