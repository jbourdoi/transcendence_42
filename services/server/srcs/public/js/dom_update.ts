// import { cleanEvents, initEvents } from './events.js'

import { CurrentButtonStore } from '../stores/current_button.store.js'
import { PageChangeStore } from '../stores/page_change.js'

export async function loadPage(route: string) {
	const location: string = `/${route || ''}`
	const res: Response = await window.fetch(location, { headers: { type: 'hydrate' } })
	const html: string = await res.text()
	const parser: DOMParser = new window.DOMParser()
	const htmlDoc: Document = parser.parseFromString(html, 'text/html')

	// cleanEvents()
	updateDom(htmlDoc)
	// initEvents()
	const selectedElement: HTMLElement = document.querySelector('*[data-selected=true]') as HTMLElement
	if (selectedElement) CurrentButtonStore.emit(selectedElement)
}

function updateDom(htmlDoc: Document) {
	const $mainPage: HTMLElement | null = document.querySelector('page')
	const $htmlDocPage: HTMLElement | null = htmlDoc.querySelector('page')
	const $htmlDocTitle: HTMLTitleElement | null = htmlDoc.querySelector('head title')
	const $htmlDocStyle: HTMLStyleElement | null = htmlDoc.querySelector('head style')
	const $htmlDocScript: HTMLScriptElement | null = htmlDoc.querySelector('body script[type="module"]')

	$mainPage?.dispatchEvent(new Event('cleanup'))
	if ($htmlDocTitle) document.title = $htmlDocTitle.innerHTML

	if ($htmlDocStyle) updateStyleModule($htmlDocStyle)

	if ($mainPage && $htmlDocPage) {
		$mainPage.innerHTML = $htmlDocPage.innerHTML
		$mainPage.setAttribute('type', $htmlDocPage.getAttribute('type') || '')
	}

	if ($htmlDocScript) runFunction($htmlDocScript)

	PageChangeStore.emit(document.title)
}

function updateStyleModule(htmlDocStyle: HTMLStyleElement) {
	const $head: HTMLHeadElement = document.querySelector('head')!

	$head.querySelectorAll('style[module]').forEach($el => $el.remove())
	$head.appendChild(htmlDocStyle)
}

function runFunction(htmlDocScript: HTMLScriptElement) {
	if (htmlDocScript) {
		document.querySelectorAll('body script[type="module"]:not([keep])').forEach($el => {
			$el.remove()
		})
		const newScript: HTMLScriptElement = document.createElement('script')
		if (htmlDocScript.type) newScript.type = htmlDocScript.type
		if (htmlDocScript.src) {
			fetch(htmlDocScript.src)
				.then(res => res.text())
				.then(res => {
					// console.log("Fetched script: ", res)
					newScript.textContent = res
				})
		} else {
			newScript.textContent = htmlDocScript.textContent
		}
		document.body.appendChild(newScript)
	}
}
