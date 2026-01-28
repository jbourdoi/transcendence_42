import { navigate } from '../js/routing'
import { CurrentButtonStore } from '../stores/current_button.store'
import { KeyboardStore } from '../stores/keyboard.store'
import { UserStore } from '../stores/user.store'
import { NotificationStore } from '../stores/notification.store'
import { hasInvalidFields, createLoginFormData, setupUsernameAndPwdFieldsValidation } from '../functions/formValidation.js'
import { start42OAuth } from '../functions/start42OAuth.js'
import { fetchLogin } from '../functions/loginRegisterFetch.js'
import { redirectIfAuthenticated } from '../functions/authGuard.js'
import { start2FAFlow } from '../functions/twofa_auth.js'

/* 
	1: Redirect user to OAuth page
	2: User logs in the third party page
	3: OAuth page returns with a private code
	4: The frontend does a POST request with the private code
	5: The backend then does a request to the same OAuth page 
	with the code to get back the user data
	6: The backend saves the user in DB and then returns the POST request
*/

let trackEvent = false

const $spinner = document.querySelector('span[type="spinner"] img') as HTMLImageElement
const $menuButtons = document.querySelector('menu-buttons') as HTMLElement
const $loginForm = document.querySelector('form') as HTMLElement
const urlParams = new URLSearchParams(window.location.search)
const codeParam = urlParams.get('code')

const actions = {
	selectloginType: {
		min: 0,
		max: 1,
		steps: 1,
		callback: selectloginType,
		values: ['42', 'User Form']
	}
}

const $page: HTMLElement = document.querySelector('page[type=login]')!

redirectIfAuthenticated()

let currentButton: HTMLElement

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

start42OAuth(document.querySelector('nav-button'), `https://localhost:8443/login`)

if (codeParam) {
	fetch('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ code: codeParam })
	})
		.then(res => {
			if (res.status === 200) return res.json()
			$spinner.style.display = 'none'
			$menuButtons.style.display = 'flex'
			return res.json()
		})
		.then(res => {
			if (res.info.status >= 400) {
				NotificationStore.notify(res.info.message, 'ERROR')
				return
			}
			if (res.info.message === '2FA_REQUIRED') {
				NotificationStore.notify('Two-Factor Authentication required. Please enter your 2FA code.', 'INFO')
				start2FAFlow(
					$page,
					'login',
					() => {
						NotificationStore.notify('Login successful', 'SUCCESS')
						UserStore.emit(res)
						navigate('')
					},
					res
				)
				return
			}
			UserStore.emit(res)
			navigate('')
		})
} else {
	$spinner.style.display = 'none'
	$menuButtons.style.display = 'flex'
}

function handleUserForm(self: HTMLElement) {
	const $navLeft = document.createElement('nav-left')
	const $navRight = document.createElement('nav-right')
	const $span = document.createElement('span')
	const $submitBtn = document.querySelector('form span[type="submit"]') as HTMLElement

	if (trackEvent === false) {
		trackEvent = true

		$submitBtn.onclick = e => {
			e.preventDefault()
			if (hasInvalidFields($loginForm)) {
				NotificationStore.notify('Form contains invalid fields', 'ERROR')
				return
			}

			const formData = createLoginFormData($loginForm)
			fetchLogin(formData)
		}
	}

	$span.innerText = 'User Form'

	$navLeft.innerText = ' < '
	$navRight.innerText = ' > '

	self.innerHTML = ''

	self.appendChild($navLeft)
	self.appendChild($span)
	self.appendChild($navRight)

	$loginForm.style.display = 'grid'

	setupUsernameAndPwdFieldsValidation($loginForm)
}

function selectloginType(loginType: string, self: HTMLElement) {
	if (loginType === '42') {
		start42OAuth(self, `https://localhost/login`)
	} else {
		handleUserForm(self)
	}
}

const unsubKeyStore = KeyboardStore.subscribe(key => {
	if (['ArrowLeft', 'ArrowRight'].includes(key.value)) {
		const data = currentButton?.dataset
		if (data && data?.stateValue) {
			console.log('data', data)
			const action = actions[data.action]
			const current = Number(data.stateValue)
			console.log('action', action)
			const min = action.min
			const max = action.max
			const steps = action.steps
			let newValue: number

			if (key.value === 'ArrowLeft') {
				newValue = current - steps
				if (newValue < min) newValue = max
			} else {
				newValue = current + steps
				if (newValue > max) newValue = min
			}

			data.stateValue = String(newValue)

			const index = (newValue - min) / steps

			const nextValue = action.values[index]

			action.callback(nextValue, currentButton)
		}
	}
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubCurrentButtonStore()
	unsubKeyStore()
}

$page.addEventListener('cleanup', cleanPage)

/////////// login ///////////
// fetch('/login', {
// 	method: 'POST',
// 	headers: {
// 		'Content-Type': 'application/json'
// 	},
// 	body: JSON.stringify({
// 		name: '2',
// 		pwd: 'password123',
// 		checkpwd: 'password123',
// 		email: '2@example.com',
// 		checkmail: '2@example.com',
// 		username: '2'
// 	})
// })
// 	.then(res => res.json())
// 	.then(data => console.log('login response:', data))
