export type InputType = {
	type: 'input',
	key: KeyType
}

export type StatusType = "chat" | "game" | "lobby"

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

export type InfoType = {
	type : 'info',
	msg : string
}

export type NavigateType = {
	type : 'navigate',
	navigate : string
}

export type CreateGameType = {
	type : 'create-game',
	gameInit : {
		comCount: number,
		playersCount: number
	}
}

export type MessageType = InputType | DuelType | AuthType | InfoType | NavigateType | CreateGameType

export type FrontType = FrontErrorType | DuelResponse

export type FrontErrorType = {
	type: 'error' | 'system',
	text: string
}

export type DuelResponse = {
	type: 'duel',
	action: 'propose' | 'decline' | 'accept'
	from: string
}
