export type MessageType = {
	type: 'global' | 'mp' | 'auth' | 'info' | 'error'
	to?: number | string
	id?: string
	msg: string
	timestamp: number
	user: string
}
