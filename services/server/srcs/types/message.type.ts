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

// export type MessageType = ChatType | MpType | InputType | DuelType

// export type FrontType = FrontErrorType | FrontChatType | FrontMpTypeFrom | FrontMpTypeTo | DuelResponse

// export type FrontErrorType = {
// 	type: 'error' | 'system',
// 	text: string
// }

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

// export type DuelResponse = {
// 	type: 'duel',
// 	action: 'propose' | 'decline' | 'accept'
// 	from: string
// }

// import { MessageOptionType } from './messageOption.type'

// export type MessageType = {
// 	type: MessageOptionType
// 	to?: string
// 	msg: string
// }

// export type InputType = {
// 	type: 'input',
// 	key: KeyType
// }

// export type StatusType = "chat" | "game"

// export type KeyType = "none" | "+" | "-" | "space" | "chatGPT"

// export type DuelType = {
// 	type: 'duel',
// 	to: string,
// 	action: 'propose' | 'accept' | 'decline'
// }

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
	type: 'error' | 'system' | 'start-game'
	text: string
}

export type DuelResponse = {
	type: 'duel',
	action: 'propose' | 'decline' | 'accept'
	from: string
}
