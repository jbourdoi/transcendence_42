import type { TournamentMatch, TournamentPlayer } from "./tournament.type.ts";
import { TournamentStore } from "./tournament.store.ts";
import { TournamentModel } from "./tournament.model.ts";
import { NotificationStore } from "../../stores/notification.store.ts";

export class TournamentController
{
	static start(players: TournamentPlayer[])
	{
		const tournament = TournamentStore.get();
		tournament.players = players;
		tournament.init();
		TournamentStore.update(tournament);
	}

	static finishMatch(score: number[])
	{
		const tournament = TournamentStore.get();
		tournament.setScore(score);
		tournament.nextMatch();
		TournamentStore.update(tournament);
	}

	static getCurrentMatch() : TournamentMatch | undefined
	{
		const tournament = TournamentStore.get();
		if (tournament.matches.length === 0)
			return undefined;
		return tournament.getCurrentMatch();
	}

	static getTournament() : TournamentModel | undefined
	{
		const tournament = TournamentStore.get();
		if (tournament.matches.length === 0)
			return undefined;
		return tournament;
	}

	static reset()
	{
		NotificationStore.notify("Tournament RESET", "INFO");
		TournamentStore.reset();
	}
}
