import type { TournamentModel } from "./tournament.model.ts";
import type { TournamentPlayer } from "./tournament.type.ts";
import { TournamentStore } from "./tournament.store.ts";

export class TournamentController
{
	constructor(
		private model: TournamentModel,
		private store: typeof TournamentStore
	) {}

	start(players: TournamentPlayer[])
	{
		this.model.players = players;
		this.model.init();
		this.sync();
	}

	finishMatch(score: number[])
	{
		this.model.setScore(score);
		this.model.nextMatch();
		this.sync();
	}

	private sync()
	{
		this.store.update(this.model);
	}
}
