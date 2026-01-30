import { FastifyRequest } from 'fastify'
import { pipeline } from 'stream/promises'
import fs from 'fs'

export async function getMultipartFormData(req: FastifyRequest) {
	const parts = req.parts()
	const data: any = {}
	for await (const part of parts) {
		if (part.type === 'file') {
			console.log('--BACK-- Received file:', part)
			if (!part.mimetype.startsWith('image/')) return { error: 'Invalid file type' }
			const filePath = `/app/srcs/frontend/images/avatars/${part.filename}`
			await pipeline(part.file, fs.createWriteStream(filePath))
			data[part.fieldname] = filePath
		} else data[part.fieldname] = part.value
	}
	return data
}
