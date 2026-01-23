import { FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import { json_parse } from '../../frontend/functions/json_wrapper.js'
import { fetch42User, generateAndSendToken } from '../crud/auth.crud.js'
import { getVaultSecret } from '../services/vault.service.js'
import { InfoFetchType } from '../../types/infofetch.type.js'

const CLIENT_ID = await getVaultSecret<string>('client_id', value => value)
const CLIENT_SECRET = await getVaultSecret<string>('client_secret', value => value)
if (!CLIENT_ID || !CLIENT_SECRET) console.error('Failed to load 42OAuth client credentials from Vault service.')

export async function getClientID(req: FastifyRequest, reply: FastifyReply) {
	return reply.send({ client_id: CLIENT_ID })
}

export async function handlePOSTApiAuthRegister(req: FastifyRequest, reply: FastifyReply) {
	const { code } = json_parse(req.body)

	const url =
		'https://api.intra.42.fr/oauth/token?' +
		new URLSearchParams({
			client_id: CLIENT_ID as string,
			grant_type: 'authorization_code',
			client_secret: CLIENT_SECRET as string,
			code,
			redirect_uri: 'https://localhost/register',
			state: uuidv4()
		})

	const infoFetch: InfoFetchType = await fetch42User(url, { saveToDb: true })
	if (!infoFetch || infoFetch.info.status >= 400) return reply.status(infoFetch.info.status).send({ ...infoFetch })
	console.log('REGISTER 42 OAUTH --- infoFetch: ', infoFetch)
	await generateAndSendToken(infoFetch, reply)
}

export async function handlePOSTApiAuthLogin(req: FastifyRequest, reply: FastifyReply) {
	const { code } = json_parse(req.body)

	const url =
		'https://api.intra.42.fr/oauth/token?' +
		new URLSearchParams({
			client_id: CLIENT_ID as string,
			grant_type: 'authorization_code',
			client_secret: CLIENT_SECRET as string,
			code,
			redirect_uri: 'https://localhost/login',
			state: uuidv4()
		})

	const infoFetch: InfoFetchType = await fetch42User(url, { saveToDb: false })
	if (!infoFetch || infoFetch.info.status >= 400) return reply.status(infoFetch.info.status).send({ ...infoFetch })
	console.log('LOGIN 42 OAUTH --- infoFetch: ', infoFetch)
	await generateAndSendToken(infoFetch, reply)
}
