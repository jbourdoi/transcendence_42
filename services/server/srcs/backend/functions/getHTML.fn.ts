import __dirname from './dirname.fn.js'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { applyTemplate } from './applyTemplate.fn.js'
import { applyError } from './applyError.fn.js'

export async function getHTML(route: string, type?: string, error?: number): Promise<string> {
	return new Promise(async (resolve, reject) => {
		const filePath = path.join(__dirname(), 'srcs/backend/pages', `${type !== 'error' ? route : 'error'}.html`)

		if (!existsSync(filePath)) return reject()

		let pageContent = readFileSync(filePath, 'utf8')
		if (pageContent === null) return reject()

		if (type === 'render') {
			pageContent = await applyTemplate(pageContent)
		} else if (type === 'error') {
			pageContent = await applyTemplate(pageContent)
			pageContent = await applyError(pageContent, error || 400)
		}
		resolve(pageContent)
	})
}
