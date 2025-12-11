import { FastifyInstance } from 'fastify'
import { logUser, registerUser } from './auth.route.js'
import { deleteUser, getUsers, updateUser, userDashboard } from './user.route.js'
import { getMetrics } from './metrics.route.js'

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
			url: '/users/:id',
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
