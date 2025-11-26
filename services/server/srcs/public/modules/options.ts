import { CurrentButtonStore } from '../stores/current_button.store.js'
import { KeyboardStore } from '../stores/keyboard.store.js'

const actions = {
	updateLanguage: {
		min: 0,
		max: 2,
		steps: 1,
		values: ['En', 'Fr', 'Es'],
		innerText: ['Language (En)', 'Langue (Fr)', 'Lenguage (Es)']
	}
}

const $page: HTMLElement = document.querySelector('page[type=options]')!

let currentButton: HTMLElement

const unsubCurrentButtonStore = CurrentButtonStore.subscribe(el => (currentButton = el))

const unsubKeyStore = KeyboardStore.subscribe(key => {
	if (['ArrowLeft', 'ArrowRight'].includes(key)) {
		const data = currentButton.dataset
		if (data && data?.action) {
			const action = actions[data.action]
			const currentOption = data.currentoption
			console.log(currentOption)
			currentButton.innerText = action.innerText[currentOption]
		}
	}
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubCurrentButtonStore()
	unsubKeyStore()
}

$page.addEventListener('cleanup', cleanPage)
