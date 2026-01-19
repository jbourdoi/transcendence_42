import { ChatStore } from '../stores/chat.store'
import { UserStore } from '../stores/user.store'
import { MessageType } from '../../types/chat.type'

const $page: HTMLElement = document.querySelector('page[type=chat]')!
const $chatInput: HTMLInputElement = document.getElementById('chatInput') as HTMLInputElement
const $chatWindow = document.querySelector('chat-window') as HTMLElement
const $chatUsers = document.querySelector('chat-users') as HTMLElement

function sendMessage() {
	const chatValue = $chatInput?.value
	let errorMsg = ''
	if (chatValue === '') return

	const message: MessageType = {
		user: UserStore.getUserName(),
		msg: chatValue,
		type: 'global',
		timestamp: Date.now(),
		to: undefined
	}

	let splitMsg = chatValue.split(' ')

	if (splitMsg[0] === '/mp') {
		if (splitMsg[2]) {
			message.to = splitMsg[1]
			message.msg = splitMsg[2]
			message.type = 'mp'
		} else {
			errorMsg = 'Missing message to send'
		}
	}

	if (errorMsg) {
	} else {
		ChatStore.send(message)
		$chatInput.value = ''
	}
}

document.querySelector('chat-input button')?.addEventListener('click', sendMessage)

$chatInput.addEventListener('keydown', evt => {
	if (evt.code === 'Enter') sendMessage()
})

function mpUser(username: string) {
	$chatInput.value = `/mp ${username} ${$chatInput.value}`
	$chatInput.focus()
}

function addUserAsFriend(username: string) {
	const message: MessageType = {
		user: UserStore.getUserName(),
		msg: username,
		type: 'req-friend',
		timestamp: Date.now()
	}
	ChatStore.send(message)
}

function blockUser(username: string) {
	const message: MessageType = {
		user: UserStore.getUserName(),
		msg: username,
		type: 'block-user',
		timestamp: Date.now()
	}
	ChatStore.send(message)
}

function updateUserList(users: string[]) {
	$chatUsers.querySelectorAll('user-line').forEach(el => {
		el.remove()
	})
	users.forEach(user => {
		const $userLine = document.createElement('user-line')
		const $userName = document.createElement('user-name')

		$userLine.appendChild($userName)
		$userName.innerText = user
		if (user !== UserStore.getUserName()) {
			const $userDuel = document.createElement('user-duel')
			const $userDuelImg = document.createElement('img')
			const $userMp = document.createElement('user-mp')
			const $userMpImg = document.createElement('img')
			const $userBlock = document.createElement('user-block')
			const $userBlockImg = document.createElement('img')
			const $userAddFriend = document.createElement('user-add-friend')
			const $userAddFriendImg = document.createElement('img')

			$userDuel.classList.add('user-icon')
			$userDuelImg.setAttribute('src', '/images/duel.svg')
			$userDuelImg.setAttribute('alt', '')
			$userDuel.appendChild($userDuelImg)

			$userMp.classList.add('user-icon')
			$userMpImg.setAttribute('src', '/images/mp.svg')
			$userMpImg.setAttribute('alt', '')
			$userMp.appendChild($userMpImg)

			$userBlock.classList.add('user-icon')
			$userBlockImg.setAttribute('src', '/images/block.svg')
			$userBlockImg.setAttribute('alt', '')
			$userBlock.appendChild($userBlockImg)

			$userAddFriend.classList.add('user-icon')
			$userAddFriendImg.setAttribute('src', '/images/add_friend.svg')
			$userAddFriendImg.setAttribute('alt', '')
			$userAddFriend.appendChild($userAddFriendImg)

			$userLine.appendChild($userDuel)
			$userLine.appendChild($userMp)
			$userLine.appendChild($userBlock)
			$userLine.appendChild($userAddFriend)

			$userMp.addEventListener('click', _ => {
				mpUser(user)
			})

			$userAddFriend.addEventListener('click', _ => {
				addUserAsFriend(user)
			})

			$userBlock.addEventListener('click', _ => {
				blockUser(user)
			})
		}
		$chatUsers.appendChild($userLine)
	})
}

function updateChat(newChat: MessageType[]) {
	$chatWindow.innerText = ''
	newChat.forEach(chat => {
		if (chat.type === 'users') {
			updateUserList(JSON.parse(chat.msg))
			return
		}

		let $line = document.createElement('chat-line')
		let $time = document.createElement('chat-time')
		let $user = document.createElement('chat-user')
		let $message = document.createElement('chat-message')

		if (chat.to === undefined) {
			$line.classList.add('g')
			$user.innerText = `${chat.user}`
		} else {
			$line.classList.add('mp')
			if (chat.user === UserStore.getUserName()) {
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

		if (chat.type !== 'info' && chat.type !== 'error') {
			$line.appendChild($time)
			$line.appendChild($user)
		}
		$line.appendChild($message)
		$chatWindow?.appendChild($line)
		$chatWindow.scrollTop = $chatWindow.scrollHeight
	})
}

const unsubChatStore = ChatStore.subscribe(chat => {
	updateChat(chat)
})

updateChat(ChatStore.getChats())

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubChatStore()
}

$page.addEventListener('cleanup', cleanPage)
