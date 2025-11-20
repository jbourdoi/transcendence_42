import fs from 'fs'
import path from 'path'
import {} from 'bun'
import { type RuleType, type TargetType } from '../types/rules.type'
import { sanitizeURL } from 'url-sanitizer'
import os from 'os'

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

	console.log(`Loaded ${rulesMap.size} WAF target categories`)
} catch (err) {
	console.error('Error loading rules:', err)
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
				console.log(`WAF BLOCKED: Rule ${rule.name} matched ARGS_NAMES`)
				return false
			}
		}

		for (const value of url.searchParams.values()) {
			if (reg.test(value)) {
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

Bun.serve({
	port: 443,
	fetch: async req => {
		console.log(new Date().toLocaleString())
		console.log(req.method)
		console.log(req.url)

		const reqBuffer = await req.arrayBuffer()
		const bodyText = new TextDecoder().decode(reqBuffer)

		if (!(await allowRequest(req, bodyText))) {
			return new Response('Forbidden', { status: 403 })
		}

		const url = new URL(req.url)

		let result = await fetch(`http://server:3000${url.pathname}`, {
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
					status: 500,
					headers: '',
					blob: err
				}
			})
		return new Response(result.blob, { status: result.status, headers: result.headers })
	},
	key: fs.readFileSync('./certs/key.pem'),
	cert: fs.readFileSync('./certs/cert.pem')
})

console.log('Bun WAF running on port 443')
