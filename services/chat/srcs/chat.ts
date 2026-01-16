const clients = new Set<WebSocket>()

type MessageType = {
	type: 'global' | 'mp' | 'auth' | 'info' | 'error' | 'users' | 'req-friend' | 'notification'
	to?: string
	msg: string
}

type ClientType = { username: string; socket: WebSocket }

let clientsList: Set<ClientType> = new Set<ClientType>()

function sendUserList() {
	const clients = []
	clientsList.forEach(client => {
		clients.push(client.username)
	})

	const message: MessageType = {
		msg: JSON.stringify(clients),
		type: 'users'
	}

	clientsList.forEach(client => {
		client.socket.send(JSON.stringify(message))
	})
}

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
			ws.send(
				JSON.stringify({
					type: 'system',
					message: 'Welcome to the chat!'
				})
			)
		},
		message(ws, message) {
			const data = JSON.parse(message)
			console.log('New Incoming message: ', data)
			if (data.type === 'auth') {
				ws.username = data.username
				for (let client of clientsList) {
					data.msg = `Player ${data.username} has connected`
					data.type = 'info'
					client.socket.send(JSON.stringify(data))
				}
				clientsList.add({
					socket: ws,
					username: data.username
				})
				sendUserList()
			} else if (data.type === 'global') {
				for (const client of clients) {
					if (client.readyState === WebSocket.OPEN) {
						client.send(message)
					}
				}
			} else if (data.type === 'mp') {
				let clientFound
				for (let client of clientsList) {
					if (client.username === data.to) {
						clientFound = client
					}
				}
				if (clientFound) {
					clientFound.socket.send(message)
					ws.send(message)
				} else {
					data.msg = 'Player not found'
					data.type = 'Error'
					ws.send(JSON.stringify(data))
				}
			} else if (data.type === 'req-friend') {
				let clientFound
				console.log('Friends request')
				for (let client of clientsList) {
					if (client.username === data.msg) {
						clientFound = client
					}
				}
				console.log('Client Found: ', clientFound)
				if (clientFound) {
					//TODO Add to DB the friends req
					data.msg = clientFound.username
					data.type = 'req-friend'
					clientFound.socket.send(JSON.stringify(data))

					data.type = 'notification'
					data.msg = `User ${ws.username} wants to be friends!`
					clientFound.socket.send(JSON.stringify(data))
				} else {
					data.msg = 'Player not found'
					data.type = 'Error'
					ws.send(JSON.stringify(data))
				}
			}
		},
		close(ws) {
			const message = {
				type: 'info',
				msg: `Player ${ws.username} has disconnected`
			}
			for (const client of clientsList) {
				if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
					client.socket.send(JSON.stringify(message))
				}
				if (client.socket === ws) {
					clientsList.delete(client)
				}
			}
			clients.delete(ws)
			sendUserList()
		}
	}
})

console.log(`Chat server running on ws://localhost:${server.port}`)
