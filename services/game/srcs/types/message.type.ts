export type InputType = {
	type: 'input',
	key: KeyType
}

export type StatusType = "chat" | "game" | "lobby" | "waiting"

export type KeyType = "none" | "+" | "-" | "space" | "chatGPT"

export type DuelType = {
	type: 'duel',
	to: string,
	action: 'propose' | 'accept' | 'decline'
}

export type AuthType = {
	type: 'auth',
	username : string
}

export type NavigateType = {
	type : 'navigate',
	navigate : string
}

export type GameInitType = {
	humanCount: number,
	botCount:number
}

export type CreateGameType = {
	type : 'create-game',
	game : GameInitType
}

export type JoinGameType = {
	type: "join-game"
	sessionId: string
}

export type GamePending = {
	id:string,
	nbPlayerReady: number,
	nbPlayerMax: number
}


export type LeaveGameType = {
	type: "leave-game"
}

export type MessageType = InputType | DuelType | AuthType | FrontInfoType | NavigateType | CreateGameType | JoinGameType | ListGameType | LeaveGameType;

export type FrontType = FrontInfoType | FrontErrorType | FrontSystemType | DuelResponse | ListGameType | SessionId | StartGame | FrontLogoutType;

export type FrontLogoutType = {
	type : 'logout'
}

export type FrontInfoType = {
	type : 'info',
	text : string
}

export type FrontErrorType = {
	type: 'error',
	text: string
}

export type FrontSystemType = {
	type: "system",
	text:string
}

export type DuelResponse = {
	type: 'duel',
	action: 'propose' | 'decline' | 'accept'
	from: string
}

export type ListGameType = {
	type: 'list-game',
	games: GamePending[]
}

export type SessionId = {
	type: "session-id",
	sessionId: string
}

export type StartGame = {
	type: "start-game"
}
