type Subscriber = (key: HTMLElement) => void

function createCurrentButtonStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(key: HTMLElement) {
		for (const fn of subscribers) fn(key)
	}

	return { subscribe, emit }
}

declare global {
	interface Window {
		CurrentButtonStore?: ReturnType<typeof createCurrentButtonStore>
	}
}

export const CurrentButtonStore = (window.CurrentButtonStore ??= createCurrentButtonStore())
