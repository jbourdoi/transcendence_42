import { TournamentController } from "./tournament/tournament.controller.js";
import type { TournamentMatch } from "./tournament/tournament.type.js";
import { GameModel, GameView, GameController } from "../classes/OriginalPong2D.js";
import { navigate } from "../js/routing.js";
import { GameStore } from "../stores/game.store.js";

const $pageTournamentMatch = document.querySelector("page[type=tournament_match]")!;
const $canvas = document.querySelector("#canvas2D") as HTMLCanvasElement;
const gameModel = new GameModel();
const gameView = new GameView($canvas);
const gameController = new GameController(gameModel, gameView, false);

GameStore.send({type:"navigate", navigate:"tournament"})

if (!$canvas) await onBackNavigation()

const match = TournamentController?.getCurrentMatch()

await playMatch(match);

async function playMatch(match : TournamentMatch | undefined)
{
	if (!match)
	{
		return await navigate("lobby");
	}

	gameModel?.init(match.playerLeft.alias, match.playerRight.alias, true);

	gameController?.setGameOver(() => {
		const score = gameController?.getCurrentScore();
		TournamentController?.finishMatch(score);
		setTimeout(async ()=>{
			await navigate("tournament_tree");
		}, 1500)
	});
	gameView?.render(gameModel)
	gameView?.resize()
}

/* =========================
Cleanup SPA
========================= */

function beforeunload(event: BeforeUnloadEvent)
{
	event.preventDefault()
	event.returnValue = ""
}

async function onBackNavigation()
{
	TournamentController?.reset()
}

window.addEventListener("beforeunload", beforeunload)
window.addEventListener("popstate", onBackNavigation)

const cleanupTournamentMatch = () => {
	gameView?.destroy()
	gameController?.destroy()
	window.removeEventListener("beforeunload", beforeunload)
	window.removeEventListener("popstate", onBackNavigation)
	$pageTournamentMatch?.removeEventListener("cleanup", cleanupTournamentMatch)
}

$pageTournamentMatch?.addEventListener("cleanup", cleanupTournamentMatch)
