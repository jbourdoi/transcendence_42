import { navigate } from '../js/routing'
import { UserStore } from '../stores/user.store'
import { NotificationStore } from '../stores/notification.store'

export function fetchLogin(formData: FormData) {
	fetch('/login', {
		method: 'POST',
		body: formData
	})
		.then(res => {
			if (res.status >= 400) return { status: res.status }

			return res.json()
		})
		.then(res => {
			if (res?.status >= 400) {
				NotificationStore.notify('User not found', 'ERROR')
				return
			}
			UserStore.emit(res)
			navigate('')
		})
}

export function fetchRegister(formData: FormData, registerForm: HTMLElement) {
	fetch('/register', {
		method: 'POST',
		body: formData
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
		.then(res => {
			if (res?.status >= 400) {
				alert('Email already taken')
				return
			}
			console.log('FRONTEND --- registering form response: ', res)
			UserStore.emit(res)
			navigate('')
		})
}
