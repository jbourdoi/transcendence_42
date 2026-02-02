import { GameStore } from '../stores/game.store'
import { StateStore } from '../stores/state.store'
import { UserStore } from '../stores/user.store'

GameStore.send({ type: 'navigate', navigate: 'profile' })
const $page: HTMLElement = document.querySelector('page[type=profile]')!
const $pageTitle: HTMLElement = document.querySelector('page-title')!
const $profileStats: HTMLElement = document.querySelector('profile-stats')!
const $tableData: HTMLElement = document.querySelector('profile-history table tbody')!
const $winStat: HTMLElement = $profileStats?.querySelector('user-wins stat-value')!
const $ratioStat: HTMLElement = $profileStats?.querySelector('user-ratio stat-value')!
const $lossesStat: HTMLElement = $profileStats?.querySelector('user-losses stat-value')!


const unsubStateStore = StateStore.subscribe(async data => {

	if (!$pageTitle) return;
	let selectedProfile = data.selectedProfile
	if (selectedProfile === undefined) selectedProfile = UserStore.getUserName()

	document.title = `${selectedProfile} Profile`
	$pageTitle.innerText = selectedProfile

	fetch(`https://${location.host}/user_profile`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ name: selectedProfile })
	})
		.then(res => {
			if (res.status >= 400) return
			return res.json()
		})
		.then(res => {
			if (res) {
				setWinLoss(res, selectedProfile)
				setMatches(res)
			}
		})
})

type MatchType = {
	created_at: string
	match_id: number
	players: string
	type: 'tournament' | 'classic' | 'duel'
	winner: string
}

function setWinLoss(matches: MatchType[], username: string) {
	if (!$winStat) return;
	let win: number = matches.reduce((total: number, current: MatchType) => {
		return total + (current.winner === username ? 1 : 0)
	}, 0)

	const loss = matches.length - win
	let ratio = Math.round((100 / (win + loss)) * win)
	if (isNaN(ratio)) ratio = 0
	$winStat.innerText = '' + win
	$lossesStat.innerText = '' + loss
	$ratioStat.innerText = ratio + '%'
}

function setMatches(matches: MatchType[]) {
	if (!$tableData) return;
	$tableData.innerHTML = ''
	matches.forEach(match => {
		const $trEl = document.createElement('tr')
		const $tdDate = document.createElement('td')
		const $tdType = document.createElement('td')
		const $tdWinner = document.createElement('td')
		const $selectEl = document.createElement('select')

		const $tdOption = document.createElement('option')
		$tdOption.innerText = String(match.players.split(',').length)
		$selectEl.appendChild($tdOption)
		match.players.split(',').forEach(player => {
			const $tdOption = document.createElement('option')
			$tdOption.innerText = player
			$tdOption.disabled = true
			$selectEl.appendChild($tdOption)
		})

		$tdDate.innerText = match.created_at
		$tdType.innerText = match.type
		$tdWinner.innerText = match.winner

		$trEl.append($tdDate)
		$trEl.append($tdType)
		$trEl.append($selectEl)
		$trEl.append($tdWinner)

		$tableData.append($trEl)
	})
}

const cleanPage = () => {
	unsubStateStore()
	$page?.removeEventListener('cleanup', cleanPage)
}

$page?.addEventListener('cleanup', cleanPage)
