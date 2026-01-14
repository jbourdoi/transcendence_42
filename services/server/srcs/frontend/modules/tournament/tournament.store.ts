import type { TournamentModel } from "./tournament.model.ts";

/**
 * Store observable minimaliste pour le tournoi
 * - aucune logique métier
 * - une seule source de vérité
 */
type Subscriber = (tournament: TournamentModel | null) => void;

export class TournamentStore
{
	private static tournament: TournamentModel | null = null;
	private static subscribers = new Set<Subscriber>();

	/**
	 * S'abonner aux changements du tournoi
	 * Retourne une fonction unsubscribe
	 */
	static subscribe(fn: Subscriber): () => void {
		this.subscribers.add(fn);

		// émission immédiate (pattern store classique)
		fn(this.tournament);

		return () => {
			this.subscribers.delete(fn);
		};
	}

	/**
	 * Mise à jour du tournoi (appelée UNIQUEMENT par le controller)
	 */
	static update(tournament: TournamentModel): void
	{
		this.tournament = tournament;
		this.emit();
	}

	/**
	 * Accès synchrone (utile hors cycle UI)
	 */
	static get(): TournamentModel | null
	{
		return this.tournament;
	}

	/**
	 * Reset complet (optionnel mais utile)
	 */
	static reset(): void {
		this.tournament = null;
		this.emit();
	}

	private static emit(): void
	{
		for (const sub of this.subscribers)
		{
			if (this.tournament)
				sub(this.tournament);
		}
	}
}


/*
type Subscriber = (config: any) => void

import type { Tournament } from "./tournament.type.ts"

let tournament : Tournament = {
	players:[], // id, color, alias
	matches:[], // 2 players, score; of each match
	currentMatch: 0
}

function createTournamentStore() {
	const subscribers = new Set<Subscriber>()

	function subscribe(fn: Subscriber) {
		subscribers.add(fn)
		fn(tournament)
		return () => subscribers.delete(fn)
	}

	function emit(tournament: any) {
		for (const fn of subscribers) fn(tournament)
	}

	function update(newTournament: any) {

		tournament = newTournament
		for (const fn of subscribers) fn(tournament)
	}

	return { subscribe, emit, update }
}

declare global {
	interface Window {
		TournamentStore?: ReturnType<typeof createTournamentStore>
	}
}

export const TournamentStore = (window.TournamentStore ??= createTournamentStore())
*/
