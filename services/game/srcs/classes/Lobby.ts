import { randomUUID } from 'crypto'

import User from './User.js'
import type { DuelType, FrontInfoType, FrontType, InputType } from '../types/message.type.js'
import { GameManager } from './GameManager.js'

export default class Lobby
{
	private users = new Map<string, User>()

	constructor(public gameManager: GameManager)
	{
		console.log(`🆕 Lobby created`)
	}

	toJSON(): Object
	{
		return {
			size: this.size,
			nb_active: this.nb_active(),
			users: Array.from(this.users.values()).map(u => u.toJSON())
		}
	}

	nb_active(): number
	{
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
		this.users.set(user.id, user);
		console.log(`🆕 ${user.pseudo} join the lobby`)
		const info : FrontInfoType = {type: 'info',text : `${pseudo} join the lobby`}
		this.broadcast(info)
		return user;
	}

	removeUser(user: User)
	{
		if (!user) return

		console.log(`❌ ${user.pseudo} left the lobby`)
		const info : FrontInfoType = {type: 'info',text : `${user.pseudo} left the lobby`}
		this.broadcast(info)
	}

	handleInputKey(sender: User, msg: InputType)
	{
		if (!sender || !msg) return ;
		sender.key = msg.key
	}

	broadcast(payload: FrontType, exceptId?: string)
	{
		const now = Date.now()
		for (const [id, user] of this.users.entries())
		{
			if (id !== exceptId && user) user.send({ ...payload, timestamp: now, lobby: { size: this.size, nb_active: this.nb_active() } })
		}
	}

	get size()
	{
		return this.users.size
	}

	close()
	{
		this.broadcast({
			type: 'error',
			text: `server close inappropriately`
		})
		for (const user of this.users.values()) user.close('Lobby closed')
		this.users.clear()
		console.log(`❌ Lobby deleted`)
	}

	isPseudoTaken(pseudo: string): boolean
	{
		for (const user of this.users.values()) {
			if (user.pseudo === pseudo) return true
		}
		return false
	}

	getUserByPseudo(pseudo: string): User | undefined
	{
		for (const user of this.users.values()) {
			if (user.pseudo === pseudo) return user
		}
		return undefined
	}
}
