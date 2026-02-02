import { NotificationStore } from '../stores/notification.store'
import { UserStore } from '../stores/user.store'

type twoFAPurpose = 'login' | 'enable' | 'disable'

function open2FAModal(modal: HTMLDivElement, overlay: HTMLDivElement, codeInput: HTMLInputElement) {
	modal.classList.remove('hidden')
	overlay.classList.remove('hidden')
	codeInput.value = ''
}

function close2FAModal(modal: HTMLDivElement, overlay: HTMLDivElement) {
	modal.classList.add('hidden')
	overlay.classList.add('hidden')
}

async function send2FACode(purpose: twoFAPurpose, userData: any): Promise<boolean> {
	const res = await fetch('/2fa/send_code', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ purpose, userData })
	})
	if (res.status >= 400) {
		NotificationStore.notify('Failed to send 2FA code. Retry later.', 'ERROR')
		return false
	}
	NotificationStore.notify('A 2FA code has been sent to your email!', 'INFO')
	return true
}

async function check2FACodeWithServer(code: string, purpose: twoFAPurpose, userData: any): Promise<boolean> {
	const res = await fetch('/2fa/validate_code', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ code, purpose, userData })
	})
	if (res.status >= 400) {
		NotificationStore.notify('2FA code validation failed. Retry later.', 'ERROR')
		return false
	}
	NotificationStore.notify('2FA code validated successfully!', 'SUCCESS')
	return true
}

function validate2FACode(
	page: HTMLElement,
	toggle2FABtn: HTMLButtonElement | null,
	modal: HTMLDivElement,
	overlay: HTMLDivElement,
	codeInput: HTMLInputElement,
	purpose: twoFAPurpose,
	onSuccess: () => void,
	userData?: any
) {
	const validate2FABtn = page.querySelector('#twofa-validate-btn') as HTMLButtonElement

	validate2FABtn.onclick = async () => {
		const code = codeInput.value.trim()
		if (!/^\d{6}$/.test(code)) {
			NotificationStore.notify('Invalid 2FA code format. Please enter a 6-digit code.', 'ERROR')
			return
		}
		const isValid = await check2FACodeWithServer(code, purpose, userData)
		if (!isValid) return
		if (toggle2FABtn && (purpose === 'enable' || purpose === 'disable')) {
			UserStore.setUser2FAStatus(!UserStore.getUser2FAStatus())
			render2FAState(toggle2FABtn, UserStore.getUser2FAStatus())
		}
		close2FAModal(modal, overlay)
		onSuccess()
	}
}

export function render2FAState(toggle2FABtn: HTMLButtonElement, enabled: boolean | undefined) {
	toggle2FABtn.innerText = enabled ? 'Disable' : 'Enable'
}

export async function start2FAFlow(
	page: HTMLElement,
	purpose: twoFAPurpose,
	onSuccess: () => void,
	onExit: () => void,
	userData?: any
) {
	const $toggle2FABtn = page.querySelector('#toggle-2fa-btn') as HTMLButtonElement
	const $modal = page.querySelector('#twofa-modal') as HTMLDivElement
	const $overlay = page.querySelector('#twofa-modal-overlay') as HTMLDivElement
	const $closeModalBtn = page.querySelector('#twofa-modal-close') as HTMLButtonElement
	const $codeInput = page.querySelector('#twofa-code-input') as HTMLInputElement
	const $resend2FABtn = page.querySelector('#twofa-resend-btn') as HTMLButtonElement

	open2FAModal($modal, $overlay, $codeInput)
	$codeInput.focus()
	const success = await send2FACode(purpose, userData)
	if (!success) {
		setTimeout(() => {
			close2FAModal($modal, $overlay)
		}, 2000)
		return
	}
	validate2FACode(page, $toggle2FABtn, $modal, $overlay, $codeInput, purpose, onSuccess, userData)

	$resend2FABtn.onclick = async () => {
		const resendSuccess = await send2FACode(purpose, userData)
		if (!resendSuccess) return
		$codeInput.value = ''
		$codeInput.focus()
	}

	$closeModalBtn.onclick = () => {
		close2FAModal($modal, $overlay)
		onExit()
	}
	$overlay.onclick = () => {
		close2FAModal($modal, $overlay)
		onExit()
	}
}
