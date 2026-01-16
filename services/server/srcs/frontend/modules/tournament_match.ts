// tournament_match.ts
import { TournamentStore } from "./tournament/tournament.store.js";
import { TournamentController } from "./tournament/tournament.controller.js";
import type { TournamentModel } from "./tournament/tournament.model.js";
import type { TournamentMatch } from "./tournament/tournament.type.js";
import { Arena, GameModel, GameView, GameController } from "./local_game.js";
import { navigate } from "../js/routing.js";

const $page = document.querySelector("page[type=tournament_match]")!;
const $canvas = document.querySelector("#canvas2D") as HTMLCanvasElement;
const ctx = $canvas.getContext("2d")!;
document.body.style.margin = "0";

// Création de l'arène et du Pong
const arena = new Arena();
const gameModel = new GameModel(arena);
const gameView = new GameView(ctx);
const gameController = new GameController(gameModel, gameView);

// Pour gérer le jeu en cours
let lastMatchIndex = -1;
let gameStarted = false;

// Abonnement au store
const unsub = TournamentStore.subscribe((tournament: TournamentModel | null) => {
	if (!tournament) {
		// Aucun tournoi => retour à l'écran de sélection
		navigate("tournament_select");
		return;
	}

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
		const controller = new TournamentController(tournament, TournamentStore);
		controller.finishMatch(score);

		// Naviguer vers l'arbre du tournoi
		navigate("tournament_tree");
	});

	if (!gameStarted) {
		gameStarted = true;
		window.addEventListener("resize", resize);
		requestAnimationFrame((t) => gameController.start(t));
	}
	resize();
});

// Nettoyage lors du changement de page SPA
$page.addEventListener("cleanup", () => {
	unsub();
	window.removeEventListener("resize", resize);
});

// Mise à l'échelle du canvas
function resize() {
	const w = Math.max(arena.minPixelWidth, window.innerWidth);
	const h = Math.max(arena.minPixelHeight, window.innerHeight);
	const targetRatio = 16 / 9;
	let width = w;
	let height = w / targetRatio;
	if (height > h) {
		height = h;
		width = h * targetRatio;
	}
	$canvas.width = width / 2;
	$canvas.height = height / 2;

	gameView.resize($canvas, gameModel);
}
