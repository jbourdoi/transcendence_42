import { FastifyReply, FastifyRequest } from 'fastify'
import { sendEmail } from '../services/ethereal.service.js'
import { generateAndSendToken, getPayload } from '../crud/auth.crud.js'
import { dbPostQuery } from '../services/db.service.js'
import { getVaultSecret } from '../services/vault.service.js'
import bcrypt from 'bcrypt'
import { challengeType, httpResponseType } from '../../types/twofa.type.js'
import { InfoFetchType } from '../../types/infofetch.type.js'

export async function create2FAChallenge(userData: any) {
    const code = Math.floor(100000 + Math.random() * 900000).toString() // generate a 6-digit code
    console.log('LE CODE 2FA EST : ', code)
    const salt = await getVaultSecret<string>('bcrypt_salt', (value) => value)
    if (!salt) return { status: 500, message: 'Failed to retrieve bcrypt_salt from Vault' }
    const hashedCode = await bcrypt.hash(code, salt)

    const expirationDate = new Date(Date.now() + 5 * 60000).toISOString() // 5 minutes from now

    const res = await dbPostQuery({
        endpoint: 'dbRun',
        query: {
            verb: 'create',
            sql: 'INSERT INTO two_fa_challenges (user_id, code_hash, purpose, expires_at) \
            VALUES (?, ?, ?, ?) \
            ON CONFLICT(user_id) DO UPDATE SET \
                code_hash = excluded.code_hash, \
                purpose = excluded.purpose, \
                expires_at = excluded.expires_at, \
                used_at = NULL, \
                attempts = 0',
            data: [userData.userId, hashedCode, userData.purpose, expirationDate]
        }
    })
    return { status: res.status, message: res.message }
}

export async function send2FACode(req: FastifyRequest, reply: FastifyReply) {
    console.log('Received request to send 2FA code: ', req.body)
    const { purpose, userData: infoFetch } = req.body as { purpose: string, userData: any }
    let email: string
    let userId: number

    if (infoFetch) {
        email = infoFetch.email
        userId = infoFetch.id
    }
    else {
        const token = await getPayload(req)
        if (!token) return reply.status(401).send({ message: 'Unauthorized' })
        email = token.userInfo.email
        userId = token.userInfo.id
    }
    if (!email || !purpose || !userId) return reply.status(400).send({ message: 'Bad Request' })
    console.log('email: ', email, ' purpose: ', purpose, ' userId: ', userId)

    console.log('Insert 2FA challenge into db.')
    const res = await create2FAChallenge({ userId, purpose })
    if (res.status >= 400) {
        console.log('Failed to insert 2FA challenge into db.', res)
        return reply.status(res.status).send({ message: res.message })
    }
    console.log('Inserted 2FA challenge into db successfully.')

    console.log('Sending 2FA code via email to ', email)
    // try {
    //     await sendEmail(email, code)
    // } catch (error) {
    //     console.log('Failed to send 2FA code via email. Deleting 2FA challenge from db.')
    //     const res = await deleteChallenge(userId)
    //     if (res.status >= 400) return reply.status(res.status).send({ message: res.message })
    //     return reply.status(500).send({ message: 'Failed to send 2FA code. Resend a new code.' })
    // }
    console.log('2FA code sent successfully via email.')
    reply.status(200).send({ message: '2FA code sent' })
}

export async function validate2FACode(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    console.log('Received request to validate 2FA code: ', req.body)
    const { code: inputCode, purpose, userData: infoFetch } = req.body as { code: string, purpose: string, userData: any }
    let userId: number
    let has_2fa: boolean
    let email: string
    let username: string

    if (infoFetch) {
        userId = infoFetch.id
        has_2fa = infoFetch.has_2fa
        email = infoFetch.email
        username = infoFetch.username
    }
    else {
        const token = await getPayload(req)
        if (!token) return reply.status(401).send({ message: 'Unauthorized' })
        userId = token.userInfo.id
        has_2fa = token.userInfo.has_2fa
        email = token.userInfo.email
        username = token.userInfo.username
    }
    if (!inputCode || !purpose || !userId || !has_2fa || !email || !username) return reply.status(400).send({ message: 'Bad Request' })

    console.log('Check challenge validity for userId:', userId)
    // also check purpose matches to avoid login/enable/disable confusion
    let res = await dbPostQuery({
        endpoint: 'dbGet',
        query: {
            verb: 'read',
            sql: 'SELECT * FROM two_fa_challenges WHERE user_id = ? AND purpose = ?',
            data: [userId, purpose]
        }
    })
    if (res.status >= 400) {
        console.log('Failed to retrieve 2FA challenge from db.', res)
        return reply.status(res.status).send({ message: 'No 2FA challenge found for this user' })
    }

    console.log('Validate 2FA challenge from db for userId:', userId)
    const challenge: challengeType = res.data
    res = await isChallengeValid(challenge, inputCode)
    if (res.status >= 400) return reply.status(res.status).send({ message: res.message })

    console.log('Update used_at for 2FA challenge in db')
    res = await updateUsedChallenge(userId)
    if (res.status >= 400) return reply.status(res.status).send({ message: res.message })

    console.log('Add 2FA enabled/disabled to table Users in db depending on purpose')
    res = await update2FAStatusInUsersTable(userId, purpose)
    if (res.status >= 400) return reply.status(res.status).send({ message: res.message })

    console.log('Delete challenge from db')
    res = await deleteChallenge(userId)
    if (res.status >= 400) return reply.status(res.status).send({ message: res.message })

    console.log('Generate and send new token with updated 2FA status')
    let userInfo: InfoFetchType = { email: email, username: username, id: userId, has_2fa: has_2fa, info: { status: 200, message: 'User info for token' } }
    if (purpose === 'enable') userInfo.has_2fa = true
    else if (purpose === 'disable') userInfo.has_2fa = false
    console.log('Updated userInfo for token:', userInfo)
    await generateAndSendToken(userInfo, reply)

    reply.status(200).send({ message: '2FA code validated successfully' })
}

async function update2FAStatusInUsersTable(userId: number, purpose: string): Promise<httpResponseType> {
    let is2FAEnabled: number
    if (purpose === 'enable') is2FAEnabled = 1
    else if (purpose === 'disable') is2FAEnabled = 0
    else {
        console.log('Invalid purpose for updating 2FA status in users table. Nothing done.')
        return { status: 304, message: 'Invalid purpose for updating 2FA status in users table. Nothing done.' }
    }

    const res = await dbPostQuery({
        endpoint: 'dbRun',
        query: {
            verb: 'update',
            sql: 'UPDATE users SET has_2fa = ? WHERE id = ?',
            data: [is2FAEnabled, userId],
        }
    })
    if (res.status >= 400) {
        console.log('Failed to update 2FA status in Users table.', res)
        return { status: res.status, message: res.message }
    }
    console.log('Updated 2FA status in users table successfully.')
    return { status: 200, message: 'Updated 2FA status in users table successfully' }
}

async function updateUsedChallenge(userId: number): Promise<httpResponseType> {
    const res = await dbPostQuery({
        endpoint: 'dbRun',
        query: {
            verb: 'update',
            sql: 'UPDATE two_fa_challenges SET used_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            data: [userId],
        }
    })
    if (res.status >= 400) {
        console.log('Failed to update used_at for 2FA challenge.', res)
        return { status: res.status, message: res.message }
    }
    console.log('Updated used_at for 2FA challenge successfully.')
    return { status: 200, message: 'Updated used_at for 2FA challenge successfully' }
}

async function isChallengeValid(challenge: challengeType, inputCode: string): Promise<httpResponseType> {
    console.log('Check challenge exists')
    if (!challenge) {
        console.log('No 2FA challenge found for user.')
        return { status: 400, message: 'No 2FA challenge found' }
    }
    console.log('Check used_at')
    if (challenge.used_at) {
        console.log('2FA code already used. Deleting challenge from db.')
        const res = await deleteChallenge(challenge.user_id)
        if (res.status >= 400) return { status: res.status, message: res.message }
        return { status: 400, message: '2FA code already used. Resend a new code.' }
    }
    const now = new Date()
    const expiresAt = new Date(challenge.expires_at)
    console.log('Check expiration: now:', now, ' expiresAt:', expiresAt)
    if (now > expiresAt) {
        console.log('2FA code expired. Deleting challenge from db.')
        const res = await deleteChallenge(challenge.user_id)
        if (res.status >= 400) return { status: res.status, message: res.message }
        return { status: 400, message: '2FA code expired. Resend a new code.' }
    }
    console.log('Check attempts >= 3')
    if (challenge.attempts >= 3) {
        console.log('2FA code locked due to too many attempts. Deleting challenge from db.')
        const res = await deleteChallenge(challenge.user_id)
        if (res.status >= 400) return { status: res.status, message: res.message }
        return { status: 400, message: '2FA code locked due to too many attempts. Resend a new code.' }
    }
    console.log('Check code hash')
    const isCodeValid = await bcrypt.compare(inputCode, challenge.code_hash)
    if (!isCodeValid) {
        console.log('Invalid 2FA code. Incrementing attempts.')
        const res = await incrementAttempts(challenge.user_id)
        return { status: 400 , message: 'Invalid 2FA code' }
    }
    console.log('2FA code is valid.')
    return { status: 200, message: '2FA code is valid' }
}

async function incrementAttempts(userId: number): Promise<httpResponseType> {
    let res = await dbPostQuery({
        endpoint: 'dbRun',
        query: {
            verb: 'update',
            sql: 'UPDATE two_fa_challenges SET attempts = attempts + 1 WHERE user_id = ?',
            data: [userId],
        }
    })
    if (res.status >= 400) {
        console.log('Failed to increment 2FA attempts.', res)
        return { status: res.status, message: res.message }
    }
    console.log('Incremented 2FA attempts successfully.')

    res = await checkAttempts(userId)
    if (res.status >= 400) return { status: res.status, message: res.message }
    return { status: 200, message: '2FA attempts incremented' }
}

async function checkAttempts(userId: number): Promise<httpResponseType> {
    const checkAttempts = await dbPostQuery({
        endpoint: 'dbGet',
        query: {
            verb: 'read',
            sql: 'SELECT attempts FROM two_fa_challenges WHERE user_id = ?',
            data: [userId],
        }
    })
    if (checkAttempts.status >= 400) {
        console.log('Failed to retrieve 2FA attempts after increment.', checkAttempts)
        return { status: checkAttempts.status, message: checkAttempts.message }
    }
    const attempts: number = checkAttempts.data.attempts
    if (attempts >= 3) {
        console.log('2FA code locked due to reaching maximum attempts. Deleting challenge from db.')
        const res = await deleteChallenge(userId)
        if (res.status >= 400) return { status: res.status, message: res.message }
        return { status: 400, message: '2FA code locked due to reaching maximum attempts. Resend a new code.' }
    }
    return { status: 200, message: '2FA attempts checked. The challenge is still valid.' }
}

async function deleteChallenge(userId: number): Promise<httpResponseType> {
    const res = await dbPostQuery({
        endpoint: 'dbRun',
        query: {
            verb: 'delete',
            sql: 'DELETE FROM two_fa_challenges WHERE user_id = ?',
            data: [userId],
        }
    })
    if (res.status >= 400) {
        console.log('Failed to delete 2FA challenge.', res)
        return { status: res.status, message: res.message }
    }
    console.log('Deleted 2FA challenge successfully.')
    return { status: 200, message: '2FA challenge deleted' }
}