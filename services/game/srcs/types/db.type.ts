export type dbBody = {
	endpoint: string
	query: {
		verb: string
		sql: string
		data?: any[]
	}
}