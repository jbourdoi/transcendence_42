fetch('/login', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({
		username: '2',
		pwd: 'password123'
	})
})
	.then(res => res.json())
	.then(data => console.log('Login response:', data))
