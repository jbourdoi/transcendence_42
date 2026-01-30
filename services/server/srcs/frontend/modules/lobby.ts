import { GamePending } from "../../types/message.type.ts"
import { GameStore } from "../stores/game.store.ts"
import { LobbyDuel, LobbyStore } from "../stores/lobby.store.ts"
import { UserStore } from "../stores/user.store.ts"

const $gameList : HTMLElement | null = document.querySelector("#game-list")
const $duelsDiv : HTMLElement | null = document.getElementById("game-duels")
const $pageLobby : Element | null = document.querySelector("page[type=lobby]")!

GameStore.send({type:"navigate", navigate:"lobby"})

const unsubscribeUserStore = UserStore.subscribe(({ isValid })=>{
	const $lobbyContainer = document.querySelector("lobby-container")
	if ($lobbyContainer && isValid)
	{
		$lobbyContainer.classList.remove("hidden");
	}
})

const refreshGamePendings = (gamePendings: GamePending[], sessionId: string) => {
	if (!$gameList) return;
	$gameList.innerHTML = ""
	for (const game of gamePendings) {
		const row = document.createElement("div")

		/* label */
		const label = document.createElement("span")
		label.className = "game-label"

		// Compteur joueurs
		const slots = document.createElement("span")
		slots.className = "game-slots"
		slots.textContent = `${game.nbPlayerReady}/${game.nbPlayerMax}`
		label.appendChild(document.createTextNode("Game "))
		label.appendChild(slots)

		// Liste des utilisateurs, chaque pseudo dans un span avec dataset
		const usersContainer = document.createElement("span")
		usersContainer.className = "game-users"

		game.users.forEach(u => {
			const userSpan = document.createElement("span")
			userSpan.className = "game-user"
			userSpan.textContent = u.slice(0, 8) // limite à 8 caractères
			userSpan.dataset.user = u // 🔥 on stocke le pseudo complet
			usersContainer.appendChild(userSpan)
			usersContainer.appendChild(document.createTextNode(" ")) // petit espace entre pseudos
		})

		label.appendChild(usersContainer)

		/* actions */
		const actions = document.createElement("div")
		actions.className = "row-actions"

		const action = document.createElement("button")

		if (sessionId === game.id) {
			row.classList.add("game-current")
			action.textContent = "Leave"
			action.className = "leave-game"
			action.onclick = () => {
				GameStore.send({ type: "leave-game" })
			}
		} else if (sessionId === "") {
			action.textContent = "Join"
			action.className = "join-game"
			action.onclick = () => {
				GameStore.send({ type: "join-game", sessionId: game.id })
			}
		}

		actions.appendChild(action)
		row.appendChild(label)
		row.appendChild(actions)

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

		const label = document.createElement("span")
		label.className = "duel-label"
		label.textContent = `${duel.from} wants to duel you`

		const actions = document.createElement("div")
		actions.className = "row-actions"

		const accept = document.createElement("button")
		accept.textContent = "Accept"
		accept.className = "accept"
		accept.onclick = () => {
			GameStore.send({ type: "leave-game" })
			GameStore.send({ type: 'duel', to: duel.from, action: 'accept' });
		}

		const decline = document.createElement("button")
		decline.textContent = "Decline"
		decline.className = "decline"
		decline.onclick = () => {
			GameStore.send({ type: 'duel', to: duel.from, action: 'decline' })
		}

		actions.appendChild(accept)
		actions.appendChild(decline)

		row.appendChild(label)
		row.appendChild(actions)

		$duelsDiv.appendChild(row)
	}
}

const state = LobbyStore.getState();
refreshGamePendings(state.gamePendings, state.sessionId);
refreshDuels(state.duels);

const unsubscribeGamePendings = LobbyStore.subscribe(({ gamePendings, sessionId }) => {refreshGamePendings(gamePendings, sessionId)})
const unsubcribeLobbyDuels = LobbyStore.subscribe(({ duels }) => {refreshDuels(duels)})

const cleanupLobbyPage = () =>
{
	unsubscribeGamePendings()
	unsubcribeLobbyDuels()
	unsubscribeUserStore()
	$pageLobby?.removeEventListener("cleanup", cleanupLobbyPage)
}

$pageLobby?.addEventListener("cleanup", cleanupLobbyPage)


