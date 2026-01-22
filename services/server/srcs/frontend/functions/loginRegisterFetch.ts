import { navigate } from '../js/routing'
import { UserStore } from '../stores/user.store'

export function fetchLogin(formData: FormData) {
	fetch('https://localhost:443/login', {
		method: 'POST',
		body: formData
	})
		.then(res => {
			if (res.status >= 400) {
				console.log(res)
				return { status: res.status }
			}
			return res.json()
		})
		.then(res => {
			if (res?.status >= 400) return
			console.log('FRONTEND --- login form response: ', res)
			UserStore.emit(res)
			navigate('')
		})
}

export function fetchRegister(formData: FormData, registerForm: HTMLElement) {
	fetch('https://localhost:443/register', {
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
			console.log("FRONTEND --- registering form response: ", res)
			UserStore.emit(res)
			navigate('')
		})
}
