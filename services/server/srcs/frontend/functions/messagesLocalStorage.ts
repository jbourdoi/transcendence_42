import { json_stringify, json_parse } from './json_wrapper.js'
import { FrontChatType, FrontMpTypeFrom, FrontMpTypeTo } from '../../types/message.type.js'

const STORAGE_KEY = 'chat_messages'
const MAX_MESSAGES = 20

// Récupérer les messages depuis le localStorage
export function getStoredMessages() : []
{
	const stored = localStorage.getItem(STORAGE_KEY)
	if (!stored) return []
	const messages = json_parse(stored) as []
	if (!messages) return []
	return messages
}

export function getMpMessages(from: string) : []
{
	const key = `mp_${from}`
	const stored = localStorage.getItem(key)
	if (!stored) return []
	const messages = json_parse(stored) as []
	if (!messages) return []
	return messages
}

// Ajouter un nouveau message
export function storeMessage(message: FrontChatType)
{
	let messages = getStoredMessages()

	messages.push(message as never) // ajouter le nouveau message à la fin

	// Garder uniquement les X derniers messages
	if (messages.length > MAX_MESSAGES)
	{
		messages = messages.slice(messages.length - MAX_MESSAGES) as []
	}
	localStorage.setItem(STORAGE_KEY, json_stringify(messages))
}

export function storeMP(message: FrontMpTypeFrom | FrontMpTypeTo) {
	const destinataire_pseudo = (message.type === "mp-from")? message.from : message.to
	const key = `mp_${destinataire_pseudo}`
	let messages = getMpMessages(key)
	messages.push(message as never)
	if (messages.length > MAX_MESSAGES)
	{
		messages = messages.slice(messages.length - MAX_MESSAGES) as []
	}
	localStorage.setItem(key, json_stringify(messages))
}

export function cleanHistory()
{
	localStorage.clear()
}

// Exemple d'utilisation quand un message arrive
export function handleIncomingMessage(message: FrontChatType | FrontMpTypeFrom | FrontMpTypeTo, displayMessage: any)
{
	console.log("handleIncomingMessage", message)
	// message peut être un objet { from, text, timestamp }
	if (message.type === 'chat') {
		storeMessage(message)
		displayMessage(message) // ta fonction existante pour l'affichage
	}
	if (message.type === 'mp-from' || message.type === 'mp-to') {
		storeMP(message)
	}
}

// Pour récupérer et afficher les messages stockés au chargement de la page
export function loadChatHistory(displayMessage: any)
{
	const messages = getStoredMessages()
	console.log('loadChatHistory', messages)
	messages.forEach(displayMessage)
}
