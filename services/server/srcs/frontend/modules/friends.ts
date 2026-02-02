import { navigate } from '../js/routing'
import { StateStore } from '../stores/state.store'
import { UserStore } from '../stores/user.store'
import { GameStore } from '../stores/game.store'
import { LobbyStore } from '../stores/lobby.store'
import { json_stringify } from '../functions/json_wrapper'

GameStore.send({ type: 'navigate', navigate: 'friends' })
const $page: HTMLElement = document.querySelector('page[type=friends]')!
const $tableData: HTMLElement = document.querySelector('friends table tbody')!
let friendsList: FriendType[] = []

type FriendType = {
	username_1: string
	username_2: string
}

let username : string | undefined
let onlineList : string[] = []

const unsubsribeUserStore = UserStore.subscribe(user => {
	username = user.username
	if (username && username != '') {
		fetch(`https://${location.host}/friends`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: json_stringify({ name: username })
		})
			.then(res => {
				if (res.status >= 400) return
				return res.json()
			})
			.then(res => {
				if (res) {
					setFriends(res, onlineList)
				}
			})
	}
})

function setFriends(friends: FriendType[], onlineList: string[] | null)
{
	if (!$tableData) return;
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
			const $profileViewButton = document.createElement('button')
			$tdName.innerText = friend

			// $tdProfile.innerHTML = 'View'
			$profileViewButton.innerText = 'View'

			if (onlineList?.findIndex(item => item === friend) == -1) {
				$tdStatus.innerText = 'Offline'
			} else {
				$tdStatus.innerText = 'Online'
			}

			$profileViewButton.addEventListener('click', async () => {
				StateStore.update({ selectedProfile: friend })
				await navigate('profile')
			})
			
			$tdProfile.appendChild($profileViewButton)

			$trEl.append($tdName)
			$trEl.append($tdProfile)
			$trEl.append($tdStatus)
			$tableData.append($trEl)
		})
}

const unsubscribeLobbyStore = LobbyStore.subscribe(({users})=>{
	onlineList = users
	setFriends(friendsList, users)

})

const cleanPage = () => {
	$page?.removeEventListener('cleanup', cleanPage)
	unsubscribeLobbyStore()
	unsubsribeUserStore()
}

$page?.addEventListener('cleanup', cleanPage)
