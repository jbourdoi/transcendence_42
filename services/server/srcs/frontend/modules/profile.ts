import { StateStore } from '../stores/state.store'
import { UserStore } from '../stores/user.store'

const $page: HTMLElement = document.querySelector('page[type=profile]')!
const $pageTitle: HTMLElement = document.querySelector('page-title')!
const $profileStats: HTMLElement = document.querySelector('profile-stats')!
const $tableData: HTMLElement = document.querySelector('profile-history table tbody')!
const $winStat: HTMLElement = $profileStats.querySelector('user-wins stat-value')!
const $ratioStat: HTMLElement = $profileStats.querySelector('user-ratio stat-value')!
const $lossesStat: HTMLElement = $profileStats.querySelector('user-losses stat-value')!

const unsubStateStore = StateStore.subscribe(async data => {
	let selectedProfile = data.selectedProfile
	if (selectedProfile === undefined) selectedProfile = UserStore.getUserName()

	document.title = `${selectedProfile} Profile`
	$pageTitle.innerText = selectedProfile

	fetch(`https://${location.host}:443/user_profile`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ name: selectedProfile })
	})
		.then(res => {
			if (res.status >= 400) return console.log('ERROR updating profile', res.status)
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
	let win: number = matches.reduce((total: number, current: MatchType) => {
		return total + (current.winner === username ? 1 : 0)
	}, 0)

	const loss = matches.length - win
	const ratio = Math.round((100 / (win + loss)) * win)
	$winStat.innerText = '' + win
	$lossesStat.innerText = '' + loss
	$ratioStat.innerText = ratio + '%'
}

function setMatches(matches: MatchType[]) {
	$tableData.innerHTML = ''
	matches.forEach(match => {
		const $trEl = document.createElement('tr')
		const $tdDate = document.createElement('td')
		const $tdType = document.createElement('td')
		const $tdPlayers = document.createElement('td')
		const $tdWinner = document.createElement('td')

		$tdDate.innerText = match.created_at
		$tdType.innerText = match.type
		$tdPlayers.innerText = match.players
		$tdWinner.innerText = match.winner

		$trEl.append($tdDate)
		$trEl.append($tdType)
		$trEl.append($tdPlayers)
		$trEl.append($tdWinner)

		$tableData.append($trEl)
	})
}

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubStateStore()
}

$page.addEventListener('cleanup', cleanPage)
