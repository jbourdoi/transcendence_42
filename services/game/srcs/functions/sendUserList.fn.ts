import { clientsList } from '../state/clients.state'
import { MessageType } from '../types/message.type'

export function sendUserList() {
	const clients: string[] = []
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
