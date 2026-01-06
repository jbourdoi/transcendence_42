import { FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import { json_parse } from '../../frontend/functions/json_wrapper.js'
import { fetch42User } from '../crud/auth.crud.js'

const CLIENT_ID = process.env.CLIENT_ID || ''
const CLIENT_SECRET = process.env.CLIENT_SECRET || ''

export async function getClientID(req: FastifyRequest, reply: FastifyReply) {
	return reply.send({ client_id: CLIENT_ID })
}

export async function handlePOSTApiAuthRegister(req: FastifyRequest, reply: FastifyReply) {
	const { code } = json_parse(req.body)

	const url =
		'https://api.intra.42.fr/oauth/token?' +
		new URLSearchParams({
			client_id: CLIENT_ID,
			grant_type: 'authorization_code',
			client_secret: CLIENT_SECRET,
			code,
			redirect_uri: 'https://localhost/register',
			state: uuidv4()
		})

	const infoFetch = await fetch42User(url, true)
	if (!infoFetch) return reply.status(403).send({ error: 'Invalid credentials' })
	return reply.send(infoFetch)
}

export async function handlePOSTApiAuthLogin(req: FastifyRequest, reply: FastifyReply) {
	const { code } = json_parse(req.body)

	const url =
		'https://api.intra.42.fr/oauth/token?' +
		new URLSearchParams({
			client_id: CLIENT_ID,
			grant_type: 'authorization_code',
			client_secret: CLIENT_SECRET,
			code,
			redirect_uri: 'https://localhost/login',
			state: uuidv4()
		})

	const infoFetch = await fetch42User(url, false)
	if (!infoFetch) return reply.status(403).send({ error: 'Invalid credentials' })
	return reply.send(infoFetch)
}
