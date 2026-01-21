import { FrontType } from '../../types/message.type.ts'
import { launchGame } from '../functions/GameClientBab'
import { json_parse, json_stringify } from '../functions/json_wrapper'
import { cleanHistory, handleIncomingMessage, loadChatHistory } from '../functions/messagesLocalStorage'

const $page: HTMLElement = document.querySelector('page[type=game]')!
const gamehost = "localhost:3333"

type UserType = {
	userId: string,
	pseudo: string,
	websocket: WebSocket | undefined
}

let user: UserType = {
	userId: '',
	pseudo: '',
	websocket: undefined
}

export function getUser()
{
	return user
}

let lobby: any = undefined
let handleSendBound: undefined | ((e: KeyboardEvent) => void)

const chatDiv = document.querySelector<HTMLDivElement>('#chat')!

const lobbyDiv = document.createElement('div')
const pseudoDiv = document.createElement('div')
const statusDiv = document.createElement('div')
const userListDiv = document.createElement('div')
const messagesDiv = document.createElement('div')
const messageInput = document.createElement('input')
lobbyDiv.className = 'lobby'
pseudoDiv.className = 'pseudo'
statusDiv.className = 'ws-status'
messagesDiv.className = 'messages'
messageInput.className = 'chat-input hidden'
userListDiv.className = 'user-list'
userListDiv.style.display = 'none'

const location = window.location
console.log('location:', location)
const origin = location.origin
const host = location.host

lobbyDiv.addEventListener('mouseenter', async () => {
	try {
		// const res = await fetch(`${origin}/api/lobby`)
		const res = await fetch(`https://${gamehost}/api/lobby`)
		const lobby = await res.json()
		updateUserList(lobby.users)
		// Positionner la liste juste sous la lobby
		userListDiv.style.position = 'absolute'
		userListDiv.style.top = '5%' // juste sous le texte lobby
		userListDiv.style.left = '27%'
		userListDiv.style.display = 'block'
	} catch (e) {
		console.error('Erreur lobby:', e)
	}
})

// Masquer quand on quitte la lobby ET la liste
function hideList(e: any) {
	if (!lobbyDiv.contains(e.relatedTarget) && !userListDiv.contains(e.relatedTarget)) {
		userListDiv.style.display = 'none'
	}
}
lobbyDiv.addEventListener('mouseleave', hideList)
userListDiv.addEventListener('mouseleave', hideList)

function updateUserList(users: any[]) {
	userListDiv.innerHTML = ''

	users.forEach(u => {
		if (u.pseudo === user.pseudo) return

		const userDiv = document.createElement('div')
		userDiv.className = 'user-item'
		userDiv.dataset.userId = u.pseudo

		const pseudoSpan = document.createElement('span')
		pseudoSpan.textContent = u.pseudo
		pseudoSpan.className = 'user-pseudo'

		const statusSpan = document.createElement('span')
		statusSpan.textContent = u.status
		statusSpan.className = 'user-status'

		// Création des boutons
		// const btnAddFriend = createButton("Ajouter", "add-friend");
		// const btnRemoveFriend = createButton("Enlever", "remove-friend");
		// const btnBlock = createButton("Bloquer", "block");
		// const btnUnblock = createButton("Débloquer", "unblock");
		const btnMP = createButton('MP', 'mp')
		const btnDuel = createButton('Duel', 'duel')

		// Ajouter tout à la div utilisateur
		userDiv.append(pseudoSpan, statusSpan, /*btnAddFriend, btnRemoveFriend, btnBlock, btnUnblock,*/ btnMP, btnDuel)
		userListDiv.appendChild(userDiv)
	})
}

// helper pour créer un bouton
function createButton(text: string, action: string) {
	const btn = document.createElement('button')
	btn.textContent = text
	btn.dataset.action = action
	btn.className = 'user-action-btn'
	return btn
}

// Event delegation pour gérer les clics sur tous les boutons
userListDiv.addEventListener('click', (e: Event) => {
	const target = e.target as HTMLElement

	// si c'est un bouton d'action
	if (target.tagName === 'BUTTON' && target.dataset.action) {
		const action = target.dataset.action
		const userId = (target.closest('.user-item') as HTMLElement).dataset.userId
		console.log(`Action "${action}" sur l'utilisateur ${userId}`)
		if (action === 'mp') openMPWindow(userId)
		if (action === 'duel') handleDuel(userId)
		// ici tu peux appeler tes fonctions backend / websocket
		// handleUserAction(userId!, action!);
	}
})

function handleDuel(userId: string | undefined) {
	user?.websocket?.send(json_stringify({ type: 'duel', to: userId, action: 'propose' }))
}

function displayMP(msg: any, messagesMPDiv: any) {
	const isSelf = msg?.to
	const from = msg?.from
	const div = document.createElement('div')
	div.className = `message chat ${isSelf ? 'self' : 'other'}`
	div.innerHTML = `
		<span class="from">${isSelf ? 'Me' : from}:</span>
		<span class="text">${msg.text}</span>
	`
	messagesMPDiv.appendChild(div)
	messagesMPDiv.scrollTop = messagesMPDiv.scrollHeight
}

function openMPWindow(targetPseudo: string | undefined) {
	// fermer user list
	userListDiv.style.display = 'none'
	if (!targetPseudo) return
	// vérifier si une fenêtre existe déjà
	if (document.querySelector('.mp-window')) {
		document.querySelector('.mp-window')!.remove()
	}

	// création du conteneur
	const mpWindow = document.createElement('div')
	mpWindow.className = 'mp-window'

	// header avec bouton fermeture
	const header = document.createElement('div')
	header.className = 'mp-header'
	header.innerHTML = `<span>MP: ${targetPseudo}</span><span class="mp-close">&times;</span>`

	header.querySelector('.mp-close')!.addEventListener('click', () => {
		mpWindow.remove()
		userListDiv.style.display = 'block' // réafficher la liste
	})

	// zone des messages
	const messagesMPDiv = document.createElement('div')
	messagesMPDiv.className = 'mp-messages'

	// récupérer les derniers messages depuis localStorage
	const key = `mp_${targetPseudo}`
	const stored = localStorage.getItem(key)
	console.log(`getItem(${key})`, stored)
	const messages: any = stored ? json_parse(stored) : []
	messages.forEach((msg: any) => {
		displayMP(msg, messagesMPDiv)
	})

	/**

		const isSelf = message.from === user.pseudo;

		messageDiv.className = `message chat ${isSelf ? "self" : "other"}`;
		messageDiv.innerHTML = `
			<span class="from">${isSelf ? "Me" : message.from}:</span>
			<span class="text">${message.text}</span>
		`;
	 */

	// input + bouton envoi
	const inputContainer = document.createElement('div')
	inputContainer.className = 'mp-input-container'

	const input = document.createElement('input')
	input.className = 'mp-input'
	input.placeholder = 'Type your MP...'

	const sendBtn = document.createElement('button')
	sendBtn.className = 'mp-send-btn'
	sendBtn.textContent = 'Envoyer'

	sendBtn.addEventListener('click', () => {
		sendMPMessage(targetPseudo, input.value)
		input.value = ''
	})

	input.addEventListener('keydown', e => {
		if (e.key === 'Enter') {
			sendBtn.click()
		}
	})

	inputContainer.append(input, sendBtn)

	mpWindow.append(header, messagesMPDiv, inputContainer)
	lobbyDiv.append(mpWindow)
}

// fonction pour envoyer un MP
function sendMPMessage(targetPseudo: string, text: string) {
	if (!text.trim()) return
	console.log(`sending mp to ${targetPseudo} : ${text}`)
	user?.websocket?.send(json_stringify({ type: 'mp', text, to: targetPseudo }))
	return
	/*
    // stocker dans localStorage
    const stored = localStorage.getItem(key);
    const messages = stored ? json_parse(stored) : [];
    messages.push(msg);
    // limiter le nombre de messages à 50
    if (messages.length > 50) messages.splice(0, messages.length - 50);
    localStorage.setItem(key, json_stringify(messages));

    // afficher dans la fenêtre
*/
	// TODO: envoyer le message au backend via WebSocket ici
}

async function refreshLobbyId() {
	try {
		// const res = await fetch(`${origin}/api/lobby`)
		const res = await fetch(`https://${gamehost}/api/lobby`)
		if (!res.ok) throw new Error(`https ${res.status}: ${res.statusText}`)
		lobby = await res.json()
		console.log('lobby: ', json_stringify(lobby))
		lobbyDiv.innerText = `Lobby: ${lobby.nb_active} / ${lobby.size}`
	} catch (e) {
		console.error('Error lobby:', e)
	}
}

async function refreshUser() {
	try {
		const res = await fetch(`https://${gamehost}/api/user?userId=${user.userId}`)
		if (!res.ok) throw new Error(`https ${res.status}: ${res.statusText}`)
		const json = await res.json()
		user.pseudo = json.pseudo
		pseudoDiv.innerText = user.pseudo
	} catch (e) {
		console.error('Error user:', e)
		resetUser()
	}
}

function resetUser() {
	if (user.websocket && user.websocket.readyState !== WebSocket.CLOSED) {
		user.websocket.close()
	}
	user = { userId: '', pseudo: '', websocket: undefined }
	localStorage.removeItem('user')
	cleanHistory()
	pseudoDiv.innerText = ''
	hideInput()
	updateStatus('disconnected')
}

function displayMessage(message: any) {
	const messageDiv = document.createElement('div')
	const { lobby } = message
	if (lobby) lobbyDiv.innerText = `Lobby: ${lobby.nb_active} / ${lobby.size}`
	if (message.type === 'error') {
		return console.error('Error: ', message.text)
	}
	if (message.type === 'system') {
		messageDiv.className = 'message system'
		messageDiv.textContent = message.text
	} else if (message.type === 'chat') {
		// Vérifie si le message vient de l'utilisateur courant
		const isSelf = message.from === user.pseudo

		messageDiv.className = `message chat ${isSelf ? 'self' : 'other'}`
		messageDiv.innerHTML = `
			<span class="from">${isSelf ? 'Me' : message.from}:</span>
			<span class="text">${message.text}</span>
		`
	}

	messagesDiv.appendChild(messageDiv)
	messagesDiv.scrollTop = messagesDiv.scrollHeight
}

// --- 💬 Gestion de l'input dynamique ---
function showInput() {
	messageInput.classList.remove('hidden')
	messageInput.placeholder = 'type your message...'
	if (!handleSendBound) {
		handleSendBound = handleSend.bind(null)
		messageInput.addEventListener('keypress', handleSendBound)
	}
}

function hideInput() {
	messageInput.classList.add('hidden')
	if (handleSendBound) {
		messageInput.removeEventListener('keypress', handleSendBound)
		handleSendBound = undefined
	}
}

function handleSend(key: KeyboardEvent) {
	if (key.key === 'Enter' && user.websocket?.readyState === WebSocket.OPEN) {
		const text = messageInput.value.trim()
		if (text) {
			user.websocket.send(json_stringify({ type: 'chat', text }))
			messageInput.placeholder = 'type your message...'
			messageInput.value = ''
		}
	}
}

// --- 🔌 WebSocket ---
function refreshWebSocket() : boolean
{
	loadChatHistory(displayMessage)
	if (user?.websocket?.readyState === WebSocket.OPEN) return true

	if (user?.websocket && user.websocket?.readyState !== WebSocket.CLOSED) user.websocket.close()

	if (!user?.userId) {console.warn('Lobby ou user non défini, impossible d’ouvrir WebSocket.'); return false}

	console.log('WEBSOCKET: ', `wss://${gamehost}/api/ws?userId=${user.userId}`)
	const ws = new WebSocket(`wss://${gamehost}/api/ws?userId=${user.userId}`)
	if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) return false
	user.websocket = ws

	ws.addEventListener('open', () => {
		console.log('✅ WebSocket ouverte')
		updateStatus('connected')
		showInput()
	})

	ws.addEventListener('close', () => {
		console.log('❌ WebSocket fermée')
		updateStatus('disconnected')
		hideInput()
	})

	ws.addEventListener('message', e => {
		const message: FrontType = json_parse(e.data) as FrontType
		console.log(message)
		if (!message) return
		switch (message.type) {
			case 'error':
				return console.error('received:', message.text)
			case 'system':
				return console.warn('received:', message.text)

			case 'duel': {
				switch (message.action) {
					case 'accept':
						return launchGame(ws, user.pseudo)
					case 'decline':
						return console.log(`duel has been declined from ${message.from}`)
					case 'propose': {
						if (confirm(`${message?.from} send you a duel, do you accept?`)) {
							launchGame(ws, user.pseudo)
							return ws.send(json_stringify({ type: 'duel', to: message?.from, action: 'accept' }))
						} else return ws.send(json_stringify({ type: 'duel', to: message?.from, action: 'decline' }))
					}
				}
			}
		}
	})
	return true
}

function updateStatus(state: 'logged' | 'connected' | 'disconnected') {
	statusDiv.className = `ws-status ${state}`
	statusDiv.textContent = state === 'connected' ? '🟢 Connected' : '🔴 Disconnected'
}

// --- 🧠 Initialisation ---
export default async function chat(element: HTMLDivElement)
{
	if (refreshWebSocket()) return
	console.log('Init?')
	element.classList.add('chat-container')
	element.append(lobbyDiv, pseudoDiv, statusDiv, userListDiv, messagesDiv, messageInput)
	const storedUser = localStorage.getItem('user')
	if (storedUser) {
		user = { ...user, ...json_parse(storedUser) }
		await refreshUser()
	}
	await refreshLobbyId()

	if (!user?.userId) {
		const inputPseudo = document.createElement('input')
		const buttonPseudo = document.createElement('button')
		const errorPseudo = document.createElement('div')
		inputPseudo.placeholder = 'Type your pseudo...'
		buttonPseudo.innerText = 'Connect'
		inputPseudo.className = 'pseudo-input'
		buttonPseudo.className = 'pseudo-button'
		element.append(inputPseudo, errorPseudo, buttonPseudo)

		buttonPseudo.addEventListener('click', async () => {
			let status
			try {
				// const res = await fetch(`${origin}/api/lobby`, {
				const res = await fetch(`https://${gamehost}/api/lobby`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: json_stringify({ pseudo: inputPseudo.value })
				})
				status = res.ok
				const json = await res.json()
				if (!status) throw new Error(json?.error)

				user.userId = json.userId
				user.pseudo = json.pseudo
				pseudoDiv.innerText = user.pseudo
				localStorage.setItem('user', json_stringify({ userId: user.userId, pseudo: user.pseudo }))

				inputPseudo.remove()
				buttonPseudo.remove()
				errorPseudo.remove()

				refreshWebSocket()
				console.log('👤 User connected', user)
			} catch (e: any) {
				pseudoDiv.innerText = ''
				inputPseudo.placeholder = 'Type your pseudo...'
				console.error('Error user connexion :', e)
				errorPseudo.textContent = e
			}
		})
	} else {
		refreshWebSocket()
	}
}

chat(chatDiv)

// const cleanPage = () => {
// 	$page.removeEventListener('cleanup', cleanPage)
// 	console.log('Cleaning')
// 	cleanBabylon()
// }

// $page.addEventListener('cleanup', cleanPage)
