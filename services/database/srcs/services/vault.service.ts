async function vaultPostQuery(endpoint: string, body: object) {
    const res = await fetch(`http://vault:6988/vault/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    return res.json()
}

export async function getVaultSecret<T>(name: string, parser: (value: string) => T): Promise<T | null> {
    const res = await vaultPostQuery('getSecret', { name })
    try {
        return parser(res.message.value)
    } catch (error) {
        return null
    }
}