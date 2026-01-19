export type MessageType = {
	type: 'global' | 'mp' | 'auth' | 'info' | 'error' | 'users' | 'req-friend' | 'notification' | 'block-user' | 'duel-user'
	to?: number | string
	id?: string
	msg: string
	timestamp: number
	user: string
}
