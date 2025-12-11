export async function vaultPostQuery(endpoint: string, body: object) {
    const res = await fetch(`http://vault:6988/vault/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    })
    return res.json();
}