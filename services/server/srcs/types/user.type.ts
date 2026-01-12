export type userRegisterType = {
    avatar: string,
    pwd: string,
    checkpwd: string,
    email: string,
    checkmail: string,
    username: string
}

export type userLoginType = {
    username: string,
    pwd: string
}

export type userUpdateType = {
    username?: string,
    avatar?: string
}

