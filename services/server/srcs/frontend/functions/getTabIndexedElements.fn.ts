import { KeyboardKeyEvent, KeyboardStore } from '../stores/keyboard.store'
import { TabIndexStore } from '../stores/tabIndex.store'

let buttonList: HTMLElement[] = []
let currentKeyPress: KeyboardKeyEvent

KeyboardStore.subscribe(keyBoardKey => (currentKeyPress = keyBoardKey))

export function getTabIndexedElements(): HTMLElement[] {
	document.querySelectorAll<HTMLElement>('*[tabindex]:not([inert])').forEach((el: HTMLElement, idx: number) => {
		if (idx === 0) el.focus()
		buttonList.push(el)

		el.addEventListener('focus', handleFocusEvent)

		el.addEventListener('mouseenter', handleMouseEnter)

		el.addEventListener('click', handleNavClick)
	})
	return buttonList
}

export function cleanTabIndexedElementsEvents() {
	buttonList.forEach((el: HTMLElement) => {
		el.removeEventListener('focus', handleFocusEvent)
		el.removeEventListener('mouseenter', handleMouseEnter)
		el.removeEventListener('mouseenter', handleNavClick)
	})
}

function handleFocusEvent(evt: FocusEvent) {
	if (['ArrowDown', 'ArrowUp'].includes(currentKeyPress?.value)) return
	let $el = evt?.target as HTMLElement
	if (!$el) return
	let tabIndex = $el.getAttribute('tabIndex') as number | null
	if (tabIndex) TabIndexStore.emit(tabIndex - 1)
}

function handleMouseEnter(evt: MouseEvent) {
	const el = evt.target as HTMLElement
	if (el === null) return
	let tabIndex = el.getAttribute('tabIndex') as number | null
	if (tabIndex === null) return
	TabIndexStore.emit(tabIndex - 1)
}

function handleNavClick(evt: MouseEvent) {
	if (evt?.target) {
		const target: HTMLElement = evt.target as HTMLElement
		if (target.tagName === 'NAV-RIGHT') {
			KeyboardStore.emit({
				isShift: false,
				value: 'ArrowRight'
			})
		} else if (target.tagName === 'NAV-LEFT') {
			KeyboardStore.emit({
				isShift: false,
				value: 'ArrowLeft'
			})
		}
	}
}
