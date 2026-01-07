import { FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcrypt'
import { userRegisterType, userLoginType } from '../../types/user.type.js'
import { checkIfAlreadyLoggedIn } from '../crud/auth.crud.js'
import { dbPostQuery } from '../crud/dbQuery.crud.js'
import { vaultPostQuery } from '../crud/vaultQuery.crud.js'
import { createToken } from '../crud/jwt.crud.js'
import { pipeline } from 'stream/promises'
import { isUsernameFormatInvalid, isEmailFormatInvalid, isPwdFormatInvalid, isAvatarFileFormatInvalid} from '../../frontend/functions/formValidation.js'
import fs from 'fs'

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

async function getMultipartFormData(req: FastifyRequest) {
	const parts = req.parts()
	const data: any = {};
	for await (const part of parts) {
		if (part.type === 'file') {
			console.log('--BACK-- Received file:', part)
			if (!part.mimetype.startsWith('image/'))
				return {"error": 'Invalid file type'}
			const filePath = `/app/srcs/frontend/images/avatars/${part.filename}`
			await pipeline(part.file, fs.createWriteStream(filePath)) // TODO after form is validated
			data[part.fieldname] = filePath
		} else
			data[part.fieldname] = part.value
	}
	return data
}

export async function registerUser(req: FastifyRequest, reply: FastifyReply) {
	const data = await getMultipartFormData(req)
	let avatar = data['avatar']
	if (avatar === '')
		avatar = '/app/srcs/frontend/images/avatars/baseAvatar.jpg'
	console.log('--BACK-- avatar:', avatar)
	const { username, email, checkmail, pwd, checkpwd } = data as userRegisterType
	console.log('--BACK-- Registering user with data:', {
		username: username,
		email: email,
		checkmail: checkmail,
		pwd: pwd,
		checkpwd: checkpwd,
		avatar: avatar
	})
	if (isUsernameFormatInvalid(username)) return reply.status(400).send({ message: 'Invalid username format' })
	if (isEmailFormatInvalid(email)) return reply.status(400).send({ message: 'Invalid email format' })
	if (email !== checkmail) return reply.status(400).send({ message: 'Emails do not match' })
	if (isPwdFormatInvalid(pwd)) return reply.status(400).send({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character' })
	if (pwd !== checkpwd) return reply.status(400).send({ message: 'Passwords do not match' })
	let body = await vaultPostQuery('getSecret', { name: 'bcrypt_salt' })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	const salt = body.message.value
	const hashedPwd = await bcrypt.hash(pwd, salt)
	body = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'create',
			sql: 'INSERT INTO users (avatar, pwd, email, username) VALUES (?, ?, ?, ?)',
			data: [ avatar, hashedPwd, email, username]
		}
	})
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(201).send({ message: 'User registered', data: { username: username, pwd: pwd } })
}

export async function logUser(req: FastifyRequest, reply: FastifyReply) {
	const data = await getMultipartFormData(req)
	const { username, pwd } = await data as userLoginType
	console.log('--BACK-- Logging in user with data:', { username: username, pwd: pwd })
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
