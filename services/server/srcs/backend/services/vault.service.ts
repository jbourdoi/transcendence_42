export async function getSecret(name: string) {
    const response = await fetch(`http://vault:6988/vault/getSecret`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
    });
    return response.text();
}