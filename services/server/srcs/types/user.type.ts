export type UserRegisterType = {
	pwd: string
	checkpwd: string
	email: string
	checkmail: string
	username: string
}

export type UserLoginType = {
	username: string
	pwd: string
}

export type UserUpdateType = {
	username?: string
	avatar?: string
}

export type UserInfoType = {
	email: string
	username: string
	id: number
	has_2fa: boolean
	avatar: string
}
