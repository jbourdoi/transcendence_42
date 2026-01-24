import { navigate } from '../js/routing'
import { StateStore } from '../stores/state.store'
import { UserStore } from '../stores/user.store'

const $page: HTMLElement = document.querySelector('page[type=friends]')!
const $tableData: HTMLElement = document.querySelector('friends table tbody')!

type FriendType = {
	username_1: string
	username_2: string
}

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
				if (res.status >= 400) return console.log('ERROR updating profile', res.status)
				return res.json()
			})
			.then(res => {
				if (res) {
					setFriends(res)
				}
			})
	}
})

function setFriends(friends: FriendType[]) {
	$tableData.innerHTML = ''
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
			$tdStatus.innerText = 'Online'

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

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
}

$page.addEventListener('cleanup', cleanPage)
