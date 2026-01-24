import { UserStore } from "../stores/user.store"

type twoFAPurpose = 'login' | 'enable' | 'disable'

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

async function send2FACode(purpose: twoFAPurpose, userData: any): Promise<boolean> {

    const res = await fetch('https://localhost:443/2fa/send_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ purpose, userData })
    })
    if (res.status >= 400) {
        console.log('Failed to send 2FA code. Retry later.', res.status, res.statusText)
        return false
    }
    console.log('2FA code sent successfully')
    return true
}

async function check2FACodeWithServer(code: string, purpose: twoFAPurpose, userData: any): Promise<boolean> {
    const res = await fetch('https://localhost:443/2fa/validate_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, purpose, userData })
    })
    if (res.status >= 400) {
        console.log('2FA code validation failed. Retry later.', res.status, res.statusText)
        return false
    }
    console.log('2FA code validated successfully with server')
    return true
}

function validate2FACode(
    page: HTMLElement,
    toggle2FABtn: HTMLButtonElement | null,
    modal: HTMLDivElement,
    overlay: HTMLDivElement,
    codeInput: HTMLInputElement,
    modalError: HTMLDivElement,
    purpose: twoFAPurpose,
    onSuccess: () => void,
    userData?: any
) {
    const validate2FABtn = page.querySelector('#twofa-validate-btn') as HTMLButtonElement

    validate2FABtn.onclick = async () => {
        const code = codeInput.value.trim()
        if (!/^\d{6}$/.test(code)) {
            console.log('Invalid 2FA code format')
            displayModalError(modalError, 'Invalid code format. Please enter a 6-digit code.')
            return
        }
        const isValid = await check2FACodeWithServer(code, purpose, userData)
        if (!isValid) {
            console.log('Incorrect 2FA code')
            displayModalError(modalError, 'Incorrect code. Please try again.')
            return
        }
        if ( toggle2FABtn && (purpose === 'enable' || purpose === 'disable')) {
            UserStore.setUser2FAStatus(!UserStore.getUser2FAStatus())
            render2FAState(toggle2FABtn, UserStore.getUser2FAStatus())
        }
        close2FAModal(modal, overlay)
        onSuccess()
    }
}

function displayModalError(modalError: HTMLDivElement, message: string) {
	modalError.textContent = message
	modalError.classList.remove('hidden')
}

export function render2FAState($toggle2FABtn: HTMLButtonElement, enabled: boolean) {
	console.log('2FA Value: ', enabled)
	console.log('check button before rendering:', $toggle2FABtn)
	$toggle2FABtn.innerText = enabled ? '2FA Enabled' : '2FA Disabled'
}

export async function start2FAFlow(page: HTMLElement, purpose: twoFAPurpose, onSuccess: () => void, userData?: any) {
    const $toggle2FABtn = page.querySelector('#toggle-2fa-btn') as HTMLButtonElement
	const $modal = page.querySelector('#twofa-modal') as HTMLDivElement
	const $overlay = page.querySelector('#twofa-modal-overlay') as HTMLDivElement
	const $closeModalBtn = page.querySelector('#twofa-modal-close') as HTMLButtonElement
	const $codeInput = page.querySelector('#twofa-code-input') as HTMLInputElement
	const $modalError = page.querySelector('#twofa-error') as HTMLDivElement
    const $resend2FABtn = page.querySelector('#twofa-resend-btn') as HTMLButtonElement

    open2FAModal($modal, $overlay, $codeInput, $modalError)
    const success = await send2FACode(purpose, userData)
    if (!success) {
        displayModalError($modalError, 'Error sending 2FA code. Try again later.')
        setTimeout(() => {
            close2FAModal($modal, $overlay)
        }, 2000)
        return
    }
    validate2FACode(page, $toggle2FABtn, $modal, $overlay, $codeInput, $modalError, purpose, onSuccess, userData)

	$resend2FABtn.onclick = async () => {
		console.log('Resend 2FA code button clicked')
		const resendSuccess = await send2FACode(purpose, userData)
		if (!resendSuccess) {
			displayModalError($modalError, 'Error resending 2FA code. Please try again.')
			return
		}
		console.log('2FA code resent successfully')
	}

	$closeModalBtn.onclick = () => close2FAModal($modal, $overlay)
	$overlay.onclick = () => close2FAModal($modal, $overlay)
}