import { TournamentPlayer, TournamentMatch } from "./tournament.type.ts";

export class TournamentModel
{
	constructor(
		public players: TournamentPlayer[],
		public matches: TournamentMatch[] = [],
		public currentMatch = 0
	) {}

	init(): void
	{
		this.matches = [
			{ playerLeft: this.players[0], playerRight: this.players[1], score: [0,0] },
			{ playerLeft: this.players[2], playerRight: this.players[3], score: [0,0] }
		];
		this.currentMatch = 0;
	}

	setScore(score: number[]): void
	{
		this.matches[this.currentMatch].score = score;
	}

	nextMatch(): void
	{
		this.currentMatch++;

		if (this.currentMatch === 2) {
			this.matches[2] = this.createFinal();
		}
	}

	createFinal(): TournamentMatch
	{
		const win = (m: TournamentMatch) =>
			m.score[0] > m.score[1] ? m.playerLeft : m.playerRight;

		return {
			playerLeft: win(this.matches[0]),
			playerRight: win(this.matches[1]),
			score: [0,0]
		};
	}

	get winner(): TournamentPlayer | null
	{
		if (this.currentMatch < 3) return null;
		const final = this.matches[2];
		return final.score[0] > final.score[1]
			? final.playerLeft
			: final.playerRight;
	}
}
