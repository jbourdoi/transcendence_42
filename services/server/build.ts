import { build } from 'esbuild'
import fg from 'fast-glob'
import { watch } from 'chokidar'

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

watch('srcs/frontend', { ignoreInitial: true }).on('all', async () => {
	console.log('Change detected, rebuilding...')
	await buildAll()
})
