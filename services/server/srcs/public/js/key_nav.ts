import { getTraverable } from '../functions/getTraversable.fn.js'
import { CurrentButtonStore } from '../stores/current_button.store.js'
import { KeyboardStore } from '../stores/keyboard.store.js'
import { PageChangeStore } from '../stores/page_change.js'
import { navigate } from './routing.js'

let currentIdx = 0
let buttonList: HTMLElement[] = []

PageChangeStore.subscribe(newPage => {
	buttonList.length = 0
	currentIdx = 0
	console.log('New page: ', newPage)
	buttonList = getTraverable()
})

KeyboardStore.subscribe(key => {
	console.log('Key pressed: ', key)

	if (key === 'ArrowDown') {
		currentIdx = (currentIdx + 1) % buttonList.length
	} else if (key === 'ArrowUp') {
		currentIdx = (currentIdx - 1 + buttonList.length) % buttonList.length
	}
	unselectButtons()
	let currentButton = buttonList[currentIdx]
	if (currentButton?.dataset?.selected !== undefined) {
		currentButton.dataset.selected = 'true'
		CurrentButtonStore.emit(currentButton)
	}
})

KeyboardStore.subscribe(key => {
	if (key === 'Enter') {
		let currentButton = buttonList[currentIdx]
		if (currentButton) {
			const newRoute = currentButton.getAttribute('data-route')
			if (newRoute != undefined) navigate(newRoute)
			else currentButton.click()
		}
	}
})

function unselectButtons() {
	buttonList.forEach(el => (el.dataset.selected = 'false'))
}

// KeyboardStore.subscribe(value => {
// 	console.log('From Store value: ', value)
// })

// document.addEventListener('keyup', evt => {
// 	if (evt.key === 'ArrowDown') {
// 		currentIdx = (currentIdx + 1) % buttonList.length
// 	} else if (evt.key === 'ArrowUp') {
// 		currentIdx = (currentIdx - 1 + buttonList.length) % buttonList.length
// 	}
// 	unselectButtons()
// 	let currentButton = buttonList[currentIdx]
// 	if (currentButton?.dataset?.selected !== undefined) currentButton.dataset.selected = 'true'
// })

// document.addEventListener('keyup', evt => {
// 	let currentButton = buttonList[currentIdx]
// 	if (currentButton) {
// 		const currentoption = Number(currentButton.dataset.currentoption)
// 		const max = Number(currentButton.dataset.max)
// 		const min = Number(currentButton.dataset.min)
// 		const steps = Number(currentButton.dataset.steps)
// 		const length = max - min + 1

// 		if (evt.key === 'ArrowLeft') {
// 			const calc = ((currentoption - steps - min + length) % length) + min
// 			currentButton.dataset.currentoption = String(calc)
// 			currentButton.click()
// 		} else if (evt.key === 'ArrowRight') {
// 			const calc = ((currentoption + steps - min) % length) + min
// 			currentButton.dataset.currentoption = String(calc)
// 			currentButton.click()
// 		}
// 	}
// })

// document.addEventListener('keypress', evt => {
// 	if (evt.key === 'Enter') {
// 		let currentButton = buttonList[currentIdx]
// 		if (currentButton) {
// 			const newRoute = currentButton.getAttribute('data-route')
// 			if (newRoute != undefined) navigate(newRoute)
// 			else currentButton.click()
// 		}
// 	}
// })

// export function initKeyNav() {
// 	console.log('Initializing Key Nav')
// 	document.querySelectorAll<HTMLElement>('.traverse').forEach((el: HTMLElement, idx) => {
// 		buttonList.push(el)
// 		el.dataset.idx = String(idx)
// 	})
// 	hookKeyNav()
// }

// export function cleanKeyNav() {
// 	console.log('Cleaning Key Nav')
// 	unHookKeyNav()
// 	buttonList.forEach($el => $el.remove())
// 	buttonList.length = 0
// 	currentIdx = 0
// }

// function highlightMouseEnter(el: HTMLElement) {
// 	unselectButtons()
// 	currentIdx = Number(el.dataset.idx)
// 	el.dataset.selected = 'true'
// }

// function hookKeyNav() {
// 	buttonList.forEach($el => {
// 		$el.addEventListener('mouseenter', () => highlightMouseEnter($el))
// 	})
// }

// function unHookKeyNav() {
// 	buttonList.forEach($el => {
// 		$el.removeEventListener('mouseenter', () => highlightMouseEnter($el))
// 	})
// }

// function unselectButtons() {
// 	buttonList.forEach(el => (el.dataset.selected = 'false'))
// }
