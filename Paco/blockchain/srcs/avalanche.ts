const AVALANCHE_URL = 'http://127.0.0.1:9650'
// https://chatgpt.com/share/691330f9-f19c-8011-856f-a36c455da07a
export async function getNodeID() {
	const res = await fetch(`${AVALANCHE_URL}/ext/info`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'info.getNodeID'
		})
	})

	if (!res.ok) {
		return { error: `Avalanche RPC failed: ${res.status}` }
	}

	return await res.json()
}
