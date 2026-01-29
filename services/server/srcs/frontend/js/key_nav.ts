import { cleanTabIndexedElementsEvents, getTabIndexedElements } from '../functions/getTabIndexedElements.fn'
import { CurrentButtonStore } from '../stores/current_button.store'
import { TabIndexStore } from '../stores/tabIndex.store'
import { KeyboardStore } from '../stores/keyboard.store'
import { PageDestroyStore, PageUpdateStore } from '../stores/page_state'
import { navigate } from './routing'

let buttonList: (HTMLElement | undefined)[] = []
let currentTabIndex = 0

PageUpdateStore.subscribe(_ => {
	buttonList = getTabIndexedElements()
})

PageDestroyStore.subscribe(() => {
	cleanTabIndexedElementsEvents()
	buttonList.length = 0
	currentTabIndex = 0
})

TabIndexStore.subscribe(tabIndex => {
	// console.log('Tab Index: ', tabIndex)
	// selectElement(tabIndex)
})

CurrentButtonStore.subscribe(currentButton => {
	unselectButtons()
	// console.log(currentButton)
	currentButton.dataset.selected = 'true'
})

function findNextIndex(list, startIndex, direction) {
	const step = direction === 'down' ? 1 : -1
	const length = list.length

	let i = startIndex

	for (let count = 0; count < length; count++) {
		i = (i + step + length) % length

		if (list[i] !== undefined) {
			return i
		}
	}
	return -1
}

function selectElement(index: number) {
	currentTabIndex = index
	unselectButtons()
	const currentButton = buttonList[currentTabIndex]
	if (!currentButton) return
	currentButton.dataset.selected = 'true'
	currentButton.focus()
	CurrentButtonStore.emit(currentButton)
}

KeyboardStore.subscribe(keyEvt => {
	if (!['ArrowDown', 'ArrowUp', 'Tab'].includes(keyEvt.value)) return

	let direction = keyEvt.value === 'ArrowDown' ? 'down' : 'up'
	if (keyEvt.value === 'Tab') {
		direction = keyEvt.isShift === true ? 'up' : 'down'
		// return
	} else {
		direction = keyEvt.value === 'ArrowDown' ? 'down' : 'up'
	}

	const nextIndex = findNextIndex(buttonList, currentTabIndex, direction)

	if (nextIndex === -1) return
	selectElement(nextIndex)
})

KeyboardStore.subscribe(keyEvt => {
	if (keyEvt.value === 'Enter') {
		let currentButton = buttonList[currentTabIndex]
		if (currentButton) {
			const newRoute = currentButton.getAttribute('data-route')
			if (newRoute != undefined) return navigate(newRoute)
			const $anchor = currentButton.querySelector('a')
			if ($anchor) return $anchor.click()
			currentButton.click()
		}
	}
})

function unselectButtons() {
	buttonList.forEach(el => {
		if (el) el.dataset.selected = 'false'
	})
}
