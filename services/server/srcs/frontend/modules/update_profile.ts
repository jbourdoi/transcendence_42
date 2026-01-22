import { resetAvatarButton, setupAvatarPreview } from '../functions/formValidation'
import { UserStore } from '../stores/user.store'
import { NotificationStore } from '../stores/notification.store'
import { StateStore } from '../stores/state.store'

let trackEvent = false

const $page: HTMLElement = document.querySelector('page[type=update_profile]')!
const $usernameInput: HTMLInputElement = document.querySelector('input[name="username"]')!

function open2FAModal(modal: HTMLDivElement, overlay: HTMLDivElement, codeInput: HTMLInputElement, modalError: HTMLDivElement) {
	modal.classList.remove('hidden')
	overlay.classList.remove('hidden')
	codeInput.value = ''
	modalError.classList.add('hidden')
}

function close2FAModal(modal: HTMLDivElement, overlay: HTMLDivElement) {
	modal.classList.add('hidden')
	overlay.classList.add('hidden')
}

async function send2FACode(): Promise<boolean> {
	const code = '123456';
	const res = await fetch('https://localhost:443/2fa/send_code', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ code })
	})
	if (res.status >= 400) {
		console.log('Failed to send 2FA code', res.status)
		return false
	}
	console.log('2FA code sent successfully')
	return true
}

async function check2FACodeWithServer(code: string): Promise<boolean> {
	const res = await fetch('https://localhost:443/2fa/validate_code', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ code })
	})
	if (res.status >= 400) {
		console.log('2FA code validation failed', res.status)
		return false
	}
	console.log('2FA code validated successfully with server')
	return true
}

function validate2FACode(codeInput: HTMLInputElement) {
	const validate2FABtn = $page.querySelector('#twofa-validate-btn') as HTMLButtonElement
	const modalError = $page.querySelector('#twofa-error') as HTMLDivElement
	const $toggle2FABtn = $page.querySelector('#twofa') as HTMLInputElement
	const modal = $page.querySelector('#twofa-modal') as HTMLDivElement
	const overlay = $page.querySelector('#twofa-modal-overlay') as HTMLDivElement

	validate2FABtn.addEventListener('click', async (e) => {
		const code = codeInput.value.trim()
		if (!/^\d{6}$/.test(code)) {
			console.log('Invalid 2FA code format')
			displayModalError(modalError, 'Invalid code format. Please enter a 6-digit code.')
			return
		}
		const isValid = await check2FACodeWithServer(code)
		if (!isValid) {
			console.log('Incorrect 2FA code')
			displayModalError(modalError, 'Incorrect code. Please try again.')
			return
		}

		console.log('2FA code validated successfully')

		$toggle2FABtn.checked = !$toggle2FABtn.checked
		console.log('toggle2FABtn checked IF CODE VALIDATED:', $toggle2FABtn.checked)
		toggle2FAState($toggle2FABtn)
		console.log('toggle2FABtn checked IF CODE VALIDATED x2:', $toggle2FABtn.checked)

		close2FAModal(modal, overlay)
	})
}

function displayModalError(modalError: HTMLDivElement, message: string) {
	modalError.textContent = message
	modalError.classList.remove('hidden')
}

function toggle2FAState(toggle2FABtn: HTMLInputElement) {
	toggle2FABtn.textContent = toggle2FABtn.checked ? '2FA enabled' : '2FA disabled'
	console.log('toggle2FABtn checked AFTER CODE VALIDATED (from x2):', toggle2FABtn.checked)
}

function toggle2FA(
	toggle2FABtn: HTMLInputElement,
	closeModalBtn: HTMLButtonElement,
	modal: HTMLDivElement,
	overlay: HTMLDivElement,
	codeInput: HTMLInputElement,
	modalError: HTMLDivElement
) {
	toggle2FABtn.addEventListener('change', async e => {
		e.preventDefault()
		toggle2FABtn.checked = !toggle2FABtn.checked
		console.log('toggle2FABtn checked AT START:', toggle2FABtn.checked)

		open2FAModal(modal, overlay, codeInput, modalError)
		const success = await send2FACode()
		if (!success) {
			displayModalError(modalError, 'Error sending 2FA code. Please try again.')
			setTimeout(() => {
				close2FAModal(modal, overlay)
			}, 2000)
			// what should happen when failing to send code?
			return
		}
		// on validate, check code server-side, if ok -> enable/disable 2fa for user in db
		validate2FACode(codeInput)
	})
	closeModalBtn.addEventListener('click', () => close2FAModal(modal, overlay))
	overlay.addEventListener('click', () => close2FAModal(modal, overlay))
}

function handleUpdateProfile() {
	const $submitBtn = document.querySelector('span[type="submit"]') as HTMLElement
	const $avatarInput = $page.querySelector('input[name="avatar"]') as HTMLInputElement
	const $avatarPreview = $page.querySelector('#avatarPreview') as HTMLImageElement
	const $resetAvatarBtn = $page.querySelector('#resetAvatarButton') as HTMLButtonElement

	resetAvatarButton($resetAvatarBtn, $avatarInput, $avatarPreview)

	const $toggle2FABtn = $page.querySelector('#twofa') as HTMLInputElement
	const modal = $page.querySelector('#twofa-modal') as HTMLDivElement
	const overlay = $page.querySelector('#twofa-modal-overlay') as HTMLDivElement
	const closeModalBtn = $page.querySelector('#twofa-modal-close') as HTMLButtonElement
	// const validate2FABtn = $page.querySelector('#twofa-validate-btn') as HTMLButtonElement
	const resend2FABtn = $page.querySelector('#twofa-resend-btn') as HTMLButtonElement
	const codeInput = $page.querySelector('#twofa-code-input') as HTMLInputElement
	const modalError = $page.querySelector('#twofa-error') as HTMLDivElement

	toggle2FA($toggle2FABtn, closeModalBtn, modal, overlay, codeInput, modalError)

	// weird bug when code validation to disable 2fa: code validated but checkbox true, sometimes false
	// in 'on change' if 2fa checked/unchecked -> modif user from table to enable/disable 2fa

	if (trackEvent === false) {
		trackEvent = true
		$submitBtn.onclick = e => {
			e.preventDefault()
			const username = $usernameInput.value.trim()
			const avatarFile = $avatarInput.files ? $avatarInput.files[0] : null

			if (username === '' && !avatarFile) {
				alert('Please update at least one field before submitting.')
				return
			}

			const formData = new FormData()
			if (username !== '') formData.append('username', username)
			if (avatarFile) formData.append('avatar', avatarFile)
			fetch('https://localhost:443/update_user', {
				method: 'PUT',
				body: formData
			})
				.then(res => {
					if (res.status >= 400) {
						NotificationStore.notify('ERROR updating profile', 'ERROR')
						return
					}
					return res.json()
				})
				.then(res => {
					if (res?.message === 'No changes made') {
						NotificationStore.notify('No info changed', 'INFO')
					} else {
						NotificationStore.notify('User data updated', 'SUCCESS')
						StateStore.update({ username: res.infoFetch.username })
						UserStore.emit(res.infoFetch)
					}
				})
		}
	}
	setupAvatarPreview($avatarInput, $avatarPreview)
}

handleUpdateProfile()

const unsubUserStore = UserStore.subscribe(value => {
	console.log(value)
	console.log(($usernameInput.placeholder = value.username))
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubUserStore()
}

$page.addEventListener('cleanup', cleanPage)
