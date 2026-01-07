import { CurrentButtonStore } from '../stores/current_button.store'
import { KeyboardStore } from '../stores/keyboard.store'
import { UserStore, type UserType } from '../stores/user.store'

type LoginButtonValues = {
	[key: string]: {
		id: string
		inner: string
		route: string
		next: string
	}
}

const loginButtonValues: LoginButtonValues = {
	registerButton: {
		id: 'registerButton',
		inner: 'Register',
		route: 'register',
		next: 'loginButton'
	},
	loginButton: {
		id: 'loginButton',
		inner: 'Login',
		route: 'login',
		next: 'registerButton'
	}
}

const $page: HTMLElement = document.querySelector('page[type=index]')!
const $loginButton: HTMLElement = document.querySelector('nav-button[data-route="login"]')!
const $logoutButton: HTMLElement = document.querySelector('nav-button[data-route="logout"]')!
// nav-button data-route="login"
// nav-button data-route="logout"
let currentButton: HTMLElement

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

const unsubKeyStore = KeyboardStore.subscribe(key => {
	if (['ArrowLeft', 'ArrowRight'].includes(key.value)) {
		const nextValue = loginButtonValues[loginButtonValues[currentButton.id].next]
		if (nextValue) {
			const $navLeft = document.createElement('nav-left')
			const $navRight = document.createElement('nav-right')
			const $span = document.createElement('span')

			$navLeft.innerText = ' < '
			$navRight.innerText = ' > '
			$span.innerText = nextValue.inner
			currentButton.innerText = ''

			currentButton.appendChild($navLeft)
			currentButton.appendChild($span)
			currentButton.appendChild($navRight)

			currentButton.id = nextValue.id
			currentButton.dataset.route = nextValue.route
		}
	}
})

const unsubUserStore = UserStore.subscribe((user: UserType) => {
	if (user.isValid) {
		$loginButton.remove()
	} else {
		$logoutButton.remove()
	}
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubCurrentButtonStore()
	unsubKeyStore()
	unsubUserStore()
}

$page.addEventListener('cleanup', cleanPage)
