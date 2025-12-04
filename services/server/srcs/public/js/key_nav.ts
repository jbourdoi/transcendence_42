import { cleanTabIndexedElementsEvents, getTabIndexedElements } from '../functions/getTabIndexedElements.fn.js'
import { CurrentButtonStore } from '../stores/current_button.store.js'
import { TabIndexStore } from '../stores/tabIndex.store.js'
import { KeyboardStore } from '../stores/keyboard.store.js'
import { PageDestroyStore, PageUpdateStore } from '../stores/page_state.js'
import { navigate } from './routing.js'

let buttonList: HTMLElement[] = []
let currentTabIndex = 0

PageUpdateStore.subscribe(_ => {
	buttonList = getTabIndexedElements()
})

PageDestroyStore.subscribe(() => {
	cleanTabIndexedElementsEvents()
	buttonList.length = 0
	currentTabIndex = 0
	console.log('Page Destroyed')
})

TabIndexStore.subscribe(tabIndex => {
	currentTabIndex = tabIndex

	let $foundEl = buttonList.find($el => {
		const elTabIndex = Number($el.getAttribute('tabIndex')) as number | null
		return tabIndex + 1 === elTabIndex
	})
	if ($foundEl) {
		unselectButtons()
		let currentButton = $foundEl
		if (currentButton?.dataset?.selected !== undefined) {
			currentButton.dataset.selected = 'true'
			CurrentButtonStore.emit(currentButton)
		}
	}
})

KeyboardStore.subscribe(keyEvt => {
	if (!['ArrowDown', 'ArrowUp'].includes(keyEvt.value)) return
	if (keyEvt.value === 'ArrowDown') {
		currentTabIndex = (currentTabIndex + 1) % buttonList.length
	} else if (keyEvt.value === 'ArrowUp') {
		currentTabIndex = (currentTabIndex - 1 + buttonList.length) % buttonList.length
	}
	unselectButtons()
	let currentButton = buttonList[currentTabIndex]
	if (currentButton?.dataset?.selected !== undefined) {
		TabIndexStore.emit(currentTabIndex)
		currentButton.dataset.selected = 'true'
		currentButton.focus()
		CurrentButtonStore.emit(currentButton)
	}
})

KeyboardStore.subscribe(keyEvt => {
	if (keyEvt.value === 'Enter') {
		let currentButton = buttonList[currentTabIndex]
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
