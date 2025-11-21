export function getTraverable(): HTMLElement[] {
	let buttonList: HTMLElement[] = []

	document.querySelectorAll<HTMLElement>('.traverse').forEach((el: HTMLElement, idx) => {
		el.dataset.idx = String(idx)
		buttonList.push(el)
	})
	return buttonList
}
