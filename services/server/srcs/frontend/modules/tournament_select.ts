import { navigate } from "../js/routing.js";
import { TournamentController } from "./tournament/tournament.controller.js";
import type { TournamentPlayer } from "./tournament/tournament.type.js";

const $pageTournamentSelect = document.querySelector("page[type=tournament_select]")!
const $username1 = document.getElementById("username1") as HTMLInputElement;
const $username2 = document.getElementById("username2") as HTMLInputElement;
const $username3 = document.getElementById("username3") as HTMLInputElement;
const $username4 = document.getElementById("username4") as HTMLInputElement;

document.querySelector("#go")?.addEventListener("click", (e) => {
	e.preventDefault();

	const players: TournamentPlayer[] = shuffle([
		{ id: "player1", color: "red",    alias: $username1.value },
		{ id: "player2", color: "blue",   alias: $username2.value },
		{ id: "player3", color: "green",  alias: $username3.value },
		{ id: "player4", color: "purple", alias: $username4.value }
	]);
	TournamentController.start(players);
	navigate("tournament_tree");
});

function shuffle<T>(array: T[]): T[] {
	const result = [...array];

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/* =========================
   Cleanup SPA
========================= */

const cleanupTournamentSelect = () => {
	$pageTournamentSelect.removeEventListener("cleanup", cleanupTournamentSelect)
}

$pageTournamentSelect.addEventListener("cleanup", cleanupTournamentSelect)
