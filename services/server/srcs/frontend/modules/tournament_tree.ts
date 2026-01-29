import { navigate } from '../js/routing.js'
import { TournamentModel } from './tournament/tournament.model.js'
import { TournamentController } from './tournament/tournament.controller.js'
import { saveMatch } from '../functions/saveMatch.js'

const $pageTournamentTree = document.querySelector('page[type="tournament_tree"]')!
const $container = document.getElementById('tournament-tree')!

const tournament = TournamentController.getTournament()

let victoryModalShown = false

renderTournamenentTree(tournament)

function onKeyEscape(event : KeyboardEvent)
{
	if (event.key === 'Escape')
		{
			const modal = document.querySelector('.victory-modal')
			if (modal) modal.remove()
		}
}

function showVictoryModal(winnerAlias: string): void
{
	if (victoryModalShown) return
	victoryModalShown = true

	const modal = document.createElement('div')
	modal.className = 'victory-modal'
	modal.innerHTML = `
		<div class="victory-content">
			🏆<br />
			<strong>${winnerAlias}</strong><br />
			Wins the tournament!
			<br /><br />
		</div>
	`

	modal.addEventListener('click', e => {
		if (e.target === modal)
		{
			modal.remove()
		}
	})

	document.addEventListener('keydown', onKeyEscape)

	document.body.appendChild(modal)
}

function resetVictoryState(): void
{
	victoryModalShown = false
	document.body.classList.remove('tournament-won')

	document.removeEventListener("keydown", onKeyEscape)
	const modal = document.querySelector('.victory-modal')
	if (modal) modal.remove()
}

function savematchTournamentResults(tournament: TournamentModel)
{
	if (!tournament?.winner) return;

	const winner = tournament.winner.alias;
	const p1 = tournament.players[0].alias;
	const p2 = tournament.players[1].alias;
	const p3 = tournament.players[2].alias;
	const p4 = tournament.players[3].alias;

	saveMatch({matchType:'tournament', players: [
		{username:p1, gameRes: p1===winner?'win':'lose'},
		{username:p2, gameRes: p2===winner?'win':'lose'},
		{username:p3, gameRes: p3===winner?'win':'lose'},
		{username:p4, gameRes: p4===winner?'win':'lose'},
	]});
}

function renderTournamenentTree(tournament: TournamentModel | undefined)
{
	if (!tournament)
	{
		return navigate('tournament_select')
	}

	const semi1 = tournament.matches[0]
	const semi2 = tournament.matches[1]
	const final = tournament.matches[2]

	if ($container)
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
	if (tournament?.currentMatch < 3 && !tournament?.winner)
	{
		focusPlayButton()
	}


	if (tournament?.winner !== null)
	{
		savematchTournamentResults(tournament);
		document.body.classList.add('tournament-won')
		showVictoryModal(tournament.winner.alias)
		document.body.classList.add('tournament-won')
	}

}

function renderMatch(label: string, match: any, isCurrent: boolean)
{
	const scoreLeft = match?.score[0] === 0?'—':match?.score[0]
	const scoreRight = match?.score[1] === 0?'—':match?.score[1]

	if (!match)
	{
		return `
			<div class="match placeholder ${isCurrent ? 'current' : ''}">
				${label}
			</div>
		`
	}
	else
	{
		return `
			<div class="match ${isCurrent ? 'current' : ''}">
				<div class="players">
					<span>${match.playerLeft?.alias}</span>
					<strong>${scoreLeft}  :  ${scoreRight}</strong>
					<span>${match.playerRight?.alias}</span>
				</div>
			</div>
		`
	}
}

function focusPlayButton(): void
{
	const button = document.getElementById('play-match') as HTMLButtonElement | null
	if (button)
	{
		button.focus()
	}
}


function renderAction(model: TournamentModel)
{
	if (model.currentMatch >= 3)
	{
		return ``
	}

	return `
		<button id="play-match" type="button" tabindex="1">
			Play
		</button>
	`
}

function nextMatch(event: any)
{
	const target = event.target as HTMLElement
	if (target.id === 'play-match')
	{
		navigate('tournament_match')
	}
}

$container?.addEventListener('click', nextMatch)

function beforeunloadTournamentTree(event: any)
{
	event.preventDefault()
	TournamentController.reset()
}

window.addEventListener('beforeunload', beforeunloadTournamentTree)
window.addEventListener('popstate', beforeunloadTournamentTree)

/* =========================
   Cleanup SPA
========================= */

const cleanupTournamentTree = () => {
	$container?.removeEventListener('click', nextMatch)
	window.removeEventListener('beforeunload', beforeunloadTournamentTree)
	window.removeEventListener('popstate', beforeunloadTournamentTree)
	$pageTournamentTree?.removeEventListener('cleanup', cleanupTournamentTree)
	resetVictoryState()
}

$pageTournamentTree?.addEventListener('cleanup', cleanupTournamentTree)
