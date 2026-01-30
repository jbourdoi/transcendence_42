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
import { inertForm, redirectIfAuthenticated } from '../functions/authGuard.js'
import { NotificationStore } from '../stores/notification.store.js'

let trackEvent = false

const $spinner = document.querySelector('span[type="spinner"] img') as HTMLImageElement
const $menuButtons = document.querySelector('menu-buttons') as HTMLElement
const $navButton = document.querySelector('nav-button') as HTMLElement
const $registerForm = document.querySelector('form') as HTMLElement
const urlParams = new URLSearchParams(window.location.search)
const codeParam = urlParams.get('code')
let keyboardKey: KeyboardKeyEvent

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

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

start42OAuth(document.querySelector('nav-button')!, `https://${location.host}/register`)

if (codeParam) {
	$navButton.style.display = 'none'
	fetch(`/api/auth/register`, {
		method: 'POST',
		body: JSON.stringify({ code: codeParam, redirect: location.host })
	})
		.then(res => {
			if (res.status === 200) return res.json()
			$spinner.style.display = 'none'
			$menuButtons.style.display = 'flex'
			return res.json()
		})
		.then(res => {
			if (res.info.status >= 400) {
				if (res.info.message?.errno === 19) {
					NotificationStore.notify('Username or email already taken', 'ERROR')
				} else {
					NotificationStore.notify(res.info.message, 'ERROR')
				}
				navigate('register')
				return
			}
			NotificationStore.notify('Register successful', 'SUCCESS')
			UserStore.emit(res)
			navigate('')
		})
} else {
	$spinner.style.display = 'none'
	$menuButtons.style.display = 'flex'
	$navButton.style.display = 'flex'
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
			if (hasInvalidFields($registerForm)) {
				NotificationStore.notify('Form contains invalid fields.', 'ERROR')
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

	$registerForm.style.display = 'grid'

	setupAvatarPreview($avatarInput, $avatarPreview)
	setupAllFieldValidation($registerForm)
}
console.log(`https://${location.host}/register`)
function selectRegisterType(registerType: string, self: HTMLElement) {
	if (registerType === '42') {
		start42OAuth(self, `https://${location.host}/register`)
		inertForm($registerForm, true)
	} else {
		inertForm($registerForm, false)
		handleUserForm(self)
	}
}

const unsubKeyStore = KeyboardStore.subscribe(key => {
	keyboardKey = key
	if (['ArrowLeft', 'ArrowRight'].includes(key.value)) {
		const data = currentButton?.dataset
		if (data && data?.stateValue) {
			//@ts-ignore
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
