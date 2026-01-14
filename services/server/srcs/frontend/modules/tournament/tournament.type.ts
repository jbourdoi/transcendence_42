export type TournamentPlayer = {
	id: string,
	color: string,
	alias: string
}

export type TournamentMatch = {
	playerLeft : TournamentPlayer,
	playerRight : TournamentPlayer,
	score: number[]
}

export type Tournament = {
	players: TournamentPlayer[],
	matches: TournamentMatch[],
	currentMatch : number
}
