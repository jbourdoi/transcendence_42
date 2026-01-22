import { FastifyRequest } from 'fastify'
import { createToken, verifyToken } from './jwt.crud.js'
import { JWTPayload } from 'jose'
import { dbPostQuery } from '../services/db.service.js'
import type { CookieSerializeOptions } from '@fastify/cookie'

export async function getPayload(request: FastifyRequest): Promise<any | null | undefined> {
	const loggedInToken = getToken(request)
	if (!loggedInToken) return null
	const decodedToken = decodeURIComponent(loggedInToken)
	const verifiedPayload: JWTPayload | null | undefined = await verifyToken(decodedToken)
	return verifiedPayload
}

export function getToken(request: FastifyRequest): string | null | undefined {
	const token = request.cookies.token
	return token
}

export async function checkIfAlreadyLoggedIn(request: FastifyRequest): Promise<boolean> {
	const validatedToken = await getPayload(request)
	if (!validatedToken) return false
	return true
}

export async function fetch42User(url: string, { saveToDb }: { saveToDb: boolean }) {
	const token = await fetch(url, { method: 'POST' })
		.then(res => res.json())
		.then(res => res?.access_token)

	let userId: number | null = null

	if (token) {
		const infoFetch = await fetch('https://api.intra.42.fr/v2/me', {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
			.then(res => res.json())
			.then(async res => {
				const { email, login } = res
				if (saveToDb) {
					const is_oauth = 1
					const body = await dbPostQuery({
						endpoint: 'dbRun',
						query: {
							verb: 'create',
							sql: 'INSERT INTO users (email, username, is_oauth) VALUES (?, ?, ?)',
							data: [email, login, is_oauth]
						}
					})
					userId = body.data?.lastID
					if (body.status >= 400) return { status: body.status, message: body.message }
				}
				else {
					const body = await dbPostQuery({
						endpoint: 'dbGet',
						query: {
							verb: 'read',
							sql: 'SELECT * FROM users WHERE username = ?',
							data: [login]
						}
					})
					if (body.status >= 400)
						return { status: body.status, message: body.message }

					const is_oauth = body.data.is_oauth
					if (is_oauth !== 1)
						return { status: 403, message: 'User registered with form' }
					userId = body.data.id
				}
				return { status: 200, info: { email, username: login, id: userId } }
			})
		return infoFetch
	}
	return { status: 403, message: 'Invalid credentials' }
}

export async function generateAndSendToken(infoFetch: any, reply: any) {
	if (!infoFetch.info.id) return reply.status(404).send({ message: 'User ID not found' })
	const userInfo = { email: infoFetch.info.email, username: infoFetch.info.username, id: infoFetch.info.id }
	const token = await createToken(userInfo)
	if (!token) return reply.status(500).send({ message: 'Token generation failed' })
	return reply
		.status(200)
		.setCookie('token', token, userTokenCookieOptions())
		.send({ ...infoFetch.info })
}
export function userTokenCookieOptions(): CookieSerializeOptions {
	return {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		signed: false
	}
} // TODO: signed = true or false?