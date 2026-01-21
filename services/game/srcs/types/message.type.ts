import { MessageOptionType } from './messageOption.type'

export type MessageType = {
	type: MessageOptionType
	to?: string
	msg: string
}
