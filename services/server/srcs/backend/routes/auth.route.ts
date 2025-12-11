import { FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcrypt'
import { userRegisterType, userLoginType } from '../../types/user.type.js'
import { checkIfAlreadyLoggedIn } from '../crud/auth.crud.js'
import { dbPostQuery } from '../crud/dbQuery.crud.js'
import { vaultPostQuery } from '../crud/vaultQuery.crud.js'
import { createToken } from '../crud/jwt.crud.js'

/* body to send for updateUser:
	PUT /user/1
	body
	{
		endpoint: "dbGet",
		query:{
			verb: "update",
			sql: "SELECT * FROM users WHERE id = ?",
			data:[
				{
					username: "Foo"
				},
				{
					email: "Bar"
				},
			]
		}
	}

	req {
		body: [username, email...]
		params: id
	}
*/

export async function registerUser(req: FastifyRequest, reply: FastifyReply) {
	const { name, pwd, checkpwd, email, checkmail, username } = req.body as userRegisterType
	if (email !== checkmail) return reply.status(400).send({ message: 'Emails do not match' })
	if (pwd !== checkpwd) return reply.status(400).send({ message: 'Passwords do not match' })
	let body = await vaultPostQuery('getSecret', { name: 'bcrypt_salt' })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	const salt = body.message
	const hashedPwd = await bcrypt.hash(pwd, salt)
	body = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'create',
			sql: 'INSERT INTO users (name, pwd, email, username) VALUES (?, ?, ?, ?)',
			data: [name, hashedPwd, email, username]
		}
	})
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(201).send({ message: 'User registered', data: { id: body.id, name: name } })
}

export async function logUser(req: FastifyRequest, reply: FastifyReply) {
	const { username, pwd } = req.body as userLoginType
	const alreadyLoggedInResponse = await checkIfAlreadyLoggedIn(req)
	if (alreadyLoggedInResponse) return reply.status(200).send({ message: 'Already logged in' })
	const body = await dbPostQuery({
		endpoint: 'dbGet',
		query: { verb: 'read', sql: 'SELECT * FROM users WHERE username = ?', data: [username] }
	})
	if (body.status >= 400) return reply.status(body.status).send(body.message)
	const matchPwd = await bcrypt.compare(pwd, body.data.pwd)
	if (!matchPwd) return reply.status(401).send({ message: 'Invalid password' })
	const token = await createToken(body.data.id)
	return reply
		.status(200)
		.setCookie('token', token, {
			// httpOnly: true,
			// secure: true,
			// sameSite: 'strict',
			// signed: true
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			signed: false
		})
		.send({ message: `${body.data.username} logged in successfully with token ${token}` })
}
