import { resetAvatarButton, setupAvatarPreview } from '../functions/formValidation'
import { UserStore } from '../stores/user.store'
import { NotificationStore } from '../stores/notification.store'
import { StateStore } from '../stores/state.store'
import { ChatStore } from '../stores/chat.store'
import { render2FAState, start2FAFlow } from '../functions/twofa_auth'
import { GameStore } from '../stores/game.store'

let trackEvent = false

GameStore.send({type:"navigate", navigate:"update_profile"})

const $page: HTMLElement = document.querySelector('page[type=update_profile]')!
const $usernameInput: HTMLInputElement = document.querySelector('input[name="username"]')!

function onSuccess() {
	NotificationStore.notify(`2FA ${UserStore.getUser2FAStatus() ? 'enabled' : 'disabled'}`, 'SUCCESS')
}

function handleUpdateProfile() {
	const $submitBtn = document.querySelector('span[type="submit"]') as HTMLElement
	const $avatarInput = $page.querySelector('input[name="avatar"]') as HTMLInputElement
	const $avatarPreview = $page.querySelector('#avatarPreview') as HTMLImageElement
	const $resetAvatarBtn = $page.querySelector('#resetAvatarButton') as HTMLButtonElement
	const $toggle2FABtn = $page.querySelector('#toggle-2fa-btn') as HTMLButtonElement

	resetAvatarButton($resetAvatarBtn, $avatarInput, $avatarPreview)

	render2FAState($toggle2FABtn, UserStore.getUser2FAStatus())
	$toggle2FABtn.onclick = () => {
		if ($toggle2FABtn.getAttribute('disabled') === 'true') return
		start2FAFlow(
			$page,
			UserStore.getUser2FAStatus() ? 'disable' : 'enable',
			() => onSuccess(),
			() => null,
			null
		)
	}

	if (trackEvent === false) {
		trackEvent = true
		$submitBtn.onclick = e => {
			e.preventDefault()
			const username = $usernameInput.value.trim()
			const avatarFile = $avatarInput.files ? $avatarInput.files[0] : null

			if (username === '' && !avatarFile) {
				NotificationStore.notify('Please update at least one field before submitting', 'INFO')
				return
			}

			const formData = new FormData()
			if (username !== '') formData.append('username', username)
			if (avatarFile) formData.append('avatar', avatarFile)
			fetch(`https://${location.host}/update_user`, {
				method: 'PUT',
				body: formData
			})
				.then(res => {
					if (res.status >= 400) {
						// console.log('Error: ', res)
						return {
							error: true
						}
					}
					return res.json()
				})
				.then(res => {
					if (res?.error == true) {
						NotificationStore.notify('ERROR updating profile', 'ERROR')
						return
					}
					if (res?.message === 'No changes made') {
						NotificationStore.notify('No info changed', 'INFO')
					} else {
						NotificationStore.notify('User data updated', 'SUCCESS')
						ChatStore.send({
							msg: res.username,
							type: 'update-username',
							timestamp: 0,
							user: UserStore.getUserName()
						})
						StateStore.update({ username: res.username })
						UserStore.emit(res)
					}
				})
		}
	}
	setupAvatarPreview($avatarInput, $avatarPreview)
}

handleUpdateProfile()

const unsubUserStore = UserStore.subscribe(value => {
	// console.log('User Store Value: ', value)
	// console.log(($usernameInput.placeholder = value.username))
	const $toggle2FABtn = $page.querySelector('#toggle-2fa-btn') as HTMLButtonElement
	render2FAState($toggle2FABtn, value.has_2fa)
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubUserStore()
}

$page.addEventListener('cleanup', cleanPage)
