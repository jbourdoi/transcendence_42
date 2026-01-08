export async function dbPostQuery(body: object) {
	const res = await fetch(`http://database:6989/executeQuery`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
	return res.json()
}
