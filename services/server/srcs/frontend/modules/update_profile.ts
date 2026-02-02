import {
	fieldInvalid,
	fieldValid,
	resetAvatarButton,
	setupAvatarPreview,
	validateUsernameUpdateFormat
} from '../functions/formValidation'
import { UserStore } from '../stores/user.store'
import { NotificationStore } from '../stores/notification.store'
import { StateStore } from '../stores/state.store'
import { ChatStore } from '../stores/chat.store'
import { render2FAState, start2FAFlow } from '../functions/twofa_auth'
import { GameStore } from '../stores/game.store'

GameStore.send({ type: 'navigate', navigate: 'update_profile' })

const $page: HTMLElement = document.querySelector('page[type=update_profile]')!
const $usernameInput: HTMLInputElement = document.querySelector('input[name="username"]')!
const $toggle2FABtn = $page.querySelector('#toggle-2fa-btn') as HTMLButtonElement
const $avatarPreview = $page.querySelector('#avatarPreview') as HTMLImageElement

function onSuccess() {
	$toggle2FABtn.removeAttribute('disabled')
	NotificationStore.notify(`2FA ${UserStore.getUser2FAStatus() ? 'enabled' : 'disabled'}`, 'SUCCESS')
}

function onExit() {
	$toggle2FABtn.removeAttribute('disabled')
}

function handleUpdateProfile() {
	const $avatarInput = $page.querySelector('input[name="avatar"]') as HTMLInputElement
	const $resetAvatarBtn = $page.querySelector('#resetAvatarButton') as HTMLButtonElement
	const $usernameValidateBtn = $page.querySelector('#usernameValidateBtn') as HTMLButtonElement

	resetAvatarButton($resetAvatarBtn, $avatarInput, $avatarPreview)

	render2FAState($toggle2FABtn, UserStore.getUser2FAStatus())
	$toggle2FABtn.onclick = () => {
		if ($toggle2FABtn.getAttribute('disabled') === 'true') return
		$toggle2FABtn.setAttribute('disabled', 'true')
		start2FAFlow(
			$page,
			UserStore.getUser2FAStatus() ? 'disable' : 'enable',
			() => onSuccess(),
			() => onExit(),
			null
		)
	}

	setupAvatarPreview($avatarInput, $avatarPreview)
	setupUsernameFieldValidation($usernameValidateBtn)

	updateUsername($usernameValidateBtn)
	updateAvatar()
}

function updateUsername(usernameValidateBtn: HTMLButtonElement) {
	usernameValidateBtn.onclick = e => {
		e.preventDefault()
		if ($usernameInput.classList.contains('field-invalid')) {
			NotificationStore.notify('Username is invalid.', 'ERROR')
			return
		}
		const username = $usernameInput.value.trim()
		if (username.length === 0) {
			NotificationStore.notify('Username cannot be empty.', 'ERROR')
			return
		}

		fetch(`https://${location.host}/update_username`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username })
		})
			.then(res => {
				if (res.status >= 400) {
					console.log('Error updating username: ', res)
					return {
						error: true
					}
				}
				return res.json()
			})
			.then(res => {
				console.log('Update username response: ', res)
				if (res?.error == true) {
					NotificationStore.notify('Error updating username', 'ERROR')
					return
				}
				if (res?.message === 'No changes made') {
					NotificationStore.notify('Username is the same. No changes made.', 'INFO')
				} else {
					NotificationStore.notify('Username updated.', 'SUCCESS')
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

function updateAvatar() {
	const $avatarLabel = $page.querySelector('.avatar-label') as HTMLLabelElement
	const $avatarValidateBtn = $page.querySelector('#avatarValidateBtn') as HTMLButtonElement
	const $avatarInput = $page.querySelector('input[name="avatar"]') as HTMLInputElement

	$avatarValidateBtn.onclick = e => {
		e.preventDefault()
		if ($avatarLabel.classList.contains('field-invalid')) {
			NotificationStore.notify('Avatar is invalid.', 'ERROR')
			return
		}
		if (!$avatarInput.files || $avatarInput.files.length === 0) {
			NotificationStore.notify('No avatar selected.', 'ERROR')
			return
		}
		const avatarFile = $avatarInput.files[0]
		const formData = new FormData()
		formData.append('avatar', avatarFile)

		fetch(`https://${location.host}/update_avatar`, {
			method: 'PUT',
			body: formData
		})
			.then(res => {
				if (res.status >= 400) {
					console.log('Error updating avatar: ', res)
					return {
						error: true
					}
				}
				return res.json()
			})
			.then(res => {
				console.log('Update avatar response: ', res)
				if (res?.error == true) {
					NotificationStore.notify('Error updating avatar.', 'ERROR')
					return
				}
				NotificationStore.notify('Avatar updated.', 'SUCCESS')
				UserStore.emit(res)
			})
	}
}

function setupUsernameFieldValidation(usernameValidateBtn: HTMLButtonElement) {
	$usernameInput.addEventListener('input', () => {
		const error = validateUsernameUpdateFormat($usernameInput.value)
		usernameValidateBtn.classList.add('hidden')
		if (error) fieldInvalid($usernameInput, error)
		else {
			fieldValid($usernameInput)
			if ($usernameInput.value.trim().length > 0) usernameValidateBtn.classList.remove('hidden')
		}
	})
}

handleUpdateProfile()

const unsubUserStore = UserStore.subscribe(value => {
	// console.log('User Store Value: ', value)
	// console.log(($usernameInput.placeholder = value.username))
	const $toggle2FABtn = $page.querySelector('#toggle-2fa-btn') as HTMLButtonElement
	render2FAState($toggle2FABtn, value.has_2fa)
	$avatarPreview.setAttribute('src', value.avatar + `?t=${Math.random()}`)
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubUserStore()
}

$page.addEventListener('cleanup', cleanPage)
