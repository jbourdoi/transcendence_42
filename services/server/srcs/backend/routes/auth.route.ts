import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import httpErrors from 'http-errors'
import bcrypt from 'bcrypt'
import { UserRegisterType, UserLoginType } from '../../types/user.type.js'
import { checkIfAlreadyLoggedIn, generateAndSendToken, userTokenCookieOptions } from '../crud/auth.crud.js'
import { dbPostQuery } from '../services/db.service.js'
import { getVaultSecret } from '../services/vault.service.js'
import {
	validateUsernameFormat,
	validateEmailFormat,
	validatePwdFormat,
	validateConfirmEmailFormat,
	validateConfirmPwdFormat
} from '../../frontend/functions/formValidation.js'
import { InfoFetchType } from '../../types/infofetch.type.js'
import { create2FAChallenge } from './2fa.route.js'

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
	console.log(req)
	const { username, email, checkmail, pwd, checkpwd } = await req.body.data as UserRegisterType
	const avatar = '/images/avatars/baseAvatar.jpg'

	console.log('--BACK-- Registering user with data:', {
		username: username,
		email: email,
		checkmail: checkmail,
		pwd: pwd,
		checkpwd: checkpwd,
		avatar: avatar
	})

	const usernameError = validateUsernameFormat(username)
	if (usernameError) return reply.status(400).send({ message: usernameError })

	const emailError = validateEmailFormat(email)
	if (emailError) return reply.status(400).send({ message: emailError })

	const emailConfirmError = validateConfirmEmailFormat(checkmail, email)
	if (emailConfirmError) return reply.status(400).send({ message: emailConfirmError })

	const pwdError = validatePwdFormat(pwd)
	if (pwdError) return reply.status(400).send({ message: pwdError })

	const pwdConfirmError = validateConfirmPwdFormat(checkpwd, pwd)
	if (pwdConfirmError) return reply.status(400).send({ message: pwdConfirmError })

	const salt = await getVaultSecret<string>('bcrypt_salt', value => value)
	if (!salt) return reply.status(500).send({ message: 'Failed to retrieve bcrypt_salt from Vault' })

	const hashedPwd = await bcrypt.hash(pwd, salt)
	const body = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'create',
			sql: 'INSERT INTO users (avatar, pwd, email, username) VALUES (?, ?, ?, ?)',
			data: [avatar, hashedPwd, email, username]
		}
	})

	if (body.status >= 400) {
		if (body.message.code === 'SQLITE_CONSTRAINT') {
			throw httpErrors(409, body.message.code)
		}
		throw httpErrors(body.status, body.message.code)
	}

	const infoFetch: InfoFetchType = {
		email,
		username,
		id: body.data.lastID,
		has_2fa: body.data.has_2fa === 1,
		avatar: avatar,
		info: {
			status: 200
		}
	}
	console.log('REGISTER FORM --- infoFetch:', infoFetch)
	const tokenResult = await generateAndSendToken(infoFetch, reply)
	if (tokenResult.status >= 400) return reply.status(tokenResult.status).send({ message: tokenResult.message })
}

export async function logUser(req: FastifyRequest, reply: FastifyReply) {
	const { username, pwd } = await req.body.data as UserLoginType

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

	const infoFetch: InfoFetchType = {
		email: body.data.email,
		username: body.data.username,
		id: body.data.id,
		has_2fa: body.data.has_2fa === 1,
		avatar: body.data.avatar,
		info: {
			status: 200
		}
	}
	if (infoFetch.has_2fa === true) {
		infoFetch.info.message = '2FA_REQUIRED'
		const userData = { userId: infoFetch.id, purpose: 'login' }
		const res = await create2FAChallenge(userData)
		if (res.status >= 400) return reply.status(res.status).send({ info: res.message })
		return reply.status(200).send({ ...infoFetch })
	}
	console.log('LOGIN FORM --- infoFetch:', infoFetch)
	const tokenResult = await generateAndSendToken(infoFetch, reply)
	if (tokenResult.status >= 400) return reply.status(tokenResult.status).send({ message: tokenResult.message })
}

export async function logoutUser(req: FastifyRequest, reply: FastifyReply) {
	return reply.status(200).clearCookie('token', userTokenCookieOptions()).send({ message: 'User logged out' })
}
