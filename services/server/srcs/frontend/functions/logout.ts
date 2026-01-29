import { navigate } from "../js/routing"
import { ChatStore } from "../stores/chat.store"
import { GameStore } from "../stores/game.store"
import { UserStore } from "../stores/user.store"

export async function handleLogout()
{
	await fetch('/logout', {
		method: 'POST',
		credentials: 'include'
	})
	ChatStore.removeWebsocket()
	GameStore.removeWebGameSocket()
	UserStore.clear()
	navigate('')
}