import { v4 as uuidv4 } from 'uuid'

export async function start42OAuth(self: HTMLElement, uri: string) {
	const $el = document.createElement('a') as HTMLAnchorElement
	const $form = document.querySelector('form') as HTMLFormElement

	let client_id

	try {
		const res = await fetch('/api/auth/client_id', { method: 'GET' })
		const data = await res.json()
		client_id = data.client_id
	} catch (error) {
		console.error(error)
		return
	}

	const url =
		'https://api.intra.42.fr/oauth/authorize?' +
		new URLSearchParams({
			client_id: client_id,
			redirect_uri: uri,
			response_type: 'code',
			state: uuidv4()
		})

	const $navLeft = document.createElement('nav-left')
	const $navRight = document.createElement('nav-right')

	$navLeft.innerText = ' < '
	$navRight.innerText = ' > '

	$el.setAttribute('href', url)
	$el.innerText = 'Click to use 42 Auth'

	$form.style.display = 'none'

	self.innerHTML = ''

	self.appendChild($navLeft)
	self.appendChild($el)
	self.appendChild($navRight)
}
