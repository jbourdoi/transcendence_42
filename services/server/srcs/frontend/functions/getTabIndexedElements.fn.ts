import { CurrentButtonStore } from '../stores/current_button.store'
import { KeyboardKeyEvent, KeyboardStore } from '../stores/keyboard.store'
import { TabIndexStore } from '../stores/tabIndex.store'

let buttonList: (HTMLElement | undefined)[] = []
let currentKeyPress: KeyboardKeyEvent

KeyboardStore.subscribe(keyBoardKey => (currentKeyPress = keyBoardKey))

export function getTabIndexedElements(): (HTMLElement | undefined)[] {
	buttonList.length = 0
	document.querySelectorAll<HTMLElement>('*[tabindex]').forEach((el: HTMLElement, idx: number) => {
		if (idx === 0) el.focus()

		if (el.getAttribute('inert') === 'true') {
			buttonList.push(undefined)
		} else {
			buttonList.push(el)
		}

		el.addEventListener('focus', handleFocusEvent)
		el.addEventListener('mouseenter', handleMouseEnter)
		el.addEventListener('click', handleNavClick)
	})
	return buttonList
}

export function cleanTabIndexedElementsEvents() {
	buttonList.forEach((el: HTMLElement | undefined) => {
		if (el) {
			el.removeEventListener('focus', handleFocusEvent)
			el.removeEventListener('mouseenter', handleMouseEnter)
			el.removeEventListener('mouseenter', handleNavClick)
		}
	})
}

function handleFocusEvent(evt: FocusEvent) {
	return
	// if (['ArrowDown', 'ArrowUp'].includes(currentKeyPress?.value)) return
	// const el = evt.target as HTMLElement
	// if (el === null) return
	// let tabIndex = el.getAttribute('tabIndex') as number | null
	// if (tabIndex === null) return
	// CurrentButtonStore.emit(el)
}

function handleMouseEnter(evt: MouseEvent) {
	const el = evt.target as HTMLElement
	if (el === null) return
	let tabIndex = el.getAttribute('tabIndex') as number | null
	if (tabIndex === null) return
	CurrentButtonStore.emit(el)
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
