export type ChatType = {
	type : 'chat',
	text : string
}

export type MpType = {
	type: 'mp',
	to: string,
	text: string,
}

export type InputType = {
	type: 'input',
	key: KeyType
}

export type KeyType = "none" | "+" | "-" | "space" | "chatGPT"

export type DuelType = {
	type: 'duel',
	to: string,
	action: 'propose' | 'accept' | 'decline'
}

export type FrontChatType = {
	type: 'chat',
	from: string,
	text: string
}

export type FrontMpTypeFrom = {
	type: 'mp-from',
	from: string,
	text: string
}

export type FrontMpTypeTo = {
	type: 'mp-to',
	to: string,
	text: string
}

export type AuthType = {
	type: 'auth',
	username : string
}

export type InfoType = {
	type : 'info',
	msg : string
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

export type LeaveGameType = {
	type: "leave-game"
}

export type GamePending = {
	id:string,
	nbPlayerReady: number,
	nbPlayerMax: number
}

export type JoinGameType = {
	type: "join-game"
	sessionId: string
}


export type MessageType = InputType | DuelType | AuthType | InfoType | NavigateType | CreateGameType | LeaveGameType | JoinGameType

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
