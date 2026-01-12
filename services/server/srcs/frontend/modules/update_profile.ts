import { resetAvatarButton, setupAvatarPreview } from '../functions/formValidation'
import { UserStore } from '../stores/user.store'

let trackEvent = false

const $page: HTMLElement = document.querySelector('page[type=update_profile]')!
const $usernameInput: HTMLInputElement = document.querySelector('input[name="username"]')!

function handleUpdateProfile() {
	const $submitBtn = document.querySelector('span[type="submit"]') as HTMLElement
	const $avatarInput = $page.querySelector('input[name="avatar"]') as HTMLInputElement
	const $avatarPreview = $page.querySelector('#avatarPreview') as HTMLImageElement
	const $resetAvatarBtn = $page.querySelector('#resetAvatarButton') as HTMLButtonElement
	resetAvatarButton($resetAvatarBtn, $avatarInput, $avatarPreview)

	if (trackEvent === false) {
		trackEvent = true
		$submitBtn.onclick = e => {
			e.preventDefault()
			const username = $usernameInput.value.trim()
			const avatarFile = $avatarInput.files ? $avatarInput.files[0] : null

			if (username === '' && !avatarFile) {
				alert('Please update at least one field before submitting.')
				return
			}

			const formData = new FormData()
			if (username !== '') formData.append('username', username)
			if (avatarFile) formData.append('avatar', avatarFile)
			fetch('https://localhost:443/update_user', {
				method: 'PUT',
				body: formData,
			})
				.then(res => {
					if (res.status >= 400)
						return console.log('ERROR updating profile', res.status)
					console.log('RESPONSE', res)
					return res.json()
				})
				.then (res => {
					console.log('RESRESRES', res)
				})
		}
	}
	setupAvatarPreview($avatarInput, $avatarPreview)
}

handleUpdateProfile()

const unsubUserStore = UserStore.subscribe(value => {
	console.log(value)
	console.log(($usernameInput.placeholder = value.login))
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	unsubUserStore()
}

$page.addEventListener('cleanup', cleanPage)
