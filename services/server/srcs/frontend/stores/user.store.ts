import { StateStore } from './state.store'

type Subscriber = (user: UserType) => void

export type UserType = {
	email: string
	firstName: string
	lastName: string
	login: string
	isValid: boolean
}

let user: any = {
	email: '',
	firstName: '',
	lastName: '',
	login: '',
	get isValid() {
		return Boolean(this.email && this.firstName && this.lastName && this.login)
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
		user.firstName = newUser.firstName
		user.lastName = newUser.lastName
		user.login = newUser.login

		StateStore.update({ username: user.login })

		for (const fn of subscribers) fn(user)
	}

	return { subscribe, emit }
}

declare global {
	interface Window {
		UserStore?: ReturnType<typeof createUserStore>
	}
}

export const UserStore = (window.UserStore ??= createUserStore())
