import fs from 'fs'

export function log(message: string, level: 'info' | 'warn' | 'error') {
	const logMessage = JSON.stringify({
		container_name: 'server',
		timestamp: new Date().toISOString(),
		level: level.toUpperCase(),
		message: message
	})
	fs.writeFileSync('/app/logs/server.log', logMessage, { flag: 'a' })
	fs.writeFileSync('/app/logs/server.log', '\n', { flag: 'a' })
}
