import { ChatStore } from '../stores/chat.store'
import { UserStore } from '../stores/user.store'
import { MessageType } from '../../types/chat.type'
import { GameStore } from '../stores/game.store.ts'
import { NotificationStore } from '../stores/notification.store.ts'
import { LobbyStore } from '../stores/lobby.store.ts'

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
			message.msg = splitMsg.slice(2).join(' ')
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

function duelUser(username: string) { GameStore.send({ type: 'duel', to: username, action: 'propose' })
}

function isBlocked(blocker: string, blocked: string): Promise<boolean> {
	return new Promise(async (resolve, reject) => {
		try {
			const blockedUser = await fetch('/get_blocked_user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ blocker, blocked })
			})
			if (!blockedUser.ok) return false
			const body = await blockedUser.json()
			// console.log('body.isBlocked: ', body.isBlocked)
			resolve(body.isBlocked)
		} catch (error) {
			reject()
		}
	})
}

function isFriend(user1: string, user2: string): Promise<boolean> {
	return new Promise(async (resolve, reject) => {
		try {
			const friendUser = await fetch('/get_friend_user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user1, user2 })
			})
			if (!friendUser.ok) return false
			const body = await friendUser.json()
			// console.log('body.isFriend: ', body.isFriend)
			// return body.isFriend
			resolve(body.isFriend)
		} catch (error) {
			reject()
		}
	})
}

async function updateUserList(users: string[]) {

	let usersEl = []
	
	for (const user of users) {
		const username = UserStore.getUserName()
		const $userLine = document.createElement('user-line')	
		const $userName = document.createElement('user-name')
		
		$userLine.appendChild($userName)
		$userName.innerText = user
		if (user !== username) {
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
			$userDuel.addEventListener('click', _ => {
				duelUser(user)
			})
		}
		usersEl.push($userLine)
	}
	
	$chatUsers.querySelectorAll('user-line').forEach(el => {
		el.remove()
	})

	for (let el of usersEl)
		$chatUsers.appendChild(el)
	updateButtons()
}

async function 	updateButtons()
{
	const $elements = document.querySelectorAll('user-line')
	const currentUsername = UserStore.getUserName()

	for (const userEl of $elements)
	{
		const username = userEl.querySelector('user-name')!.innerHTML
		const $userBlockImg = userEl.querySelector('user-block img')!
		const $userAddFriendImg = userEl.querySelector('user-add-friend img')!

		if (username !== currentUsername)
		{
			if (await isBlocked(currentUsername, username)) $userBlockImg.setAttribute('src', '/images/unblock.svg')
				else $userBlockImg.setAttribute('src', '/images/block.svg')
			if (await isFriend(currentUsername, username)) $userAddFriendImg.setAttribute('src', '/images/remove_friend.svg')
				else $userAddFriendImg.setAttribute('src', '/images/add_friend.svg')
		}
	}

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
