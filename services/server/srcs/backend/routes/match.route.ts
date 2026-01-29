import { dbPostQuery } from '../services/db.service.js'
import { FastifyReply, FastifyRequest } from 'fastify'
import httpErrors from 'http-errors'

const USERNAME_LIMIT = {
	min: 4,
	max: 20
}

const USERNAME_REGEX = /^[A-Za-z0-9_]+$/

type MatchTypeToSave = {
	matchType: 'tournament' | 'classic' | 'duel'
	players: { username: string; gameRes: 'win' | 'lose' }[]
}

function sanitizeUsername(value: unknown): string {
	if (typeof value !== 'string') {
		throw httpErrors(400, 'username must be a string')
	}
	return value.trim()
}

function validateUsername(username: string): void {
	if (username === '') {
		throw httpErrors(400, 'username is required')
	}

	if (username.length < USERNAME_LIMIT.min) {
		throw httpErrors(400, `username too short (min ${USERNAME_LIMIT.min})`)
	}

	if (username.length > USERNAME_LIMIT.max) {
		throw httpErrors(400, `username too long (max ${USERNAME_LIMIT.max})`)
	}

	if (!USERNAME_REGEX.test(username)) {
		throw httpErrors(400, 'username contains invalid characters')
	}
}

function validatePlayers(players: MatchTypeToSave['players']): void {
	const usernames: string[] = []

	for (const player of players) {
		if (typeof player !== 'object' || player === null) {
			throw httpErrors(400, 'invalid player object')
		}

		const username = sanitizeUsername(player.username)
		validateUsername(username)

		if (player.gameRes !== 'win' && player.gameRes !== 'lose') {
			throw httpErrors(400, 'invalid gameRes value')
		}

		usernames.push(username)
	}

	const unique = new Set(usernames)
	if (unique.size !== usernames.length) {
		throw httpErrors(400, 'duplicate usernames detected')
	}
}

export async function addMatch(req: FastifyRequest, reply: FastifyReply) {
	const { matchType, players } = req.body as MatchTypeToSave

	if (!matchType || !players) {
		throw httpErrors(400, 'wrong format MatchTypeToSave')
	}

	if (!Array.isArray(players)) {
		throw httpErrors(400, 'players must be an array')
	}

	if (players.length < 2 || players.length > 8) {
		throw httpErrors(400, 'too few or too many players')
	}

	validatePlayers(players)

	const matchRes = await dbPostQuery({
		endpoint: 'dbRun',
		query: {
			verb: 'create',
			sql: 'INSERT INTO matches (type) VALUES (?)',
			data: [matchType]
		}
	})
	if (matchRes.status >= 400) throw httpErrors(matchRes.status, matchRes.message)

	for (const player of players) {
		const playersRes = await dbPostQuery({
			endpoint: 'dbRun',
			query: {
				verb: 'create',
				sql: 'INSERT INTO match_players (match_id, username, result) VALUES (?, ?, ?)',
				data: [matchRes.data.lastID, player.username, player.gameRes]
			}
		})
		if (playersRes >= 400) throw httpErrors(matchRes.status, matchRes.message)
	}
	return reply.status(200).send({ message: 'OK' })
}
