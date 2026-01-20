import { navigate } from '../js/routing'
import { StateStore } from '../stores/state.store'

const $page: HTMLElement = document.querySelector('page[type=profile]')!
const $pageTitle: HTMLElement = document.querySelector('page-title')!

const unsubStateStore = StateStore.subscribe(data => {
	const selectedProfile = data.selectedProfile

	if (selectedProfile !== undefined) {
		document.title = `${selectedProfile} Profile`
		$pageTitle.innerText = selectedProfile
	} else {
		document.title = `Profile`
		$pageTitle.innerText = 'Profile'
	}
	console.log(selectedProfile)
})

document.querySelector('#profileNavWithMockUser')?.addEventListener('click', () => {
	StateStore.update({ selectedProfile: 'John' })
	navigate('profile')
})

document.querySelector('#profileNavWithoutMockUser')?.addEventListener('click', () => {
	StateStore.update({ selectedProfile: undefined })
	navigate('profile')
})

const cleanPage = () => {
	$page.removeEventListener('cleanup', cleanPage)
	// StateStore.update({ selectedProfile: undefined })
	unsubStateStore()
}

$page.addEventListener('cleanup', cleanPage)
