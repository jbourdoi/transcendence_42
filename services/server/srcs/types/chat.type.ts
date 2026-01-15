export type MessageType = {
	type: 'global' | 'mp' | 'auth'
	to?: number | string
	id?: string
	msg: string
	timestamp: number
	user: string
}
