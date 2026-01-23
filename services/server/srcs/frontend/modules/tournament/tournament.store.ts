import { TournamentModel } from "./tournament.model.ts";

export class TournamentStore
{
	private static tournament: TournamentModel = new TournamentModel([]);

	static update(tournament: TournamentModel): void
	{
		this.tournament = tournament;
	}

	static get(): TournamentModel
	{
		return this.tournament;
	}

	static reset(): void
	{
		this.tournament = new TournamentModel([]);
	}
}
