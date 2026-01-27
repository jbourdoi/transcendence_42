import { updateDomState } from '../functions/updateDomState.fn'
import { PageUpdateStore } from './page_state'
import { v4 as uuidv4 } from 'uuid'

type Subscriber = (config: any) => void

let state = {
	textSize: 20,
	username: undefined,
	email: undefined,
	id: undefined,
	uuid: uuidv4(),
	selectedProfile: undefined,
	createdGame : {}
}

document.addEventListener('DOMContentLoaded', () => {
	updateDomState(state)
})

PageUpdateStore.subscribe(() => {
	updateDomState(state)
})

function updateDomWithState(stateKey: string, stateValue: string) {
	document.querySelectorAll(`state[key='${stateKey}']`).forEach($el => {
		$el.innerHTML = stateValue
	})
}

function createStateStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		fn(state)
		return () => subscribers.delete(fn)
	}

	function emit(state: any) {
		for (const fn of subscribers) fn(state)
	}

	function update(newState: any) {
		for (let key in newState) {
			state[key] = newState[key]
			updateDomWithState(key, newState[key])
		}
		for (const fn of subscribers) fn(state)
	}

	function getStateUUID() {
		return state.uuid
	}

	function getCreatedGame(){
		return state.createdGame
	}

	return { subscribe, emit, update, getStateUUID, getCreatedGame }
}

declare global {
	interface Window {
		StateStore?: ReturnType<typeof createStateStore>
	}
}

export const StateStore = (window.StateStore ??= createStateStore())
