import { CurrentButtonStore } from '../stores/current_button.store.js'
import { KeyboardStore } from '../stores/keyboard.store.js'

const loginButtonValues = {
	loginButton: {
		id: 'registerButton',
		inner: 'Register',
		route: 'register'
	},
	registerButton: {
		id: 'loginButton',
		inner: 'Login',
		route: 'login'
	}
}

const $page: HTMLElement = document.querySelector('page[type=index]')!

const unsubKeyStore = KeyboardStore.subscribe(key => {
	if (['ArrowLeft', 'ArrowRight'].includes(key)) {
		const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => {
			const nextValue = loginButtonValues[el.id]

			el.innerText = nextValue.inner
			el.id = nextValue.id
			el.dataset.route = nextValue.route

			unsubCurrentButtonStore()
		})
	}
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubKeyStore()
}

$page.addEventListener('cleanup', cleanPage)
