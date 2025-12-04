import { CurrentButtonStore } from '../stores/current_button.store.js'
import { KeyboardStore } from '../stores/keyboard.store.js'

function handleCredentialResponse(response) {
	console.log('Encoded JWT ID token: ' + response.credential)
}

function startGoogleOAuth(self: HTMLElement) {
	google.accounts.id.initialize({
		client_id: 'YOUR_GOOGLE_CLIENT_ID',
		callback: handleCredentialResponse
	})
	google.accounts.id.renderButton(self, { theme: 'outline', size: 'large' })
	google.accounts.id.prompt()
}

function selectRegisterType(registerType: string, self: HTMLElement) {
	console.log(registerType)
	console.log(self)
	if (registerType === 'Google') {
		startGoogleOAuth(self)
	} else {
		self.innerText = registerType
	}
}

const actions = {
	selectRegisterType: {
		min: 0,
		max: 2,
		steps: 1,
		callback: selectRegisterType,
		values: ['42', 'Google', 'Email']
	}
}

const $page: HTMLElement = document.querySelector('page[type=register]')!

let currentButton: HTMLElement

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

const unsubKeyStore = KeyboardStore.subscribe(key => {
	if (['ArrowLeft', 'ArrowRight'].includes(key.value)) {
		const data = currentButton.dataset
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
			// currentButton.innerText = nextValue.inner
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
