import { GameModel, GameView, GameController } from "../classes/OriginalPong2D.ts";

const $pageLocalGame = document.querySelector("page[local_game]")!;
const $canvas = document.querySelector("#canvas2D") as HTMLCanvasElement
const model = new GameModel();
model.init();
const view = new GameView($canvas);
const controller = new GameController(model, view);

window.onresize = view.resize
view.resize();
console.log("view: ", view)
console.log("model: ", model)
view.render(model)

document.addEventListener("DOMContentLoaded", ()=>{
    console.log("local_game loaded..")
})

function beforeunload(event : any){
    console.log("local_game unload")
    event.preventDefault()
    window.removeEventListener("beforeunload", beforeunload)
}

window.addEventListener("beforeunload", beforeunload)

$pageLocalGame?.addEventListener("cleanup", () => {
    controller.cleanup();
    window.removeEventListener("beforeunload", beforeunload)
});
