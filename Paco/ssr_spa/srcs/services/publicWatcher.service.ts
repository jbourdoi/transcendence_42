import { watch } from 'chokidar'
import { join as pathJoin, basename } from 'path'
import fs from 'fs'
import __dirname from '../functions/dirname.fn.js'

function copyFileToFolder(srcFile: string, destFolder: string) {
	const destFile = pathJoin(destFolder, basename(srcFile))

	fs.mkdirSync(destFolder, { recursive: true })
	fs.copyFileSync(srcFile, destFile)
}

export function publicWatcher() {
	const rootFolder = 'srcs/public'

	const watcher = watch(rootFolder, {
		ignored: [/(^|[\/\\])node_modules([\/\\]|$)/, /\.ts$/],
		persistent: true
	})

	watcher.on('add', path => {
		console.log(path)
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
		watcher.on('all', (event, path) => {
			console.log(path, event)
			if (['unlinkDir', 'add', 'unlink'].includes(event)) {
				watcher.close()
				publicWatcher()
			}
		})
	})
}
