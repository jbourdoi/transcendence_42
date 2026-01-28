import { navigate } from "../js/routing.ts"
import { GameStore } from "../stores/game.store.ts"
import { LobbyStore } from "../stores/lobby.store.ts"
import { NotificationStore } from "../stores/notification.store.ts"
import { StateStore } from "../stores/state.store.ts"
import { UserStore } from "../stores/user.store.ts"

const minPlayers: number = 2
const maxRemotePlayers: string = '8'
const maxLocalPlayers: string = '2'
const maxRemoteCom: string = '7'
const maxLocalCom: string = '1'

const $playerCountInput: HTMLInputElement = document.querySelector('player-count input')!
const $playerCountMaxValue: HTMLInputElement = document.querySelector('player-count max-value value')!
const $comCountInput: HTMLInputElement = document.querySelector('com-count input')!
const $comCountMaxValue: HTMLInputElement = document.querySelector('com-count max-value value')!
const $enableRemote: HTMLInputElement = document.querySelector('enable-remote input')!
const $errorMessageEl: HTMLElement = document.querySelector('error-message')!
const $createGame: HTMLButtonElement = document.querySelector('create-game')!

$enableRemote.addEventListener('change', evt => {
	const $isRemoteEl = evt.target as HTMLInputElement
	const isRemote = $isRemoteEl.checked

	if (isRemote) {
		$playerCountInput.setAttribute('max', maxRemotePlayers)
		$playerCountMaxValue.innerText = maxRemotePlayers
		$comCountInput.setAttribute('max', maxRemoteCom)
		$comCountMaxValue.innerText = maxRemoteCom
	} else {
		$playerCountInput.setAttribute('max', maxLocalPlayers)
		$playerCountInput.value = $playerCountInput.value > maxLocalPlayers ? maxLocalPlayers : $playerCountInput.value
		$playerCountMaxValue.innerText = maxLocalPlayers
		$comCountInput.setAttribute('max', maxLocalCom)
		$comCountInput.value = $comCountInput.value > maxLocalCom ? maxLocalCom : $comCountInput.value
		$comCountMaxValue.innerText = maxLocalCom
	}
})

$createGame.addEventListener('click', () => {
	const isRemote = $enableRemote.checked
	const playersCount = Number($playerCountInput.value)
	const comCount = Number($comCountInput.value)
	let errorMessage = ''

	$errorMessageEl.style.opacity = '0'
	setTimeout(() => {
		$errorMessageEl.innerText = errorMessage
	}, 300)

	if (isRemote)
	{
		if (comCount + playersCount < minPlayers)
		{
			errorMessage = 'Too few players/com for remote play'
		}
		else if (comCount + playersCount > Number(maxRemotePlayers))
		{
			errorMessage = 'Too many players/com for remote play'
		}
		else
		{
			GameStore.send({type: 'create-game', game : { humanCount: playersCount, botCount: comCount}})
			navigate("lobby");
		}
	}
	else
	{
		if (comCount + playersCount < minPlayers)
		{
			errorMessage = 'Too few players/com for local play'
		}
		else if (comCount + playersCount > Number(maxLocalPlayers))
		{
			errorMessage = 'Too many players/com for local play'
		}
		else
		{
			StateStore.update({createdGame: { ai:comCount === 1, pseudo1: UserStore.getUserName() || "Anonymous", pseudo2: comCount === 1?"Marvin":"Guest"}})
			NotificationStore.notify("local game created", "INFO")
			if (LobbyStore.getState().sessionId !== "")
				GameStore.send({type:"leave-game"})
			navigate("local_game");
		}
	}

	if (errorMessage != '') {
		$errorMessageEl.style.opacity = '1'
		$errorMessageEl.innerText = errorMessage
	}
})
