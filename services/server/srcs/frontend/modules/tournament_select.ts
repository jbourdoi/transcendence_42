import { navigate } from '../js/routing.js'
import { TournamentController } from './tournament/tournament.controller.js'
import type { TournamentPlayer } from './tournament/tournament.type.js'
import { UserStore } from '../stores/user.store'

type ValidationResult = {
	valid: boolean
	message: string
}

const limitLength = {
	min: 4,
	max: 20
}

const ENG = {
	required: 'Name is required.',
	minLength: `Minimum ${limitLength.min} characters.`,
	maxLength: `Maximum ${limitLength.max} characters.`,
	allowedChar: 'Allowed characters: A-Z, 0-9, _ and -.',
	alreadyUse: 'This name is already used.'
}

const USERNAME_REGEX = /^[A-Za-z0-9_-]+$/

function sanitize(value: string): string
{
	return value.trim()
}

function validateUsername(value: string): ValidationResult
{
	if (value === '')
	{
		return { valid: false, message: ENG.required }
	}

	if (value.length < limitLength.min) {
		return { valid: false, message: ENG.minLength }
	}

	if (value.length > limitLength.max) {
		return { valid: false, message: ENG.maxLength }
	}

	if (!USERNAME_REGEX.test(value)) {
		return {
			valid: false,
			message: ENG.allowedChar
		}
	}

	return { valid: true, message: '' }
}

const inputs = Array.from(
	document.querySelectorAll<HTMLInputElement>('input[id^="player"]')
)

const submitButton = document.getElementById('go') as HTMLButtonElement

function setInputError(input: HTMLInputElement, message: string): void
{
	const error = document.querySelector<HTMLElement>(`[data-error-for="${input.id}"]`)

	if (!error) return

	if (message)
	{
		input.classList.add('invalid')
		error.textContent = message
	}
	else
	{
		input.classList.remove('invalid')
		error.textContent = ''
	}
}

function validateAll(): boolean
{
	let isValid = true
	const values = inputs.map(i => sanitize(i.value))

	inputs.forEach((input, index) => {
		const result = validateUsername(values[index])
		setInputError(input, result.message)

		if (!result.valid)
		{
			isValid = false
		}
	})

	const duplicates = values.filter((v, i) => values.indexOf(v) !== i)

	if (duplicates.length > 0)
	{
		inputs.forEach((input, index) => {
			if (duplicates.includes(values[index]))
			{
				setInputError(input, ENG.alreadyUse)
			}
		})
		isValid = false
	}

	submitButton.disabled = !isValid
	return isValid
}

inputs.forEach(input => {input.addEventListener('input', validateAll)})

function submitTournament(event : PointerEvent | undefined = undefined)
{
	event?.preventDefault()
	
	if (!validateAll()) return
	
	const aliases = inputs.map(i => sanitize(i.value))
	
	const players: TournamentPlayer[] = shuffle([
		{ id: 'player1', color: 'red', alias: aliases[0] },
		{ id: 'player2', color: 'blue', alias: aliases[1] },
		{ id: 'player3', color: 'green', alias: aliases[2] },
		{ id: 'player4', color: 'purple', alias: aliases[3] }
	])
	
	TournamentController.start(players)
	navigate('tournament_tree')

}

submitButton.addEventListener('click', submitTournament)
submitButton.focus()
submitTournament()

const $pageTournamentSelect = document.querySelector('page[type=tournament_select]')!

const unsubUserStore = UserStore.subscribe(user => {
	if (user.isValid) {
		inputs[0].value = user.username
		inputs[0].setAttribute('disabled', 'true')
	}
})

function shuffle<T>(array: T[]): T[] {
	const result = [...array]

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[result[i], result[j]] = [result[j], result[i]]
	}
	return result
}

/* =========================
   Cleanup SPA
========================= */

const cleanupTournamentSelect = () => {
	$pageTournamentSelect.removeEventListener('cleanup', cleanupTournamentSelect)
	inputs.forEach(input => {input.removeEventListener('input', validateAll)})
	submitButton.removeEventListener('click', submitTournament)
	unsubUserStore()
}

$pageTournamentSelect.addEventListener('cleanup', cleanupTournamentSelect)
