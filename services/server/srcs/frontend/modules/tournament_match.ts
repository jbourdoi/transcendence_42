import { TournamentController } from "./tournament/tournament.controller.js";
import type { TournamentMatch } from "./tournament/tournament.type.js";
import { GameModel, GameView, GameController } from "../classes/OriginalPong2D.js";
import { navigate } from "../js/routing.js";

const $pageTournamentMatch = document.querySelector("page[type=tournament_match]")!;
const $canvas = document.querySelector("#canvas2D") as HTMLCanvasElement;
const gameModel = new GameModel();
const gameView = new GameView($canvas);
const gameController = new GameController(gameModel, gameView, false);

const match = TournamentController.getCurrentMatch()

playMatch(match);

function playMatch(match : TournamentMatch | undefined)
{
	if (!match)
	{
		return navigate("tournament_select");
	}

	gameModel.init(match.playerLeft.alias, match.playerRight.alias, true);

	gameController.setGameOver(() => {
		const score = gameController.getCurrentScore();
		TournamentController.finishMatch(score);
		gameController.destroy();
		setTimeout(()=>{
			navigate("tournament_tree");
		}, 1500)
	});

	window.onresize = gameView.resize;
	gameController.start();
	gameView.resize();
}
function beforeunloadTournamentMatch(event : any)
{
	event.preventDefault();
	TournamentController.reset();
}

window.addEventListener("beforeunload", beforeunloadTournamentMatch)
window.addEventListener("popstate", beforeunloadTournamentMatch);

/* =========================
Cleanup SPA
========================= */

const cleanupTournamentMatch = () => {
	gameController.destroy();
	window.removeEventListener("beforeunload", beforeunloadTournamentMatch);
	window.removeEventListener("popstate", beforeunloadTournamentMatch);
	$pageTournamentMatch.removeEventListener("cleanup", cleanupTournamentMatch);
}

$pageTournamentMatch.addEventListener("cleanup", cleanupTournamentMatch);
