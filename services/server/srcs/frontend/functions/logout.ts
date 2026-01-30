import { navigate } from "../js/routing"
import { ChatStore } from "../stores/chat.store"
import { GameStore } from "../stores/game.store"
import { LobbyStore } from "../stores/lobby.store"
import { UserStore } from "../stores/user.store"

export function clearUserState()
{
	GameStore.removeWebGameSocket()
	ChatStore.removeWebsocket()
	UserStore.clear()
	LobbyStore.clear()
	navigate('')
}

export async function handleLogout()
{
	await fetch('/logout', {
		method: 'POST',
		credentials: 'include'
	})
	window.location.reload()
}
