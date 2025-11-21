type Subscriber = (key: HTMLElement) => void

export const CurrentButtonStore = (function () {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(key: HTMLElement) {
		for (const fn of subscribers) fn(key)
	}

	return { subscribe, emit }
})()
