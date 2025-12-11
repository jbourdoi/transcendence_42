import { KeyboardStore } from '../stores/keyboard.store'

document.addEventListener('keydown', (evt: KeyboardEvent) => {
	KeyboardStore.emit({
		value: evt.key,
		isShift: evt.shiftKey
	})
})
