import { FastifyRequest } from 'fastify'
import { verifyToken } from './jwt.crud.js'
import { JWTPayload } from 'jose'
import { dbPostQuery } from './dbQuery.crud.js'

export async function validateToken(request: FastifyRequest): Promise<any | null | undefined> {
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
	const validatedToken = await validateToken(request)
	if (!validatedToken) return false
	return true
}

export async function fetch42User(url: string, { saveToDb }: { saveToDb: boolean }) {
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
			.then(async res => {
				const { email, login, first_name, last_name } = res
				if (saveToDb) {
					const body = await dbPostQuery({
						endpoint: 'dbRun',
						query: {
							verb: 'create',
							sql: 'INSERT INTO users (email, username) VALUES (?, ?)',
							data: [email, login]
						}
					})
					if (body.status >= 400) return { status: body.status, message: body.message }
				}
				return { email, login, firstName: first_name, lastName: last_name }
			})
		return infoFetch
	}
	return null
}
