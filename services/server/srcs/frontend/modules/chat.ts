import { v4 as uuidv4 } from 'uuid'
import { ChatStore } from '../stores/chat.store'
import { StateStore } from '../stores/state.store'
import { UserStore } from '../stores/user.store'

const $page: HTMLElement = document.querySelector('page[type=chat]')!

let chats = [
	{
		time: '09:50',
		user: 'Bob',
		message: 'Hello Alice!',
		to: 'Alice',
		id: uuidv4()
	},
	{
		time: '09:52',
		user: 'Alice',
		message: 'General message',
		to: undefined,
		id: uuidv4()
	},
	{
		time: '09:53',
		user: 'Bob',
		message: 'General message',
		to: undefined,
		id: uuidv4()
	},
	{
		time: '09:54',
		user: 'Alice',
		message: 'Hi Bob!',
		to: 'Bob',
		id: uuidv4()
	},
	{
		time: '09:55',
		user: 'Pedro',
		message: 'General message',
		to: undefined,
		id: uuidv4()
	},
	{
		time: '09:56',
		user: 'Maria',
		message: 'General message',
		to: undefined,
		id: uuidv4()
	},
	{
		time: '09:57',
		user: 'Alice',
		message: 'General message',
		to: undefined,
		id: uuidv4()
	}
]

const $chatWindow = document.querySelector('chat-window') as HTMLElement
const $chatInput = document.querySelector('chat-input input')
const user = 'Bob'

const unsubChatStore = ChatStore.subscribe(message => {
	// console.log(message)
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

		// if (chat.to === undefined) {
		// 	$line.classList.add('g')
		// 	$user.innerText = `${chat.user}`
		// } else {
		// 	$line.classList.add('mp')
		// 	if (chat.user === user) {
		// 		$user.innerText = `To ${chat.to}`
		// 	} else {
		// 		$user.innerText = `From ${chat.user}`
		// 	}
		// }

		// $time.innerText = chat.time
		$message.innerText = chat.msg

		// $line.appendChild($time)
		$line.appendChild($user)
		$line.appendChild($message)

		$chatWindow?.appendChild($line)
		$chatWindow.scrollTop = $chatWindow.scrollHeight
	})
}

document.querySelector('chat-input button')?.addEventListener('click', evt => {
	const chatValue = $chatInput?.value

	// const foo = {
	// 	time: '20:00',
	// 	user: 'Alice',
	// 	message: chatValue,
	// 	to: undefined,
	// 	id: uuidv4()
	// }

	// chats.push(foo)
	ChatStore.send({
		msg: chatValue,
		type: 'global'
	})
})

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
