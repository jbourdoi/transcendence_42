import { navigate } from '../js/routing'
import { StateStore } from '../stores/state.store'
import { UserStore } from '../stores/user.store'
import { ChatStore } from '../stores/chat.store'
import { json_parse } from '../functions/json_wrapper'

const $page: HTMLElement = document.querySelector('page[type=friends]')!
const $tableData: HTMLElement = document.querySelector('friends table tbody')!
let friendsList: FriendType[] = []

type FriendType = {
	username_1: string
	username_2: string
}

GameStore.send({type:"navigate", navigate:"friends"})

let username

UserStore.subscribe(user => {
	username = user.username
	if (username && username != '') {
		fetch(`https://${location.host}/friends`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: username })
		})
			.then(res => {
				if (res.status >= 400) return
				return res.json()
			})
			.then(res => {
				if (res) {
					setFriends(res, null)
				}
			})
	}
})

function setFriends(friends: FriendType[], onlineList: string[] | null) {
	$tableData.innerHTML = ''
	friendsList = friends
	friends
		.map(value => {
			if (value.username_1 != username) return value.username_1
			else return value.username_2
		})
		.forEach(friend => {
			const $trEl = document.createElement('tr')
			const $tdName = document.createElement('td')
			const $tdProfile = document.createElement('td')
			const $tdStatus = document.createElement('td')

			$tdName.innerText = friend
			$tdProfile.innerHTML = 'View'

			if (onlineList?.findIndex(item => item === friend) == -1) {
				$tdStatus.innerText = 'Offline'
			} else {
				$tdStatus.innerText = 'Online'
			}

			$tdProfile.addEventListener('click', () => {
				StateStore.update({ selectedProfile: friend })
				navigate('profile')
			})

			$trEl.append($tdName)
			$trEl.append($tdProfile)
			$trEl.append($tdStatus)
			$tableData.append($trEl)
		})
}

const unsubChatStore = ChatStore.subscribe(chat => {
	const onlineUsers: any = []
	chat.forEach(newChat => {
		if (newChat.type === 'users') {
			const users: string[] | undefined = json_parse(newChat?.msg) as string[] | undefined
			if (users) {
				users.forEach(user => {
					if (onlineUsers.findIndex(item => item === user) == -1) {
						onlineUsers.push(user)
					}
				})
			}
		}
	})
	setFriends(friendsList, onlineUsers)
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubChatStore()
}

$page.addEventListener('cleanup', cleanPage)
