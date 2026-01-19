import { MessageOptionType } from "./messageOption.type"

export type SocketDataType = {
	username:string
	msg:string
	to: string
	type:MessageOptionType
}
