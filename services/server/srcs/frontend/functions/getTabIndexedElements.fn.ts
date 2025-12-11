import { KeyboardKeyEvent, KeyboardStore } from '../stores/keyboard.store'
import { TabIndexStore } from '../stores/tabIndex.store'

let buttonList: HTMLElement[] = []
let currentKeyPress: KeyboardKeyEvent

KeyboardStore.subscribe(keyBoardKey => (currentKeyPress = keyBoardKey))

export function getTabIndexedElements(): HTMLElement[] {
	document.querySelectorAll<HTMLElement>('*[tabindex]').forEach((el: HTMLElement, idx: number) => {
		if (idx === 0) el.focus()
		buttonList.push(el)
		el.addEventListener('focus', handleFocusEvent)
	})
	return buttonList
}

export function cleanTabIndexedElementsEvents() {
	buttonList.forEach((el: HTMLElement) => {
		el.removeEventListener('focus', handleFocusEvent)
	})
}

function handleFocusEvent(evt: FocusEvent) {
	if (['ArrowDown', 'ArrowUp'].includes(currentKeyPress?.value)) return
	let $el = evt?.target as HTMLElement
	if (!$el) return
	let tabIndex = $el.getAttribute('tabIndex') as number | null
	if (tabIndex) TabIndexStore.emit(tabIndex - 1)
}
