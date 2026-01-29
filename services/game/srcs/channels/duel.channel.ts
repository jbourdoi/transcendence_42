import { BunSocketType } from '../types/bunSocket.type'
import User from '../classes/User.js'
import Lobby from '../classes/Lobby.js'
import { DuelType } from '../types/message.type.js'

export function duelChannel(ws: BunSocketType, data: DuelType, lobby : Lobby)
{
	const sender : User = ws.data.user;
	const msg = data
	if (!sender) return ;
	const destinataire = lobby.getUserByPseudo(msg.to)
	if (!destinataire) return sender.send({ type: 'error', text: `404 '${msg.to}' not found` })
	switch (msg.action)
	{
		case 'propose':
		{
			destinataire.send({ type: 'duel', from: sender.pseudo, action: 'propose' })
			console.log(`${sender.pseudo} send a duel to ${destinataire.pseudo}`)
			break
		}
		case 'accept':
		{
			if (destinataire.status === "game")
			{
				sender.send({ type: 'info', text: `${destinataire.pseudo} is already in a game, please try again later`})
				break;
			}
			console.log(`${sender.pseudo} accept a duel from ${destinataire.pseudo}`)
			sender.send({type: 'duel', from: destinataire.pseudo, action: 'accept'})
			destinataire.send({type: 'duel', from: sender.pseudo, action: 'accept'})
			lobby.gameManager.createGame([destinataire, sender])
			break
		}
		case 'decline':
		{
			sender.send({type: 'duel', from: destinataire.pseudo, action: 'decline'})
			destinataire.send({type: 'duel', from: sender.pseudo, action: 'decline'})
			console.log(`${sender.pseudo} decline a duel from ${destinataire.pseudo}`)
		}
	}
}
