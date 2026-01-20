import { navigate } from '../js/routing'
import { CurrentButtonStore } from '../stores/current_button.store'
import { KeyboardKeyEvent, KeyboardStore } from '../stores/keyboard.store'
import { UserStore } from '../stores/user.store'
import {
	setupAvatarPreview,
	setupAllFieldValidation,
	createFormData,
	hasInvalidFields,
	resetAvatarButton
} from '../functions/formValidation.js'
import { start42OAuth } from '../functions/start42OAuth.js'
import { fetchRegister } from '../functions/loginRegisterFetch.js'
import { redirectIfAuthenticated } from '../functions/authGuard.js'

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
const $registerForm = document.querySelector('form') as HTMLElement
const urlParams = new URLSearchParams(window.location.search)
const codeParam = urlParams.get('code')

const actions = {
	selectRegisterType: {
		min: 0,
		max: 1,
		steps: 1,
		callback: selectRegisterType,
		values: ['42', 'User Form']
	}
}

const $page: HTMLElement = document.querySelector('page[type=register]')!

redirectIfAuthenticated()

let currentButton: HTMLElement
let keyboardKey: KeyboardKeyEvent

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

start42OAuth(document.querySelector('nav-button'), 'https://localhost/register')

if (codeParam) {
	fetch('https://localhost:443/api/auth/register', {
		method: 'POST',
		body: JSON.stringify({ code: codeParam })
	})
		.then(res => {
			if (res.status === 200) return res.json()
			$spinner.style.display = 'none'
			$menuButtons.style.display = 'flex'
			$registerForm.style.display = 'flex'
		})
		.then(res => {
			console.log('FRONTEND --- register form response:', res)
			console.log('FRONTEND --- res infoFetch register form:', res.infoFetch)
			UserStore.emit(res.infoFetch)
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
	const $avatarInput = $registerForm.querySelector('input[name="avatar"]') as HTMLInputElement
	const $avatarPreview = $registerForm.querySelector('#avatarPreview') as HTMLImageElement
	const $resetAvatarBtn = $registerForm.querySelector('#resetAvatarButton') as HTMLButtonElement
	resetAvatarButton($resetAvatarBtn, $avatarInput, $avatarPreview)

	if (trackEvent === false) {
		trackEvent = true
		$submitBtn.onclick = e => {
			e.preventDefault()
			const formData = createFormData($registerForm, $avatarInput)
			for (const [key, value] of formData.entries()) {
				console.log(key, value)
			}
			if (hasInvalidFields($registerForm)) {
				alert('Form contains invalid fields.')
				return
			}

			fetchRegister(formData, $registerForm)
		}
	}

	$span.innerText = 'User Form'

	$navLeft.innerText = ' < '
	$navRight.innerText = ' > '

	self.innerHTML = ''

	self.appendChild($navLeft)
	self.appendChild($span)
	self.appendChild($navRight)

	$registerForm.style.display = 'flex'

	setupAvatarPreview($avatarInput, $avatarPreview)
	setupAllFieldValidation($registerForm)
}

function selectRegisterType(registerType: string, self: HTMLElement) {
	if (registerType === '42') {
		start42OAuth(self, 'https://localhost/register')
	} else {
		handleUserForm(self)
	}
}

const unsubKeyStore = KeyboardStore.subscribe(key => {
	keyboardKey = key
	if (['ArrowLeft', 'ArrowRight'].includes(key.value)) {
		const data = currentButton?.dataset
		if (data && data?.stateValue) {
			const action = actions[data.action]
			const current = Number(data.stateValue)
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

/////////// REGISTER ///////////
// fetch('/register', {
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
// 	.then(data => console.log('Register response:', data))
