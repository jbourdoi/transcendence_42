export type RuleType = {
	id: number
	name: string
	targets: TargetType[]
	regex: string
}

export type TargetType = 'ARGS_NAMES' | 'ARGS' | 'REQUEST_BODY' | 'REQUEST_COOKIES' | 'REQUEST_COOKIES_NAMES'
