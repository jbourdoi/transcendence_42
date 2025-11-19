import { WebSocket } from "ws";
import { randomUUID } from "crypto";

import User from "./User.js"
// import createGameServer from "./GameServer.js"
import { Game } from "./Game.js"

export default class Lobby
{
	private users = new Map<string, User>()
	private messages = {}

	constructor() { console.log(`🆕 Lobby created`) }

	toJSON() : Object
	{
		return {
			size: this.size,
			nb_active: this.nb_active(),
			users: Array.from(this.users.values()).map(u => (u.toJSON()))
		};
	}

	nb_active() : number
	{
		let nb = 0
		for (const user of this.users.values())
		{
			if (user.socket?.readyState === WebSocket.OPEN)
				nb++
		}
		return nb
	}

	addUser(pseudo: string)
	{
		if (this.isPseudoTaken(pseudo)) return {id:"0", pseudo:""}
		const newUser = new User(randomUUID(), pseudo)
		this.users.set(newUser.id, newUser)
		console.log(`🆕 ${newUser.pseudo} join the lobby`)
		this.broadcast(
			{
				type: "system",
				text: `${newUser.pseudo} join the lobby.`,
				timestamp: Date.now()
			}
		)
		return {userId:newUser.id, pseudo:newUser.pseudo}
	}

	refreshWebsocket(userId: string, websocket:WebSocket)
	{
		const user = this.getUser(userId)
		if (!user || user.socket?.readyState === WebSocket.OPEN) return
		user.socket = websocket
		console.log(`🆕 ${user.pseudo} refresh his websocket`)
		this.broadcast({})
	}

	getUser(userId: string): User | undefined
	{
		return this.users.get(userId)
	}

	removeUser(user: User)
	{
		if (!user) return
		console.log(`❌ ${user.pseudo} left the lobby`)
		this.broadcast({
				type: "system",
				text: `${user.pseudo} left the lobby.`,
				timestamp: Date.now()
			})
	}

	handleMessage(sender: User, msg: any)
	{
		const now = Date.now()
		if (msg?.type === "chat")
		return this.broadcast({
				type: "chat",
				from: sender.pseudo,
				text: msg.text,
				timestamp: now
			})
		if (msg?.type === "input")
			return //console.log(msg)
		const destinataire = this.getUserByPseudo(msg.to)
		if (!destinataire)
			return sender.send({type:"error", text: `${msg.to} can't be found`, timestamp: now})
		if (msg?.type === "mp")
		{
			console.log(`${sender.pseudo} send a message to ${destinataire.pseudo}`)
			destinataire.send({type:"mp", from: sender.pseudo, text: msg.text, timestamp: now})
			sender.send({type:"mp", to:msg.to, text: msg.text, timestamp: now})
		}
		else if (msg?.type === "duel" && msg?.action === "propose")
		{
			if (sender.status !== "chat")
				return sender.send({type:"error", text: `You're already in game`, timestamp: now})
			if (destinataire.status !== "chat")
				return sender.send({type:"error", text: `${msg.to} isn't available`, timestamp: now})
			destinataire.send({type:"duel", from: sender.pseudo, action:"propose" , timestamp: now})
			console.log(`${sender.pseudo} send a duel to ${destinataire.pseudo}`)
		}
		else if (msg?.type === "duel" && msg?.action === "decline")
		{
			destinataire.send({type:"duel", from: sender.pseudo, action:"decline" , timestamp: now})
			console.log(`${sender.pseudo} refuse a duel from ${destinataire.pseudo}`)
		}
		else if (msg?.type === "duel" && msg?.action === "accept")
		{
			console.log(`${sender.pseudo} create game`)
			new Game(destinataire, sender)
			destinataire.send({type:"duel", from: sender.pseudo, action:"accept" , timestamp: now})
			// sender.send({type:"duel", from: destinataire.pseudo, action:"accept" , timestamp: now})
			console.log(`${sender.pseudo} accept a duel from ${destinataire.pseudo}`)
		}

	}


	// cleanup() {
	// 	for (const [id, user] of this.users.entries()) {
	// 		if (user.socket?.readyState === WebSocket.CLOSED) {
	// 			console.log(`🧹 Removing disconnected user ${user.pseudo}`);
	// 			this.users.delete(id);
	// 		}
	// 	}
	// }

	broadcast(payload: any, exceptId?: string)
	{
		// this.cleanup()
		for (const [id, user] of this.users.entries())
		{
			if (id !== exceptId)
				user.send({...payload, lobby:{size:this.size, nb_active:this.nb_active()}});
		}
	}

	get size()
	{
		return this.users.size;
	}

	close()
	{
		this.broadcast({
				type: "system",
				text: `server close inappropriately`,
				timestamp: Date.now()
			})
		for (const user of this.users.values()) user.close("Lobby closed");
		this.users.clear();
		console.log(`❌ Lobby deleted`);
	}

	isPseudoTaken(pseudo: string): boolean
	{
		for (const user of this.users.values())
		{
			if (user.pseudo === pseudo)
				return true;
		}
		return false;
	}

	getUserByPseudo(pseudo: string) : User | undefined
	{
		for (const user of this.users.values())
		{
			if (user.pseudo === pseudo)
				return user;
		}
		return undefined;
	}
}
