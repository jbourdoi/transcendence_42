import fs from 'fs'
import path from 'path'
import {} from 'bun'
import { type RuleType, type TargetType } from '../types/rules.type'
import { sanitizeURL } from 'url-sanitizer'
import os from 'os'
import { log } from './logs'
import { getVaultSecret } from './services/vault.service'

const rulesFile = path.join(__dirname, '../rules/protocol_attack.json')
let rulesMap: Map<TargetType, RuleType[]> = new Map()

try {
	const rulesJSON = fs.readFileSync(rulesFile, 'utf8')
	const rules: RuleType[] = JSON.parse(rulesJSON)

	for (const rule of rules) {
		for (const target of rule.targets) {
			const arr = rulesMap.get(target) || []
			arr.push(rule)
			rulesMap.set(target, arr)
		}
	}

	log(`Loaded ${rulesMap.size} WAF target categories`, 'info')
	console.log(`Loaded ${rulesMap.size} WAF target categories`)
} catch (err) {
	log(`Error loading rules: ${err}`, 'error')
	console.log(`Error loading rules: ${err}`)
	process.exit(1)
}

function parseCookies(req: Request): Record<string, string> {
	const cookieHeader = req.headers.get('cookie')
	if (!cookieHeader) return {}

	const cookies: Record<string, string> = {}

	cookieHeader.split(';').forEach(pair => {
		const [name, ...rest] = pair.split('=')
		const value = rest.join('=')
		cookies[name.trim()] = value?.trim() || ''
	})
	return cookies
}

function regexFromString(str: string): RegExp {
	const literal = str.match(/^\/(.+)\/([a-z]*)$/i)
	if (literal) {
		return new RegExp(literal[1], literal[2] || 'i')
	}
	return new RegExp(str, 'i')
}

function testArgs(url: URL, rules: RuleType[] | undefined): boolean {
	if (!rules || rules.length === 0) return true

	for (const rule of rules) {
		const reg = regexFromString(rule.regex)

		for (const name of url.searchParams.keys()) {
			if (reg.test(name)) {
				log(`WAF BLOCKED: Rule ${rule.name} matched ARGS_NAMES`, 'warn')
				console.log(`WAF BLOCKED: Rule ${rule.name} matched ARGS_NAMES`)
				return false
			}
		}

		for (const value of url.searchParams.values()) {
			if (reg.test(value)) {
				log(`WAF BLOCKED: Rule ${rule.name} matched ARGS`, 'warn')
				console.log(`WAF BLOCKED: Rule ${rule.name} matched ARGS`)
				return false
			}
		}
	}

	return true
}

function testCookieNames(req: Request, rules: RuleType[] | undefined): boolean {
	if (!rules || rules.length === 0) return true

	const cookies = parseCookies(req)

	for (const rule of rules) {
		const reg = regexFromString(rule.regex)

		for (const name of Object.keys(cookies)) {
			if (reg.test(name)) {
				log(`WAF BLOCKED: Rule ${rule.name} matched REQUEST_COOKIES_NAMES`, 'warn')
				console.log(`WAF BLOCKED: Rule ${rule.name} matched REQUEST_COOKIES_NAMES`)
				return false
			}
		}
	}
	return true
}

function testCookieValues(req: Request, rules: RuleType[] | undefined): boolean {
	if (!rules || rules.length === 0) return true

	const cookies = parseCookies(req)

	for (const rule of rules) {
		const reg = regexFromString(rule.regex)

		for (const value of Object.values(cookies)) {
			if (reg.test(value)) {
				log(`WAF BLOCKED: Rule ${rule.name} matched REQUEST_COOKIES`, 'warn')
				console.log(`WAF BLOCKED: Rule ${rule.name} matched REQUEST_COOKIES`)
				return false
			}
		}
	}
	return true
}

function testRequestBody(bodyText: string, rules: RuleType[] | undefined): boolean {
	if (!rules || rules.length === 0) return true

	for (const rule of rules) {
		const reg = regexFromString(rule.regex)
		if (reg.test(bodyText)) {
			log(`WAF BLOCKED: Rule ${rule.name} matched REQUEST_BODY`, 'warn')
			console.log(`WAF BLOCKED: Rule ${rule.name} matched REQUEST_BODY`)
			return false
		}
	}

	return true
}

async function allowRequest(req: Request, bodyText: string): Promise<boolean> {
	const url = new URL(req.url)

	if (!testArgs(url, rulesMap.get('ARGS_NAMES'))) return false
	if (!testArgs(url, rulesMap.get('ARGS'))) return false
	if (!testRequestBody(bodyText, rulesMap.get('REQUEST_BODY'))) return false
	if (!testCookieNames(req, rulesMap.get('REQUEST_COOKIES_NAMES'))) return false
	if (!testCookieValues(req, rulesMap.get('REQUEST_COOKIES'))) return false

	return true
}

// permet de typer le champ data de l'objet Bun.Server
interface WAFWebSocketData {
	backendUrl: string
	ws_backend?: WebSocket
}

const authOnly = ['/chat', '/update_profile', '/users', '/profile', '/friends']

const cert_crt = await getVaultSecret<string>('services_crt', value => value.replace(/\\n/g, '\n').trim())
const cert_key = await getVaultSecret<string>('services_key', value => value.replace(/\\n/g, '\n').trim())
if (!cert_crt || !cert_key) console.error('Failed to load TLS certificates from Vault service.')

Bun.serve({
	hostname: '0.0.0.0',
	port: 443,
	key: cert_key,
	cert: cert_crt,
	websocket: {
		open(ws_frontend: Bun.ServerWebSocket<WAFWebSocketData>) {
			console.log('WAF: Frontend WSS connected')
			// pour chaque websocket ouverte depuis le frontend on construit une websocket vers le backend
			const ws_backend = new WebSocket(ws_frontend.data?.backendUrl)
			ws_frontend.data.ws_backend = ws_backend

			ws_backend.onopen = () => console.log('WAF → Backend WSS connected')

			// backend → frontend
			ws_backend.onmessage = event => ws_frontend.send(event.data)
			ws_backend.onclose = () => ws_frontend.close()
			ws_backend.onerror = () => ws_frontend.close()
		},

		// frontend → backend
		message(ws_frontend: Bun.ServerWebSocket<WAFWebSocketData>, msg) {
			const ws_backend = ws_frontend.data?.ws_backend
			if (!ws_backend || ws_backend.readyState !== ws_backend.OPEN) return console.log('Backend WS not ready')
			ws_backend.send(msg)
		},

		close(ws_frontend: Bun.ServerWebSocket<WAFWebSocketData>) {
			const ws_backend = ws_frontend.data?.ws_backend
			ws_backend?.close()
			console.log('WAF → Frontend WSS closed')
		}
	},
	fetch: async (req, server) => {
		console.log(`from bun: ${new Date().toLocaleString()} ${req.method} ${req.url} ${server.url.protocol}`)

		const url = new URL(req.url)
		let isAuthenticated = false

		if (url.pathname === '/health') return new Response('OK', { status: 200 })

		if (url.pathname.startsWith('/chatws')) {
			if (!(await allowRequest(req, ''))) return new Response('Forbidden', { status: 403 })
			const upgraded = server.upgrade(req, {
				data: {
					backendUrl: 'ws://chat:4444'
				}
			})
			if (!upgraded) return new Response('Failed to upgrade WS', { status: 500 })
			return
		}
		
		if (url.pathname.startsWith('/gamews')) {
			if (!(await allowRequest(req, ''))) return new Response('Forbidden', { status: 403 })
			const upgraded = server.upgrade(req, {
				data: {
					backendUrl: 'ws://game:3333'
				}
			})
			if (!upgraded) return new Response('Failed to upgrade WS', { status: 500 })
			return
		}

		await fetch(`https://server:3000/get_payload`, {
			method: req.method,
			headers: req.headers
		})
			.then(res => res.json())
			.then(res => {
				isAuthenticated = res !== null
			})

		const reqBuffer = await req.arrayBuffer()
		const bodyText = new TextDecoder().decode(reqBuffer)

		if (!(await allowRequest(req, bodyText))) {
			return new Response('Forbidden', { status: 403 })
		}

		if (authOnly.includes(url.pathname) && !isAuthenticated) {
			return Response.redirect('/forbidden', 302)
		}

		let result = await fetch(`https://server:3000${url.pathname}${url.search}`, {
			method: req.method,
			headers: req.headers,
			body: bodyText
		})
			.then(async res => {
				return {
					status: res.status,
					headers: res.headers,
					blob: (await res.blob()) || ''
				}
			})
			.catch(err => {
				return {
					status: 418,
					headers: req.headers,
					blob: err
				}
			})
		return new Response(result.blob, { status: result.status, headers: result.headers })
	}
}) as Bun.Server<WAFWebSocketData>

log('Bun WAF running on port 443', 'info')
console.log('Bun WAF running on port 443')
