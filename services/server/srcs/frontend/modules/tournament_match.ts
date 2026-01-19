// tournament_match.ts
import { TournamentStore } from "./tournament/tournament.store.js";
import { TournamentController } from "./tournament/tournament.controller.js";
import type { TournamentModel } from "./tournament/tournament.model.js";
import type { TournamentMatch } from "./tournament/tournament.type.js";
import { GameModel, GameView, GameController } from "../classes/OriginalPong2D.js";
import { navigate } from "../js/routing.js";

const $pageTournamentMatch = document.querySelector("page[tournament_match]")!;
const $canvas = document.querySelector("#canvas2D") as HTMLCanvasElement;

// Abonnement au store
const unsub = TournamentStore.subscribe((tournament: TournamentModel | null) => {
	if (!tournament) {
		// Aucun tournoi => retour à l'écran de sélection
		navigate("tournament_select");
		return;
	}

	// Création de l'arène et du Pong
	const gameModel = new GameModel();
	const gameView = new GameView($canvas);
	const gameController = new GameController(gameModel, gameView);

	// Pour gérer le jeu en cours
	let lastMatchIndex = -1;
	let gameStarted = false;

	const matchIndex = tournament.currentMatch;
	if (matchIndex === lastMatchIndex) return; // Même match, rien à faire

	const match: TournamentMatch | undefined = tournament.matches[matchIndex];
	if (!match) return;

	// Initialisation du Pong avec les joueurs du match
	gameModel.init(match.playerLeft.alias, match.playerRight.alias, true);
	lastMatchIndex = matchIndex;

	// Callback quand le match se termine
	gameController.setGameOver(() => {
		const score = gameController.getCurrentScore();
		const tournamentController = new TournamentController(tournament, TournamentStore);
		tournamentController.finishMatch(score);
		gameController.cleanup();
		// Naviguer vers l'arbre du tournoi
		navigate("tournament_tree");
	});

	if (!gameStarted)
	{
		gameStarted = true;
		window.onresize = gameView.resize;
		gameController.start();
	}
	gameView.resize();
	$pageTournamentMatch?.addEventListener("cleanup", () => {
		gameController.cleanup();
		unsub();
		window.removeEventListener("beforeunload", beforeunload)
	});
});

document.addEventListener("DOMContentLoaded", ()=>{
    console.log("tournament_match loaded..")
})

function beforeunload(event : any){
    console.log("tournament_match unload")
    event.preventDefault()
    window.removeEventListener("beforeunload", beforeunload)
}

window.addEventListener("beforeunload", beforeunload)
