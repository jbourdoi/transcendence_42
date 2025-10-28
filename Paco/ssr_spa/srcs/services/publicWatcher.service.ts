import { watch } from 'chokidar'
import { join as pathJoin, extname, basename } from 'path'
import fs from 'fs'
import __dirname from '../functions/dirname.fn.js'

function copyFileToFolder(srcFile: string, destFolder: string) {
	fs.mkdirSync(destFolder, { recursive: true })

	const destFile = pathJoin(destFolder, basename(srcFile))

	fs.copyFileSync(srcFile, destFile)

	console.log(`Copied ${srcFile} to ${destFile}`)
}

function rmFileFromFolder(srcFile: string, destFolder: string) {
	const destFile = pathJoin(destFolder, basename(srcFile))

	fs.rmSync(destFile)

	console.log(`removed  ${destFile}`)
}

export function publicWatcher() {
	const rootFolder = 'srcs/public'
	let watchedList: string[] = []

	const watcher = watch(rootFolder, {
		ignored: [/(^|[\/\\])node_modules([\/\\]|$)/, /\.ts$/],
		persistent: true
	})

	watcher.on('add', path => {
		const originalFile = pathJoin(__dirname(), path)
		const newFile = pathJoin(__dirname(), path.replace('srcs', 'dist'))

		if (fs.existsSync(originalFile)) {
			copyFileToFolder(originalFile, newFile.replace(basename(newFile), ''))
		}
	})

	watcher.on('change', path => {
		const originalFile = pathJoin(__dirname(), path)
		const newFile = pathJoin(__dirname(), path.replace('srcs', 'dist'))

		if (fs.existsSync(originalFile)) {
			copyFileToFolder(originalFile, newFile.replace(basename(newFile), ''))
		}
	})

	watcher.on('ready', () => {
		watcher.on('all', event => {
			if (['unlinkDir', 'add', 'unlink'].includes(event)) {
				watcher.close()
				publicWatcher()
			}
		})
	})
}
