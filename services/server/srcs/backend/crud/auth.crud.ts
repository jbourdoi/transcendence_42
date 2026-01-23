import { FastifyRequest } from 'fastify'
import { createToken, verifyToken } from './jwt.crud.js'
import { JWTPayload } from 'jose'
import { dbPostQuery } from '../services/db.service.js'
import type { CookieSerializeOptions } from '@fastify/cookie'
import { type InfoFetchType } from '../../types/infofetch.type.js'
import { type User42InfoType } from '../../types/user42Info.type.js'

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

export async function fetch42User(url: string, { saveToDb }: { saveToDb: boolean }): Promise<InfoFetchType> {
	const token = await fetch(url, { method: 'POST' })
		.then(res => res.json())
		.then(res => res?.access_token)

	console.log('TOKEN: ', token)
	let userId: number
	let has_2fa: boolean
	let body

	if (!token)
		return {
			info: {
				status: 403,
				message: 'Invalid credentials'
			}
		}

	const user42Info: User42InfoType = await fetch('https://api.intra.42.fr/v2/me', {
		headers: {
			Authorization: `Bearer ${token}`
		}
	}).then(res => res.json())

	console.log('User Info: ', user42Info)

	if (!user42Info)
		return {
			info: {
				status: 403,
				message: 'Invalid credentials'
			}
		}

	if (saveToDb) {
		body = await dbPostQuery({
			endpoint: 'dbRun',
			query: {
				verb: 'create',
				sql: 'INSERT INTO users (email, username, is_oauth) VALUES (?, ?, ?)',
				data: [user42Info.email, user42Info.login, 1]
			}
		})
		userId = body.data?.lastID
		has_2fa = body.data?.has_2fa === 1 // '=== 1' to convert from integer to boolean
	} else {
		body = await dbPostQuery({
			endpoint: 'dbGet',
			query: {
				verb: 'read',
				sql: 'SELECT * FROM users WHERE username = ?',
				data: [user42Info.login]
			}
		})
		if (body.status >= 400) {
			return {
				info: {
					status: 404,
					message: 'User not found'
				}
			}
		}
		
		if (body?.data?.is_oauth !== 1) {
			return {
				info: {
					status: 403,
					message: 'User already registered with form'
				}
			}
		}
		userId = body.data.id
		has_2fa = body.data.has_2fa === 1 // '=== 1' to convert from integer to boolean
	}

	if (body.status >= 400) {
		return {
			info: {
				status: body.status,
				message: body.message
			}
		}
	}
	return {
		email: user42Info.email,
		username: user42Info.login,
		id: userId,
		has_2fa: has_2fa,
		info: {
			status: 200
		}
	}
}

export async function generateAndSendToken(infoFetch: InfoFetchType, reply: any) {
	if (!infoFetch.id) return reply.status(404).send({ message: 'User ID not found' })

	const userInfo = { email: infoFetch.email, username: infoFetch.username, id: infoFetch.id, has_2fa: infoFetch.has_2fa }
	const token = await createToken(userInfo)
	if (!token) return reply.status(500).send({ message: 'Token generation failed' })
	return reply
		.status(200)
		.setCookie('token', token, userTokenCookieOptions())
		.send({ ...infoFetch })
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
