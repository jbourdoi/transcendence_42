import { GameModel, GameView, GameController } from "../classes/OriginalPong2D.ts";
import { CreatedLocalGame, StateStore } from "../stores/state.store.ts";

const $pageLocalGame = document.querySelector("page[type=local_game]")!;
const $canvas = document.querySelector("#canvas2D") as HTMLCanvasElement
const createdGame : CreatedLocalGame = StateStore.getCreatedGame()
const model = new GameModel();
if (createdGame)
{
    model.init(createdGame?.pseudo1, createdGame?.pseudo2, false);
}
else
{
    model.init()
}
const view = new GameView($canvas);
const aiActivated = createdGame?.ai || false
const controller = new GameController(model, view, aiActivated);

view.resize();
view.render(model)

function popUpDefault(event : any)
{
    event.preventDefault()
}

window.addEventListener("beforeunload", popUpDefault)
window.addEventListener("popstate", popUpDefault);

/* =========================
   Cleanup SPA
========================= */

const cleanupLocalGame = () => {
    view.destroy()
    controller.destroy()
    window.removeEventListener("beforeunload", popUpDefault)
    window.removeEventListener("popstate", popUpDefault)
    $pageLocalGame.removeEventListener("cleanup", cleanupLocalGame)
}

$pageLocalGame.addEventListener("cleanup", cleanupLocalGame);

