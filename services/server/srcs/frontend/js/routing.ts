import { loadPage } from './dom_update'

export async function navigate(route: string) {
	history.pushState({}, '', `/${route}`)
	await loadPage(route)
}

window.addEventListener('popstate', () => {
	const route = location.pathname.replace('/', '') || ''
	loadPage(route)
})

document.addEventListener('DOMContentLoaded', _ => {
	document.body.addEventListener('click', e => {
		if (e?.target) {
			const target: HTMLElement = e.target as HTMLElement
			const $a: HTMLAnchorElement | null = target.closest('*[data-route]')
			if ($a) {
				const newRoute = $a.getAttribute('data-route')
				if (newRoute != undefined) {
					e.preventDefault()
					navigate(newRoute)
				}
			}
		}
	})
})
