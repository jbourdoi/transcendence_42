export function updateDomState(obj: object) {
	for (let key in obj) {
		const value = obj[key]
		const $el = document.querySelector(`state[key=${key}]`) as HTMLElement

		if ($el && value) $el.innerText = value
	}
}
