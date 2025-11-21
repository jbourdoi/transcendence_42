type Subscriber = (key: string) => void

export const KeyboardStore = (function () {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		return () => subscribers.delete(fn)
	}

	function emit(key: string) {
		for (const fn of subscribers) fn(key)
	}

	return { subscribe, emit }
})()
