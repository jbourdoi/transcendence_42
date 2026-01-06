import { v4 as uuidv4 } from 'uuid'

// let trackEvent = false

export function start42OAuth(self: HTMLElement, uri: string) {
	// if (trackEvent === false) {
	// 	trackEvent = true
	// 	const $closestTabIndex = self.closest('[tabindex]')
	// 	$closestTabIndex?.addEventListener('click', () => {
	// 		// console.log('Yes oauth')
	// 	})
	// }

	const $el = document.createElement('a') as HTMLAnchorElement
	const $form = document.querySelector('page[type="register"] form') as HTMLFormElement

	document.querySelectorAll('page[type="register"] form *[tabindex]').forEach(el=>{
		
	})
	
	const url =
		'https://api.intra.42.fr/oauth/authorize?' +
		new URLSearchParams({
			client_id: 'u-s4t2ud-9f30b2430e51c381ae5e38158295eef89230a74b070231a798bd1bcb7a01709c',
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
