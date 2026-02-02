import { StateStore } from './state.store'

type Subscriber = (user: UserType) => void

export type UserType = {
	email: string
	username: string
	id?: number
	has_2fa?: boolean
	avatar: string
	isValid: boolean
}

let user: UserType = {
	email: '',
	username: '',
	id: undefined,
	avatar: '',
	get isValid() {
		return Boolean(this.username && this.id)
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
		// console.log('newuser: ', newUser)
		user.email = newUser.email
		user.username = newUser.username
		user.id = newUser.id
		user.has_2fa = newUser.has_2fa
		user.avatar = newUser.avatar

		StateStore.update({ username: user.username, id: user.id, email: user.email, has_2fa: user.has_2fa, avatar: user.avatar })

		for (const fn of subscribers) fn(user)
	}

	function clear() {
		UserStore.emit({
			email: '',
			username: '',
			id: undefined,
			has_2fa: undefined,
			avatar: '',
			isValid: false
		})
	}

	function isValid(){
		return user.isValid
	}

	function getUserName() {
		return user.username
	}

	function getUser2FAStatus() {
		return user.has_2fa
	}

	function setUser2FAStatus(status: boolean) {
		user.has_2fa = status
		StateStore.update({ has_2fa: status })
		emit(user)
	}

	return { subscribe, emit, getUserName, getUser2FAStatus, setUser2FAStatus, clear, isValid }
}

declare global {
	interface Window {
		UserStore?: ReturnType<typeof createUserStore>
	}
}

export const UserStore = (window.UserStore ??= createUserStore())
