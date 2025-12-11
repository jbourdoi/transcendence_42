export type KeyboardKeyEvent = {
	value: string
	isShift: boolean
}

type Subscriber = (e: KeyboardKeyEvent) => void

function createKeyboardStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(e: KeyboardKeyEvent) {
		for (const fn of subscribers) fn(e)
	}

	return { subscribe, emit }
}

declare global {
	interface Window {
		__KeyboardStore?: ReturnType<typeof createKeyboardStore>
	}
}

export const KeyboardStore = (window.__KeyboardStore ??= createKeyboardStore())
