import { FastifyReply, FastifyRequest } from 'fastify'
import { pipeline } from 'stream/promises'
import fs from "fs"
import path from "path"
import { generateAndSendToken, getPayload } from '../crud/auth.crud.js'
import { dbPostQuery } from '../services/db.service.js'

export async function updateAvatar(req: FastifyRequest, reply: FastifyReply) {
  const data = await req.file()
  if (!data) return reply.code(400).send({ message: 'No file uploaded.' })
  const token = await getPayload(req)
  if (!token) return reply.status(401).send('Invalid or missing token.')
  const userInfo = token.userInfo
  const { id } = userInfo

  if (!data.mimetype || !data.mimetype.startsWith('image/'))
    return reply.code(400).send({ message: 'Invalid file type' })

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

  let body = await dbPostQuery({ endpoint: 'dbRun', query: { verb: 'update', sql: 'UPDATE users SET avatar = ? WHERE id = ?', data: [relativeFilePath, id] } })
  if (body.status >= 400) return reply.status(body.status).send({ message: body.message })

  await pipeline(
    data.file,
    fs.createWriteStream(filePath, { flags: 'w' })
  )

  userInfo.avatar = relativeFilePath
  const tokenResult = await generateAndSendToken(userInfo, reply)
  if (tokenResult.status >= 400) return reply.status(tokenResult.status).send({ message: tokenResult.message })

  return reply.status(200).send({ message: `Avatar updated: ${id} ${data.filename}` })
}
