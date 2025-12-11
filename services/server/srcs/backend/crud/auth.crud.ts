import { FastifyRequest } from 'fastify'
import { verifyToken } from './jwt.crud.js'
import { JWTPayload } from 'jose'

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
