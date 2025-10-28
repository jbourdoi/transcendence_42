async function loadPage(route: string) {
	const location: string = `/${route || ''}`
	const res: Response = await fetch(location, { headers: { type: 'hydrate' } })
	const html: string = await res.text()
	const parser: DOMParser = new DOMParser()
	const htmlDoc: Document = parser.parseFromString(html, 'text/html')

	updateDom(htmlDoc)
}

function updateDom(htmlDoc: Document) {
	const $mainPage: HTMLElement | null = document.querySelector('page')
	const $htmlDocPage: HTMLElement | null = htmlDoc.querySelector('page')
	const $htmlDocTitle: HTMLTitleElement | null = htmlDoc.querySelector('head title')
	const $htmlDocStyle: HTMLStyleElement | null = htmlDoc.querySelector('head style')
	const $htmlDocScript: HTMLScriptElement | null = htmlDoc.querySelector('body script[type="module"]')

	if ($htmlDocTitle) document.title = $htmlDocTitle.innerHTML

	if ($htmlDocStyle) updateStyleModule($htmlDocStyle)

	if ($mainPage && $htmlDocPage) {
		$mainPage.innerHTML = $htmlDocPage.innerHTML
		console.log($htmlDocPage.getAttribute('type'))
		$mainPage.setAttribute('type', $htmlDocPage.getAttribute('type') || '')
	}

	if ($htmlDocScript) runFunction($htmlDocScript)
}

function updateStyleModule(htmlDocStyle: HTMLStyleElement) {
	const $head: HTMLHeadElement = document.querySelector('head')!

	$head.querySelectorAll('style[module]').forEach($el => $el.remove())
	$head.appendChild(htmlDocStyle)
}

function runFunction(htmlDocScript: HTMLScriptElement) {
	if (htmlDocScript) {
		const newScript: HTMLScriptElement = document.createElement('script')

		if (htmlDocScript.type) newScript.type = htmlDocScript.type
		if (htmlDocScript.src) {
			newScript.src = htmlDocScript.src
		} else {
			newScript.textContent = htmlDocScript.textContent
		}
		document.body.appendChild(newScript)
	}
}

async function navigate(route: string) {
	history.pushState({}, '', `/${route}`)
	await loadPage(route)
}

window.addEventListener('popstate', () => {
	const route = location.pathname.replace('/', '') || ''
	loadPage(route)
})

document.addEventListener('DOMContentLoaded', _ => {
	document.body.addEventListener('click', e => {
		e.preventDefault()
		if (e?.target) {
			const target: HTMLElement = e.target as HTMLElement
			const $a: HTMLAnchorElement | null = target.closest('a[data-route]')
			if ($a) {
				const newRoute = $a.getAttribute('data-route')
				if (newRoute != undefined) navigate(newRoute)
			}
		}
	})
})
