import { build } from 'esbuild'
import fg from 'fast-glob'
import { watch } from 'chokidar'
import path from 'path'

const ignoreExt = new Set(['.png', '.jpg', '.jpeg', '.DS_Store'])

async function buildAll() {
	const entryPoints = await fg('srcs/frontend/**/*.ts')
	console.log('Building files:', entryPoints)

	await build({
		entryPoints,
		outbase: 'srcs/frontend',
		outdir: 'dist/public',
		bundle: true,
		splitting: true,
		format: 'esm',
		platform: 'browser'
	})
}

buildAll().catch(console.error)

watch('srcs/frontend', {
	ignoreInitial: true
}).on('all', async (evt, filePath) => {
	if (!ignoreExt.has(path.extname(filePath))) await buildAll()
})
