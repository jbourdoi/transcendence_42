import { hasInvalidFields, setupUsernameAndPwdFieldsValidation } from '../functions/formValidation'
import { start42OAuth } from '../functions/start42OAuth'
import { navigate } from '../js/routing'
import { CurrentButtonStore } from '../stores/current_button.store'
import { KeyboardStore } from '../stores/keyboard.store'
import { UserStore } from '../stores/user.store'

/* 
	1: Redirect user to OAuth page
	2: User logs in the third party page
	3: OAuth page returns with a private code
	4: The frontend does a POST request with the private code
	5: The backend then does a request to the same OAuth page 
	with the code to get back the user data
	6: The backend saves the user in DB and then returns the POST request
*/

const $spinner = document.querySelector('span[type="spinner"] img') as HTMLImageElement
const $menuButtons = document.querySelector('menu-buttons') as HTMLElement
const $loginForm = document.querySelector('login-form') as HTMLElement
const urlParams = new URLSearchParams(window.location.search)
const codeParam = urlParams.get('code')
const $oauthContainer = document.querySelector('login-form oauth-container') as HTMLElement

const actions = {
	selectLoginType: {
		min: 0,
		max: 1,
		steps: 1,
		callback: selectLoginType,
		values: ['42', 'User Form']
	}
}

const $page: HTMLElement = document.querySelector('page[type=login]')!

let currentButton: HTMLElement

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

if ($oauthContainer) {
	const $uri = 'https://localhost/login'
	start42OAuth($oauthContainer, $uri)
}

if (codeParam) {
	fetch('https://localhost:443/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ code: codeParam })
	})
		.then(res => {
			if (res.status === 200) return res.json()
			$spinner.style.display = 'none'
			$menuButtons.style.display = 'flex'
			$loginForm.style.display = 'block'
		})
		.then(res => {
			UserStore.emit(res)
			navigate('')
		})
} else {
	$spinner.style.display = 'none'
	$menuButtons.style.display = 'flex'
	$loginForm.style.display = 'block'
}

function handleLoginForm(self: HTMLElement) {
	console.log('Handling login form')
	const $el = document.createElement('span') as HTMLSpanElement
	const $form = document.querySelector('user-form form') as HTMLElement
	const $submitBtn = document.querySelector('user-form form button[type="submit"]') as HTMLElement

	$form.style.display = 'block'
	$el.innerText = 'Login Form'
	self.innerHTML = ''

	//
	const $username = ($form.querySelector('input[name="username"]') as HTMLInputElement).value
	const $pwd = ($form.querySelector('input[name="pwd"]') as HTMLInputElement).value

	setupUsernameAndPwdFieldsValidation($form)
	$submitBtn.onclick = (e) => {
		e.preventDefault()

		if (hasInvalidFields($form)) {
			alert('Form contains invalid fields.')
			return
		}

		const formData = {username: $username, pwd: $pwd}
		console.log('Submitting register form with FormData:', formData)

		fetch('https://localhost:443/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(formData)
		}).then(res => {
			console.log("res status:", res.status)
			if (res.status >= 400)
			{
				console.log('statusText:', res.statusText)
				return {statusText: res.statusText}
			}
			else
				return res.json()
		}).then(json => {
			console.log('json:', json)
		})
	}

	self.append($el)
}

function selectLoginType(loginType: string, self: HTMLElement) {
	if (loginType === '42') {
		const $uri = 'https://localhost/login'
		start42OAuth(self, $uri)
	} else {
		handleLoginForm(self)
	}
}

const unsubKeyStore = KeyboardStore.subscribe(key => {
	if (['ArrowLeft', 'ArrowRight'].includes(key.value)) {
		const data = currentButton?.dataset
		if (data && data?.stateValue) {
			const action = actions[data.action]
			const current = Number(data.stateValue)

			const min = action.min
			const max = action.max
			const steps = action.steps
			let newValue
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
