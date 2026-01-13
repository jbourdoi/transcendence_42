export type MessageType = {
	type: 'global' | 'mp' | 'auth'
	to?: string
	msg: string
}
