import { createLoginFormData } from "./formValidation"
import { navigate } from '../js/routing'

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
            console.log('Logging in response: ', res)
				navigate('')
        })
}

export function fetchRegister(formData: FormData, registerForm: HTMLElement) {
    fetch('https://localhost:443/register', {
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
            console.log('Registering response: ', res)
            const logData = createLoginFormData(registerForm)
            fetchLogin(logData)
        })
}