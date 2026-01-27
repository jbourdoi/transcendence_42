import { navigate } from '../js/routing.js'
import { TournamentModel } from './tournament/tournament.model.js'
import { TournamentController } from './tournament/tournament.controller.js'
import { NotificationStore } from '../stores/notification.store.js'

const $pageTournamentTree = document.querySelector('page[type="tournament_tree"]')!
const $container = document.getElementById('tournament-tree')!

const tournament = TournamentController.getTournament()

renderTournamenentTree(tournament)

function renderTournamenentTree(tournament: TournamentModel | undefined) {
	if (!tournament) {
		return navigate('tournament_select')
	}

	const semi1 = tournament.matches[0]
	const semi2 = tournament.matches[1]
	const final = tournament.matches[2]

	console.log(tournament.winner)

	$container.innerHTML = `
		<div class="tournament">

			<div class="round">
				<h3>Semi-final</h3>

				${renderMatch('First semi-final', semi1, tournament.currentMatch === 0)}
				${renderMatch('Second semi-final', semi2, tournament.currentMatch === 1)}
			</div>

			<div class="round">
				<h3>Final</h3>

				${renderMatch('Final', final, tournament.currentMatch === 2)}
			</div>

			<div class="round">
				<h3>Winner</h3>
				<div class="winner ${tournament.winner !== null ? 'winner-final' : ''}">
					${tournament.winner === null ? '—' : tournament.winner.alias}
				</div>
			</div>

			<div class="actions">
				${renderAction(tournament)}
			</div>

		</div>
	`
}

function renderMatch(label: string, match: any, isCurrent: boolean) {
	if (!match) {
		return `
			<div class="match placeholder ${isCurrent ? 'current' : ''}">
				${label}
			</div>
		`
	}

	return `
		<div class="match ${isCurrent ? 'current' : ''}">
			<div class="players">
				<span>${match.playerLeft?.alias}</span>
				<strong>${match.score[0]} : ${match.score[1]}</strong>
				<span>${match.playerRight?.alias}</span>
			</div>
		</div>
	`
}

function renderAction(model: TournamentModel) {
	if (model.currentMatch >= 3) {
		return ``
	}

	return `
		<button id="play-match">
			Play
		</button>
	`
}

function nextMatch(event: any) {
	const target = event.target as HTMLElement
	if (target.id === 'play-match') {
		navigate('tournament_match')
	}
}

$container.addEventListener('click', nextMatch)

function beforeunloadTournamentTree(event: any) {
	event.preventDefault()
	TournamentController.reset()
}

window.addEventListener('beforeunload', beforeunloadTournamentTree)
window.addEventListener('popstate', beforeunloadTournamentTree)

/* =========================
   Cleanup SPA
========================= */

const cleanupTournamentTree = () => {
	$container.removeEventListener('click', nextMatch)
	window.removeEventListener('beforeunload', beforeunloadTournamentTree)
	window.removeEventListener('popstate', beforeunloadTournamentTree)
	$pageTournamentTree.removeEventListener('cleanup', cleanupTournamentTree)
}

$pageTournamentTree.addEventListener('cleanup', cleanupTournamentTree)
