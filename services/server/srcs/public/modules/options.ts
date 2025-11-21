const langs = ['En', 'Fr', 'Es']

const $page: HTMLElement = document.querySelector('page[type=options]')!

const cleanPage = () => {
	console.log('Cleaning Page Options')
	$page.removeEventListener('cleanup', cleanPage)
}

console.log('Adding event listener options')
$page.addEventListener('cleanup', cleanPage)

function updateLanguage(origin: 'init' | 'event') {
	const $languageOption = document.querySelector('span[data-action="updateLanguage"]') as HTMLSpanElement
	if (!$languageOption) return
	const currentOption: number | undefined = Number($languageOption?.dataset?.currentoption)
	let lang

	if (currentOption !== undefined) lang = langs[currentOption] || langs[0]

	if (origin === 'init') lang = localStorage.getItem('lang')

	$languageOption.innerText = `Language (${lang})`
	localStorage.setItem('lang', lang)
}

function updateTextSize(origin: 'init' | 'event') {
	const $textSize = document.querySelector('span[data-action="updateTextSize"]') as HTMLSpanElement
	if (!$textSize) return
	let textSize: string | undefined = $textSize?.dataset?.currentoption

	if (origin === 'init') {
		textSize = localStorage.getItem('textSize') || '16'
		$textSize.dataset.currentoption = textSize
	}
	$textSize.innerText = `Text Size (${textSize}px)`

	document.documentElement.style.setProperty('--text-size', `${textSize}px`)
	localStorage.setItem('textSize', textSize)
}

function handleOptionClick(evt: any) {
	let dataset = evt.target.dataset

	if (dataset.action === 'updateLanguage') updateLanguage('event')
	if (dataset.action === 'updateTextSize') updateTextSize('event')
}

export function initOptionEvents() {
	document.querySelectorAll<HTMLElement>('span.traverse').forEach($el => {
		$el.addEventListener('click', handleOptionClick)
	})
	updateLanguage('init')
	updateTextSize('init')
}

export function cleanOptionEvents() {
	document.querySelectorAll<HTMLElement>('span.traverse').forEach($el => {
		$el.removeEventListener('click', handleOptionClick)
	})
}
