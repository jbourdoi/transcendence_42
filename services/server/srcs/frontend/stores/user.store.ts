import { StateStore } from './state.store'

type Subscriber = (user: UserType) => void

export type UserType = {
	email: string
	username: string
	id?: number
	has_2fa?: boolean
	isValid: boolean
}

let user: any = {
	email: '',
	username: '',
	id: undefined,
	get isValid() {
		return Boolean(this.email && this.username && this.id)
	}
}

function createUserStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		fn(user)
		return () => subscribers.delete(fn)
	}

	function emit(newUser: UserType) {
		if (!newUser) return
		user.email = newUser.email
		user.username = newUser.username
		user.id = newUser.id
		user.has_2fa = newUser.has_2fa

		StateStore.update({ username: user.username, id: user.id, email: user.email, has_2fa: user.has_2fa })

		for (const fn of subscribers) fn(user)
	}

	function clear() {
		UserStore.emit({
			email: '',
			username: '',
			id: undefined,
			has_2fa: undefined,
			isValid: false
		})
	}

	function getUserName() {
		return user.username
	}

	return { subscribe, emit, getUserName, clear }
}

declare global {
	interface Window {
		UserStore?: ReturnType<typeof createUserStore>
	}
}

export const UserStore = (window.UserStore ??= createUserStore())
