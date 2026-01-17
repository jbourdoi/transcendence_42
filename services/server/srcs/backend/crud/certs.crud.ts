import { vaultPostQuery } from '../services/vault.service.js'

export async function getCertValue(cert_name: string)
{
	const cert = await vaultPostQuery('getSecret', { name: cert_name })
	const cert_value = cert.message.value
	const trimmed_cert = cert_value
	    .replace(/\\n/g, '\n')
	    .trim()
	return trimmed_cert
}