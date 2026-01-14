import { FastifyInstance } from 'fastify'
import { logoutUser, logUser, registerUser, validateToken } from './auth.route.js'
import { deleteUser, getUsers, updateUser, userDashboard } from './user.route.js'
import { getMetrics } from './metrics.route.js'
import { handlePOSTApiAuthRegister, handlePOSTApiAuthLogin, getClientID } from './api.route.js'
import { getPayload } from '../crud/auth.crud.js'

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
	}),
	fastify.route({
		method: 'GET',
		url: '/get_payload',
		handler: getPayload
	}),
	fastify.route({
		method: 'POST',
		url: '/logout',
		handler: logoutUser
	})
	fastify.route({
		method: 'GET',
		url: '/validateToken',
		handler: validateToken
	})
}

export async function userRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'GET',
		url: '/dashboard',
		handler: userDashboard
	}),
	fastify.route({
		method: 'GET',
		url: '/users',
		handler: getUsers
	}),
	fastify.route({
		method: 'PUT',
		url: '/update_user',
		handler: updateUser
	}),
	fastify.route({
		method: 'DELETE',
		url: '/users',
		handler: deleteUser
	})
}

export async function metricsRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'GET',
		url: '/metrics',
		handler: getMetrics
	})
}
