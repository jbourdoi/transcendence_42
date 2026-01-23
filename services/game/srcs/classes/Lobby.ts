import { randomUUID } from 'crypto'

import User from './User.js'
import { RemoteGame } from './RemoteGame.js'
import type { DuelType, FrontType, InputType, MessageType } from '../types/message.type.js'

export default class Lobby {
	private users = new Map<string, User>()

	constructor() {
		console.log(`🆕 Lobby created`)
	}

	toJSON(): Object {
		return {
			size: this.size,
			nb_active: this.nb_active(),
			users: Array.from(this.users.values()).map(u => u.toJSON())
		}
	}

	nb_active(): number {
		let nb = 0
		for (const user of this.users.values())
		{
			if (user.socket?.readyState === WebSocket.OPEN) nb++
		}
		return nb
	}

	createUser(pseudo: string) : User
	{
		let user = this.getUserByPseudo(pseudo)
		if (user) return user;
		user = new User(randomUUID(), pseudo);
		console.log(`🆕 ${user.pseudo} join the lobby`)
		this.users.set(user.id, user);
		return user;
	}

	addUser(pseudo: string) {
		if (this.isPseudoTaken(pseudo)) return { id: '0', pseudo: '' }
		const newUser = new User(randomUUID(), pseudo)
		this.users.set(newUser.id, newUser)
		console.log(`🆕 ${newUser.pseudo} join the lobby`)
		this.broadcast({
			type: 'system',
			text: `${newUser.pseudo} join the lobby.`
		})
		return { userId: newUser.id, pseudo: newUser.pseudo }
	}

	// refreshWebsocket(userId: string, websocket: WebSocket) {
	// 	const user = this.getUser(userId)
	// 	if (!user || user.socket?.readyState === WebSocket.OPEN) return
	// 	user.socket = websocket
	// 	console.log(`🆕 ${user.pseudo} refresh his websocket`)
	// }

	getUser(userId: string): User | undefined {
		return this.users.get(userId)
	}

	removeUser(user: User) {
		if (!user) return
		console.log(`❌ ${user.pseudo} left the lobby`)
		this.broadcast({
			type: 'system',
			text: `${user.pseudo} left the lobby.`
		})
	}

	handleDuel(sender: User, msg: DuelType) {
		const destinataire = this.getUserByPseudo(msg.to)
		if (!destinataire) return sender.send({ type: 'error', text: `${msg.to} can't be found` })
		switch (msg.action)
		{
			case 'propose':
			{
				if (sender.status !== 'chat') return sender.send({ type: 'error', text: `You're already in game` })
				if (destinataire.status !== 'chat') return sender.send({ type: 'error', text: `${msg.to} isn't available` })
				destinataire.send({ type: 'duel', from: sender.pseudo, action: 'propose' })
				console.log(`${sender.pseudo} send a duel to ${destinataire.pseudo}`)
				break
			}
			case 'accept':
			{
				console.log(`${sender.pseudo} create game`)
				new RemoteGame([destinataire, sender])
				destinataire.send({ type: 'duel', from: sender.pseudo, action: 'accept' })
				console.log(`${sender.pseudo} accept a duel from ${destinataire.pseudo}`)
				break
			}
			case 'decline':
			{
				destinataire.send({ type: 'duel', from: sender.pseudo, action: 'decline' })
				console.log(`${sender.pseudo} refuse a duel from ${destinataire.pseudo}`)
			}
		}
	}

	handleInputKey(sender: User, msg: InputType) {
		sender.key = msg.key
	}

	broadcast(payload: FrontType, exceptId?: string) {
		const now = Date.now()
		for (const [id, user] of this.users.entries()) {
			if (id !== exceptId) user.send({ ...payload, timestamp: now, lobby: { size: this.size, nb_active: this.nb_active() } })
		}
	}

	get size() {
		return this.users.size
	}

	close() {
		this.broadcast({
			type: 'error',
			text: `server close inappropriately`
		})
		for (const user of this.users.values()) user.close('Lobby closed')
		this.users.clear()
		console.log(`❌ Lobby deleted`)
	}

	isPseudoTaken(pseudo: string): boolean {
		for (const user of this.users.values()) {
			if (user.pseudo === pseudo) return true
		}
		return false
	}

	getUserByPseudo(pseudo: string): User | undefined {
		for (const user of this.users.values()) {
			if (user.pseudo === pseudo) return user
		}
		return undefined
	}
}
