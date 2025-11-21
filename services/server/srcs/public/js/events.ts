import { KeyboardStore } from '../stores/keyboard.store.js'

document.addEventListener('keyup', (evt: KeyboardEvent) => {
	KeyboardStore.emit(evt.key)
})
