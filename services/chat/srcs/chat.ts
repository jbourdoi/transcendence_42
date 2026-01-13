const clients = new Set<WebSocket>()

type MessageType = {
	type: 'global' | 'mp' | 'auth'
	to?: string
	msg: string
}

const clientsList = new Set()

const server = Bun.serve({
	port: 4444,
	fetch(req, server) {
		if (server.upgrade(req)) {
			return
		}
		return new Response('WebSocket chat server running', {
			status: 200
		})
	},
	websocket: {
		open(ws) {
			clients.add(ws)
			console.log('Client connected')

			ws.send(
				JSON.stringify({
					type: 'system',
					message: 'Welcome to the chat!'
				})
			)
		},
		message(ws, message) {
			const data = JSON.parse(message)

			console.log(data)
			if (data.type === 'auth') {
				clientsList.add({
					socket: ws,
					id: data.userId
				})
			}

			if (data.type === 'global') {
				for (const client of clients) {
					if (client.readyState === WebSocket.OPEN) {
						client.send(message)
					}
				}
			}
		},
		close(ws) {
			clients.delete(ws)
			console.log('Client disconnected')
		}
	}
})

console.log(`Chat server running on ws://localhost:${server.port}`)
