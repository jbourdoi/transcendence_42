import { FastifyReply, FastifyRequest } from 'fastify'
import { dbPostQuery } from '../services/db.service.js'
import { getPayload } from '../crud/auth.crud.js'
import { userUpdateType } from '../../types/user.type.js'
import { getMultipartFormData } from '../crud/multipartForm.js'
import { isUsernameFormatInvalid } from '../../frontend/functions/formValidation.js'

export async function userDashboard(req: FastifyRequest, reply: FastifyReply) {
	const token = await getPayload(req)
	if (!token) return reply.status(401).send('Invalid or missing token')
	const body = await dbPostQuery({ endpoint: 'dbGet', query: { verb: 'read', sql: 'SELECT * FROM users WHERE id = ?', data: [token.id] } })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(200).send(body.data)
}

export async function getUsers(req: FastifyRequest, reply: FastifyReply) {
	const body = await dbPostQuery({ endpoint: 'dbAll', query: { verb: 'read', sql: 'SELECT * FROM users' }, data: [] })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(200).send(body.data)
}

export async function updateUser(req: FastifyRequest, reply: FastifyReply) {
	const data = await getMultipartFormData(req)

	const token = await getPayload(req)
	if (!token) return reply.status(401).send('Invalid or missing token')
	const id = token.id

	const username = data['username']
	const avatar = data['avatar']

	console.log(username, avatar)
	if (!username && !avatar)
		return reply.status(400).send({ message: 'No fields to update' })
	
	let updateQuery: userUpdateType = {}
	if (username)
	{
		if (isUsernameFormatInvalid(username))
			return reply.status(400).send({ message: 'Invalid username format' })
		updateQuery.username = username
	}
	if (avatar) updateQuery.avatar = avatar

	console.log('updateQuery', updateQuery)

	let body = await dbPostQuery({endpoint: 'dbGet', query: { verb: 'read', sql: 'SELECT * FROM users WHERE id = ?', data: [id] } })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	console.log('body from dbGet', body.data)

	if (username && username == body.data.username)
		return reply.status(200).send({ message: 'No changes made' })
	let query = 'UPDATE users SET'
	let paramsValue = []
	let entries = Object.entries(updateQuery)

	for (let [index, [key, value]] of entries.entries()) {
		console.log(index, key, value)
		query += ` ${key} = ? `
		if (index < entries.length - 1) query += ','
		paramsValue.push(value)
	}

	paramsValue.push(id)
	query += 'WHERE id = ?'

	console.log('query', query)
	body = await dbPostQuery({ endpoint: 'dbRun', query: { verb: 'update', sql: query, data: paramsValue } })
	if (body.data?.changes === 0) return reply.status(200).send({ message: 'No changes made' })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(200).send({ message: `User updated: ${id} ${paramsValue[0]}` })
}

export async function deleteUser(req: FastifyRequest, reply: FastifyReply) {
	// do with token and token.id instead of id
	const { id } = (await req.body) as { id: string }
	const body = await dbPostQuery({ endpoint: 'dbRun', query: { verb: 'delete', sql: 'DELETE FROM users WHERE id = ?', data: [id] } })
	if (body.data.changes === 0) return reply.status(404).send({ message: 'User not found' })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(200).send({ message: `User deleted: ${id}` })
}
