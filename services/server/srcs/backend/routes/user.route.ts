import { FastifyReply, FastifyRequest } from 'fastify'
import { dbPostQuery } from '../services/db.service.js'
import { generateAndSendToken, getPayload } from '../crud/auth.crud.js'
import { validateUsernameFormat } from '../../frontend/functions/formValidation.js'

export async function userDashboard(req: FastifyRequest, reply: FastifyReply) {
	const token = await getPayload(req)
	if (!token) return reply.status(401).send('Invalid or missing token')
	const body = await dbPostQuery({
		endpoint: 'dbGet',
		query: { verb: 'read', sql: 'SELECT * FROM users WHERE id = ?', data: [token.id] }
	})
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(200).send(body.data)
}

export async function getUsers(req: FastifyRequest, reply: FastifyReply) {
	const body = await dbPostQuery({ endpoint: 'dbAll', query: { verb: 'read', sql: 'SELECT * FROM users' }, data: [] })
	if (body.status >= 400) return reply.status(body.status).send({ message: body.message })
	return reply.status(200).send(body.data)
}

export async function getUserProfile(req: FastifyRequest, reply: FastifyReply) {
	const { name } = req.body as { name: string }
	const res = await dbPostQuery({
		endpoint: 'dbAll',
		query: {
			verb: 'SELECT',
			sql: `
SELECT
  m.id AS match_id,
  m.created_at,
  m.type,

  -- all players in the match
  GROUP_CONCAT(mp_all.username, ', ') AS players,

  -- winner(s) (supports ties / teams)
  GROUP_CONCAT(
    CASE WHEN mp_all.result = 'win' THEN mp_all.username END,
    ', '
  ) AS winner

FROM matches m

-- ensure Alice participated
JOIN match_players mp_self
  ON mp_self.match_id = m.id
 AND mp_self.username = ?

-- fetch all players in that match
JOIN match_players mp_all
  ON mp_all.match_id = m.id

GROUP BY m.id
ORDER BY m.created_at DESC;
`,
			data: [name]
		}
	})
	if (res.status >= 400) return reply.status(res.status).send({ message: res.message })
	return reply.status(200).send(res.data)
}

export async function getUserFriends(req: FastifyRequest, reply: FastifyReply) {
	const { name } = req.body as { name: string }
	const res = await dbPostQuery({
		endpoint: 'dbAll',
		query: {
			verb: 'SELECT',
			sql: `SELECT * FROM friendships WHERE username_1 = ? OR username_2 = ?;`,
			data: [name, name]
		}
	})
	console.log('Response: ', res)
	if (res.status >= 400) return reply.status(res.status).send({ message: res.message })
	return reply.status(200).send(res.data)
}

export async function updateUsername(req: FastifyRequest, reply: FastifyReply) {
	const {username} = req.body as { username: string }
	const token = await getPayload(req)
	if (!token) return reply.status(401).send('Invalid or missing token')
	const userInfo = token.userInfo
	const { id } = userInfo

	if (!username) return reply.status(400).send({ message: 'No field to update.' })
	if (username) {
		const usernameError = validateUsernameFormat(username)
		if (usernameError) return reply.status(400).send({ message: usernameError })
	}

	let user = await dbPostQuery({
		endpoint: 'dbGet',
		query: { verb: 'read', sql: 'SELECT * FROM users WHERE id = ?', data: [id] }
	})
	if (user.status >= 400) return reply.status(user.status).send({ message: user.message })

	let body = await dbPostQuery({ endpoint: 'dbRun', query: { verb: 'update', sql: 'UPDATE users SET username = ? WHERE id = ? AND username <> ?', data: [username, id, username] } })
	console.log(body)
	if (body.data?.changes === 0) return reply.status(200).send({ message: 'No changes made' })
	else if (body.status >= 400) return reply.status(body.status).send({ message: body.message })

	if (userInfo.username != username) userInfo.username = username
	const tokenResult = await generateAndSendToken(userInfo, reply)
	if (tokenResult.status >= 400) return reply.status(tokenResult.status).send({ message: tokenResult.message })

	return reply.status(200).send({ message: `User updated: ${id} ${username}` })
}

export async function getBlockedUser(req: FastifyRequest, reply: FastifyReply) {
	const { blocker, blocked } = (await req.body) as { blocker: string; blocked: string }
	console.log('blocker: ', blocker, ' blocked: ', blocked)
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'read',
			sql: 'SELECT * FROM blocks WHERE blocker_username = ? AND blocked_username = ?',
			data: [blocker, blocked]
		}
	})
	if (res.status == 404) return reply.status(200).send({ isBlocked: false })
	if (res.status >= 400) return reply.status(res.status).send({ message: res.message })
	const isBlocked = res.data ? true : false
	return reply.status(200).send({ isBlocked })
}

export async function getFriendUser(req: FastifyRequest, reply: FastifyReply) {
	const { user1, user2 } = (await req.body) as { user1: string; user2: string }
	console.log('user1: ', user1, ' user2: ', user2)
	const res = await dbPostQuery({
		endpoint: 'dbGet',
		query: {
			verb: 'read',
			sql: 'SELECT * FROM friendships WHERE (username_1 = ? AND username_2 = ?) OR (username_1 = ? AND username_2 = ?)',
			data: [user1, user2, user2, user1]
		}
	})
	if (res.status == 404) return reply.status(200).send({ isFriend: false })
	if (res.status >= 400) return reply.status(res.status).send({ message: res.message })
	const isFriend = res.data ? true : false
	return reply.status(200).send({ isFriend })
}
