import { FastifyInstance } from 'fastify'
import { logoutUser, logUser, registerUser } from './auth.route.js'
import { deleteUser, getUsers ,getUserProfile, updateUser, userDashboard, getUserFriends, getBlockedUser, getFriendUser } from './user.route.js'
import { getMetrics } from './metrics.route.js'
import { handlePOSTApiAuthRegister, handlePOSTApiAuthLogin, getClientID } from './api.route.js'
import { getPayload } from '../crud/auth.crud.js'
import { send2FACode, validate2FACode } from './2fa.route.js'
import { addMatch } from './match.route.js'

export async function authRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'POST',
		url: '/register',
		handler: registerUser
	})
	fastify.route({
		method: 'POST',
		url: '/login',
		handler: logUser
	})
	fastify.route({
		method: 'POST',
		url: '/api/auth/register',
		handler: handlePOSTApiAuthRegister
	})
	fastify.route({
		method: 'POST',
		url: '/api/auth/login',
		handler: handlePOSTApiAuthLogin
	})
	fastify.route({
		method: 'GET',
		url: '/api/auth/client_id',
		handler: getClientID
	})
	fastify.route({
		method: 'GET',
		url: '/get_payload',
		handler: getPayload
	})
	fastify.route({
		method: 'POST',
		url: '/logout',
		handler: logoutUser
	})
	fastify.route({
		method: 'POST',
		url: '/2fa/send_code',
		handler: send2FACode
	})
	fastify.route({
		method: 'POST',
		url: '/2fa/validate_code',
		handler: validate2FACode
	})
}

export async function userRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'GET',
		url: '/dashboard',
		handler: userDashboard
	})
	fastify.route({
		method: 'GET',
		url: '/users',
		handler: getUsers
	})
	fastify.route({
		method: 'POST',
		url: '/user_profile',
		handler: getUserProfile
	})
	fastify.route({
		method: 'POST',
		url: '/friends',
		handler: getUserFriends
	})
	fastify.route({
		method: 'PUT',
		url: '/update_user',
		handler: updateUser
	})
	fastify.route({
		method: 'POST',
		url: '/get_blocked_user',
		handler: getBlockedUser
	})
	fastify.route({
		method: 'POST',
		url: '/get_friend_user',
		handler: getFriendUser
	})
}

export async function gameRoute (fastify: FastifyInstance) {
	fastify.route({
		method: 'POST',
		url: '/add_match',
		handler: addMatch
	})
}

export async function metricsRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'GET',
		url: '/metrics',
		handler: getMetrics
	})
}
