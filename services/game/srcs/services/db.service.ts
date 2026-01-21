import { dbBody } from '../types/db.type'

export async function dbPostQuery(body: dbBody) {
	const res = await fetch(`http://database:6989/executeQuery`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
	return res.json()
}
