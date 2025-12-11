import { navigate } from '../js/routing'
import { CurrentButtonStore } from '../stores/current_button.store'
import { KeyboardStore } from '../stores/keyboard.store'
import { v4 as uuidv4 } from 'uuid'
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
const $registerForm = document.querySelector('register-form') as HTMLElement
const urlParams = new URLSearchParams(window.location.search)
const codeParam = urlParams.get('code')
const $oauthContainer = document.querySelector('register-form oauth-container') as HTMLElement

const actions = {
	selectRegisterType: {
		min: 0,
		max: 1,
		steps: 1,
		callback: selectRegisterType,
		values: ['42', 'Email']
	}
}

const $page: HTMLElement = document.querySelector('page[type=register]')!

let currentButton: HTMLElement

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

if ($oauthContainer) {
	start42OAuth($oauthContainer)
}

if (codeParam) {
	fetch('https://localhost:443/api/auth', {
		method: 'POST',
		body: JSON.stringify({ code: codeParam })
	})
		.then(res => {
			if (res.status === 200) return res.json()
			$spinner.style.display = 'none'
			$menuButtons.style.display = 'flex'
			$registerForm.style.display = 'block'
		})
		.then(res => {
			UserStore.emit(res)
			navigate('')
		})
} else {
	$spinner.style.display = 'none'
	$menuButtons.style.display = 'flex'
	$registerForm.style.display = 'block'
}

function start42OAuth(self: HTMLElement) {
	const $el = document.createElement('a') as HTMLAnchorElement
	const url =
		'https://api.intra.42.fr/oauth/authorize?' +
		new URLSearchParams({
			client_id: 'u-s4t2ud-9f30b2430e51c381ae5e38158295eef89230a74b070231a798bd1bcb7a01709c',
			redirect_uri: 'https://localhost/register',
			response_type: 'code',
			state: uuidv4()
		})

	$el.setAttribute('href', url)

	$el.innerText = '42'

	self.innerHTML = ''
	self.append($el)
}

function selectRegisterType(registerType: string, self: HTMLElement) {
	if (registerType === '42') {
		start42OAuth(self)
	} else {
		self.innerText = registerType
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
