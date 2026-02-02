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
const $toggle2FABtn = $page?.querySelector('#toggle-2fa-btn') as HTMLButtonElement | null
const $avatarPreview = $page?.querySelector('#avatarPreview') as HTMLImageElement | null
const $avatarValidateBtn = $page.querySelector('#avatarValidateBtn') as HTMLButtonElement | null

let timeoutAvatarUpdate: NodeJS.Timeout


function onSuccess() {
	$toggle2FABtn?.removeAttribute('disabled')
	NotificationStore.notify(`2FA ${UserStore.getUser2FAStatus() ? 'enabled' : 'disabled'}`, 'SUCCESS')
}

function onExit() {
	$toggle2FABtn?.removeAttribute('disabled')
}

function handleAvatarReset($resetAvatarBtn: HTMLElement, $avatarPreview: HTMLImageElement) {
	$resetAvatarBtn.addEventListener('click', () => {
		clearTimeout(timeoutAvatarUpdate)

		timeoutAvatarUpdate = setTimeout(() => {

			$avatarPreview.src = '/images/avatars/baseAvatar.jpg'
			fieldValid($avatarPreview.parentElement as HTMLElement)

			if ($page.getAttribute('type') === 'update_profile' && $avatarValidateBtn) {
				$avatarValidateBtn.classList.add('hidden')
				fetch(`https://${location.host}/update_avatar`, {
					method: 'DELETE'
				}).then(res => {
					if (res.status >= 400)
						return { message: res.statusText, error: true }
					return res.json()
				})
					.then(res => {
						if (res?.error == true) {
							NotificationStore.notify(res.message, 'ERROR')
							return
						}
						NotificationStore.notify('Avatar reseted.', 'SUCCESS')
						UserStore.emit(res)
					})
			}
		}, 200);

	})
}

function handleUpdateProfile() {
	if (!$page) return;
	const $avatarInput = $page.querySelector('input[name="avatar"]') as HTMLInputElement | null
	const $resetAvatarBtn = $page.querySelector('#resetAvatarButton') as HTMLButtonElement | null
	const $usernameValidateBtn = $page.querySelector('#usernameValidateBtn') as HTMLButtonElement | null

	if (!$avatarInput || !$resetAvatarBtn || !$usernameValidateBtn || !$avatarPreview || !$toggle2FABtn) return;

	handleAvatarReset($resetAvatarBtn, $avatarPreview)

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
	if (!usernameValidateBtn) return;
	usernameValidateBtn.onclick = e => {
		if (!$usernameInput) return;
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
					// console.log('Error updating username: ', res)
					return {
						error: true
					}
				}
				return res.json()
			})
			.then(res => {
				// console.log('Update username response: ', res)
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
	if (!$page) return;
	const $avatarLabel = $page.querySelector('.avatar-label') as HTMLLabelElement | null
	const $avatarInput = $page.querySelector('input[name="avatar"]') as HTMLInputElement | null

	if (!$avatarLabel || !$avatarValidateBtn || !$avatarInput) return;
	$avatarValidateBtn.onclick = e => {
		e.preventDefault()
		clearTimeout(timeoutAvatarUpdate)
		timeoutAvatarUpdate = setTimeout(() => {
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
					if (res.status >= 400)
						return { message: res.statusText, error: true }
					return res.json()
				})
				.then(res => {
					if (res?.error == true) {
						NotificationStore.notify(res.message, 'ERROR')
						return
					}
					NotificationStore.notify('Avatar updated.', 'SUCCESS')
					UserStore.emit(res)
				})
		}, 200);
	}
}

function setupUsernameFieldValidation(usernameValidateBtn: HTMLButtonElement) {
	$usernameInput?.addEventListener('input', () => {
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
	const $toggle2FABtn = $page?.querySelector('#toggle-2fa-btn') as HTMLButtonElement | null
	if ($toggle2FABtn) render2FAState($toggle2FABtn, value.has_2fa)
	//
	if (value.avatar.startsWith('/images'))
		$avatarPreview?.setAttribute('src', value.avatar + `?t=${Math.random()}`)
	else $avatarPreview?.setAttribute('src', value.avatar)
})

const cleanPage = () => {
	$page?.removeEventListener('cleanup', cleanPage)
	unsubUserStore()
}

$page?.addEventListener('cleanup', cleanPage)
