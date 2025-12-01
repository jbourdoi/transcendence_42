import { readFile } from 'fs/promises'
import { join as pathJoin } from 'path'
import __dirname from './dirname.fn.js'
import { parseHTML } from 'linkedom'
import { statSync } from 'fs'

const templatePath = pathJoin(__dirname(), './srcs/pages', 'template.html')

let templateCache: string
let templateLastMTime = 0

getTemplate()

export async function applyTemplate(pageContent: string): Promise<string> {
	return new Promise(async (resolve, reject) => {
		let { document } = parseHTML(pageContent)

		const title: string | undefined = document.querySelector('title')?.innerHTML!
		const style: string | undefined = document.querySelector('style')?.outerHTML!
		const script: string | undefined = document.querySelector('script')?.outerHTML!
		const body: string = document.querySelector('page')?.outerHTML!

		let template = await getTemplate()
		let final = '' + template
		final = final.replace('{{body}}', body)
		final = final.replace('{{style}}', style)
		final = final.replace('{{title}}', title)
		final = final.replace('{{script}}', script || '')

		resolve(final)
	})
}

function getTemplate(): Promise<string> {
	return new Promise((resolve, reject) => {
		let currentMTime = statSync(templatePath).mtimeMs

		if (currentMTime > templateLastMTime) {
			readFile(templatePath, { encoding: 'utf8' }).then(data => {
				templateLastMTime = statSync(templatePath).mtimeMs
				templateCache = data
				return resolve('' + templateCache)
			})
		} else {
			return resolve('' + templateCache)
		}
	})
}
