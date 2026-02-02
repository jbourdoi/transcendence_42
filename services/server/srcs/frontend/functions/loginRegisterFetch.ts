import { navigate } from '../js/routing'
import { UserStore } from '../stores/user.store'
import { NotificationStore } from '../stores/notification.store'
import { start2FAFlow } from './twofa_auth'
import { UserLoginType, UserRegisterType } from '../../types/user.type'

async function onSuccess(res: any) {
	NotificationStore.notify('Login successful', 'SUCCESS')
	UserStore.emit(res)
	await navigate('')
}

export function fetchLogin(data: UserLoginType) {
	fetch('/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ data })
	})
		.then(res => {
			if (res.status >= 400) return { status: res.status }

			return res.json()
		})
		.then(async res => {
			if (res?.status >= 400) {
				NotificationStore.notify('User not found', 'ERROR')
				return
			}
			if (res.info.message === '2FA_REQUIRED') {
				NotificationStore.notify('Two-Factor Authentication required. Please enter your 2FA code.', 'INFO')
				const $page: HTMLElement = document.querySelector('page[type=login]')!
				start2FAFlow(
					$page,
					'login',
					() => onSuccess(res),
					() => null,
					res
				)
				return
			}
			// console.log('log: ', res)
			UserStore.emit(res)
			await navigate('')
		})
}

export function fetchRegister(data: UserRegisterType) {
	// console.log(data)
	fetch('/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ data })
	})
		.then(async res => {
			const body = await res.json()

			if (!res.ok) {
				return {
					status: res.status,
					message: body.message
				}
			}
			return body
		})
		.then(async res => {
			if (res?.status >= 400) {
				NotificationStore.notify('Form invalid', 'ERROR')
				return
			}
			// console.log('FRONTEND --- registering form response: ', res)
			UserStore.emit(res)
			await navigate('')
		})
}
