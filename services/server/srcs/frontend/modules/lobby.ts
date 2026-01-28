import { GamePending } from "../../types/message.type.ts"
import { GameStore } from "../stores/game.store.ts"
import { LobbyDuel, LobbyStore } from "../stores/lobby.store.ts"

const $pageLobby : Element | null = document.querySelector("page[type=lobby]")!
const $gameList : HTMLElement | null = document.querySelector("#game-list")
const $duelsDiv : HTMLElement | null = document.getElementById("game-duels")

const refreshGamePendings = (gamePendings : GamePending[], sessionId : string)=>
{
	if (!$gameList) return;
	$gameList.innerHTML = ""
	for (const game of gamePendings)
	{
		const row = document.createElement("div")
		row.textContent = `Game ( ${game.nbPlayerReady} / ${game.nbPlayerMax} )`
		const action = document.createElement("button")
		if (sessionId === game.id)
		{
			action.textContent = "leave"
			action.className = "leave-game"
			action.onclick = ()=>{ GameStore.send({type: "leave-game"})}
		}
		if (sessionId === "")
		{
			action.textContent = "join"
			action.className = "join-game"
			action.onclick = () => { GameStore.send({type: "join-game", sessionId: game.id }); }
		}
		row.appendChild(action)
		$gameList.appendChild(row)
	}
}
				
const refreshDuels = (duels: LobbyDuel[]) =>
{
	if (!$duelsDiv) return;
	$duelsDiv.innerHTML = ""
	for (const duel of duels)
	{
		const row = document.createElement("div")
		row.textContent = `${duel.from} wants to duel you`
		const accept = document.createElement("button")
		accept.textContent = "Accept"
		accept.className = "accept"
		accept.onclick = () =>
		{
			GameStore.send({ type: 'duel', to: duel.from, action: 'accept' });
		}
		const decline = document.createElement("button")
		decline.textContent = "Decline"
		decline.className = "decline"
		decline.onclick = () =>
		{
			GameStore.send({ type: 'duel', to: duel.from, action: 'decline' })
		}
		row.appendChild(accept)
		row.appendChild(decline)
		$duelsDiv.appendChild(row)
	}
}

const state = LobbyStore.getState();
refreshGamePendings(state.gamePendings, state.sessionId);
refreshDuels(state.duels);

const unsubscribeGamePendings = LobbyStore.subscribe(({ gamePendings, sessionId }) => { refreshGamePendings(gamePendings, sessionId)})
const unsubcribeLobbyDuels = LobbyStore.subscribe(({ duels }) => { refreshDuels(duels)} )

const cleanupLobbyPage = () =>
{
	unsubscribeGamePendings();
	unsubcribeLobbyDuels();
	$pageLobby?.removeEventListener("cleanup", cleanupLobbyPage);
}

$pageLobby?.addEventListener("cleanup", cleanupLobbyPage);


