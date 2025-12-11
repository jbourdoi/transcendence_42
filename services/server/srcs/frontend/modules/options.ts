import { CurrentButtonStore } from '../stores/current_button.store'
import { KeyboardStore } from '../stores/keyboard.store'
import { StateStore } from '../stores/state.store'

function applyTextUpdate(textSize: number, self: HTMLElement) {
	// self.innerText = `Text Size (${textSize}px)`
	// StateStore.update({ textSize })
}

function applyLangUpdate(val: string, self: HTMLElement) {
	const langs = {
		En: 'Language (En)',
		Fr: 'Langue (Fr)',
		Es: 'Lenguage (Es)'
	}
	self.innerText = `${langs[val]}`
}

const actions = {
	updateLanguage: {
		min: 0,
		max: 2,
		steps: 1,
		callback: applyLangUpdate,
		values: ['En', 'Fr', 'Es']
	},
	updateTextSize: {
		min: 8,
		max: 32,
		steps: 2,
		callback: applyTextUpdate,
		get values() {
			return Array.from({ length: (this.max - this.min) / this.steps + 1 }, (_, i) => this.min + i * this.steps)
		}
	}
}

const $page: HTMLElement = document.querySelector('page[type=options]')!

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

			// console.log(nextValue)
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
