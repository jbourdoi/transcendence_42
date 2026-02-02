import { FastifyReply, FastifyRequest } from 'fastify'
import { pipeline } from 'stream/promises'
import fs from 'fs'
import path from 'path'
import { generateAndSendToken, getPayload } from '../crud/auth.crud.js'
import { dbPostQuery } from '../services/db.service.js'

function parseContentLength(req: FastifyRequest) {
	const contentLength = req.headers['content-length']
	if (!contentLength) return { status: 400, message: 'Content-Length header missing' }
	const length = Array.isArray(contentLength) ? parseInt(contentLength[0], 10) : parseInt(contentLength, 10)

	if (length > 100 * 1024) return { status: 413, message: 'File too large' }
	console.log('length: ', length)
	return { status: 200, message: 'OK' }
}

export async function updateAvatar(req: FastifyRequest, reply: FastifyReply) {
	const length = parseContentLength(req)
	if (length.status === 400) return reply.status(length.status).send({ message: length.message })
	else if (length.status === 413) return reply.status(length.status).send({ message: length.message })

	const data = await req.file()
	if (!data) return reply.status(400).send({ message: 'No file uploaded.' })
	const token = await getPayload(req)
	if (!token) return reply.status(401).send('Invalid or missing token.')
	const userInfo = token.userInfo
	const { id } = userInfo

	if (!data.mimetype || !data.mimetype.startsWith('image/')) return reply.status(400).send({ message: 'Invalid file type' })

	let user = await dbPostQuery({
		endpoint: 'dbGet',
		query: { verb: 'read', sql: 'SELECT * FROM users WHERE id = ?', data: [id] }
	})
	if (user.status >= 400) return reply.status(user.status).send({ message: user.message })

	const fileExtension = path.extname(data.filename)
	data.filename = `${id}${fileExtension}`

	const uploadDir = path.join(process.cwd(), 'dist/public/images/avatars')
	await fs.promises.mkdir(uploadDir, { recursive: true })

	const filePath = path.join(uploadDir, data.filename)
	const relativeFilePath = `/images/avatars/${data.filename}`

	let body = await dbPostQuery({
		endpoint: 'dbRun',
		query: { verb: 'update', sql: 'UPDATE users SET avatar = ? WHERE id = ?', data: [relativeFilePath, id] }
	})
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })

	await pipeline(data.file, fs.createWriteStream(filePath, { flags: 'w' }))

	userInfo.avatar = relativeFilePath
	const tokenResult = await generateAndSendToken(userInfo, reply)
	if (tokenResult.status >= 400) return reply.status(tokenResult.status).send({ message: tokenResult.message })

	return reply.status(200).send({ message: `Avatar updated: ${id} ${data.filename}` })
}

export async function resetAvatar(req: FastifyRequest, reply: FastifyReply) {
	const token = await getPayload(req)
	if (!token) return reply.status(401).send('Invalid or missing token.')
	const userInfo = token.userInfo
	const { id } = userInfo

	let user = await dbPostQuery({
		endpoint: 'dbGet',
		query: { verb: 'read', sql: 'SELECT * FROM users WHERE id = ?', data: [id] }
	})
	if (user.status >= 400) return reply.status(user.status).send({ message: user.message })

	const relativeFilePath = '/images/avatars/baseAvatar.jpg'

	let body = await dbPostQuery({
		endpoint: 'dbRun',
		query: { verb: 'update', sql: 'UPDATE users SET avatar = ? WHERE id = ?', data: [relativeFilePath, id] }
	})
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })

	userInfo.avatar = relativeFilePath
	const tokenResult = await generateAndSendToken(userInfo, reply)
	if (tokenResult.status >= 400) return reply.status(tokenResult.status).send({ message: tokenResult.message })

	return reply.status(200).send({ message: `Avatar reseted` })
}
