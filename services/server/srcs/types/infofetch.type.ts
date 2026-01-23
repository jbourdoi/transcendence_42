export type InfoFetchType = {
	id?: number
	email?: string
	username?: string
	has_2fa?: boolean
	info: {
		status: number
		message?: string
	}
}
