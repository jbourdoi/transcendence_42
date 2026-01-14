import { updateDomState } from '../functions/updateDomState.fn'
import { PageUpdateStore } from './page_state'
import { v4 as uuidv4 } from 'uuid'

type Subscriber = (config: any) => void

let config = {
	textSize: 20,
	username: undefined,
	email: undefined,
	id: undefined,
	uuid: uuidv4()
}

document.addEventListener('DOMContentLoaded', () => {
	updateDomState(config)
})

PageUpdateStore.subscribe(() => {
	updateDomState(config)
})

function createStateStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		fn(config)
		return () => subscribers.delete(fn)
	}

	function emit(config: any) {
		for (const fn of subscribers) fn(config)
	}

	function update(newConfig: any) {
		for (let key in newConfig) {
			config[key] = newConfig[key]
		}
		for (const fn of subscribers) fn(config)
	}

	function getStateUUID() {
		return config.uuid
	}

	return { subscribe, emit, update, getStateUUID }
}

declare global {
	interface Window {
		StateStore?: ReturnType<typeof createStateStore>
	}
}

export const StateStore = (window.StateStore ??= createStateStore())
