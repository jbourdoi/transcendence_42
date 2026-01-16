export type MessageType = {
	type: 'global' | 'mp' | 'auth' | 'info' | 'error' | 'users' | 'req-friend' | 'notification'
	to?: number | string
	id?: string
	msg: string
	timestamp: number
	user: string
}
