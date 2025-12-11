import { StateStore } from '../stores/state.store'

StateStore.subscribe(newConfig => {
	const stateElements = Array.from(document.querySelectorAll('state'))
	const stateValues = Array.from(document.querySelectorAll('*[data-state-key]'))
	const found = stateElements.find(el => el.getAttribute('value') == 'textSize')
	const foundEl = stateValues.find(el => el.dataset.stateKey == 'textSize')

	if (newConfig.textSize && found && foundEl) {
		document.documentElement.style.setProperty('--text-size', `${newConfig.textSize}px`)
		found.innerText = `${newConfig.textSize} px`
		foundEl.dataset.stateValue = newConfig.textSize
	}
})
