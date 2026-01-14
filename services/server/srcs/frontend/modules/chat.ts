import { ChatStore } from '../stores/chat.store'
import { UserStore } from '../stores/user.store'
import { MessageType } from '../../types/chat.type'
import { redirectIfNotAuthenticated } from '../functions/authGuard'

const $page: HTMLElement = document.querySelector('page[type=chat]')!
const $chatInput: HTMLInputElement = document.getElementById('chatInput') as HTMLInputElement

redirectIfNotAuthenticated()

function sendMessage() {
	const chatValue = $chatInput?.value
	if (chatValue === '') return

	const message: MessageType = {
		user: UserStore.getUserName(),
		msg: chatValue,
		type: 'global',
		timestamp: Date.now(),
		to: undefined
	}
	ChatStore.send(message)
	$chatInput.value = ''
}

$chatInput.addEventListener('keydown', evt => {
	if (evt.code === 'Enter') sendMessage()
})

document.querySelector('chat-input button')?.addEventListener('click', sendMessage)

let chats: MessageType[] = [
	{
		timestamp: Date.now() - 60000 * 10,
		user: 'Bob',
		msg: 'Hello Alice!',
		to: 'Alice',
		type: 'global'
	},
	{
		timestamp: Date.now() - 60000 * 9,
		user: 'Alice',
		msg: 'General message',
		to: undefined,
		type: 'global'
	},
	{
		timestamp: Date.now() - 60000 * 8,
		user: 'Bob',
		msg: 'General message',
		to: undefined,
		type: 'global'
	},
	{
		timestamp: Date.now() - 60000 * 8,
		user: 'Alice',
		msg: 'Hi Bob!',
		to: 'Bob',
		type: 'global'
	},
	{
		timestamp: Date.now() - 60000 * 6,
		user: 'Pedro',
		msg: 'General message',
		to: undefined,
		type: 'global'
	},
	{
		timestamp: Date.now() - 60000 * 5,
		user: 'Maria',
		msg: 'General message',
		to: undefined,
		type: 'global'
	},
	{
		timestamp: Date.now() - 60000 * 4,
		user: 'Alice',
		msg: 'General message',
		to: undefined,
		type: 'global'
	}
]

const $chatWindow = document.querySelector('chat-window') as HTMLElement
const user = 'Bob'

const unsubChatStore = ChatStore.subscribe(message => {
	console.log('New Upcoming message: ', message)

	if (message.type === 'system') return

	chats.push(message)
	refreshChat()
})

refreshChat()

function refreshChat() {
	$chatWindow.innerText = ''
	chats.forEach(chat => {
		let $line = document.createElement('chat-line')
		let $time = document.createElement('chat-time')
		let $user = document.createElement('chat-user')
		let $message = document.createElement('chat-message')

		if (chat.to === undefined) {
			$line.classList.add('g')
			$user.innerText = `${chat.user}`
		} else {
			$line.classList.add('mp')
			if (chat.user === user) {
				$user.innerText = `To ${chat.to}`
			} else {
				$user.innerText = `From ${chat.user}`
			}
		}

		const time = new Date(chat.timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		})

		$time.innerText = String(time)
		$message.innerText = chat.msg

		$line.appendChild($time)
		$line.appendChild($user)
		$line.appendChild($message)

		$chatWindow?.appendChild($line)
		$chatWindow.scrollTop = $chatWindow.scrollHeight
	})
}

document.querySelectorAll<HTMLElement>('user-line').forEach(($userLine: HTMLElement) => {
	if ($userLine.innerText === user) $userLine.classList.add('current-user')

	$userLine.addEventListener('click', evt => {
		const $target = evt.target as HTMLElement

		console.log($target.innerText)
	})
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubChatStore()
}

$page.addEventListener('cleanup', cleanPage)
