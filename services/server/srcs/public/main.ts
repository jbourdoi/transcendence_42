import { CurrentButtonStore } from './stores/current_button.store.js'
import { PageUpdateStore } from './stores/page_state.js'

// var BabylonState = {
// 	engine: null as BABYLON.Engine | null,
// 	scene: null as BABYLON.Scene | null,
// 	canvas: null as HTMLCanvasElement | null
// }

// window.BabylonState = BabylonState

const $bgContainer = document.querySelector('background-container')

if ($bgContainer) {
	const $bgVideo = $bgContainer.querySelector('video') as HTMLVideoElement
	const $bgImg = $bgContainer.querySelector('img') as HTMLImageElement

	$bgVideo.addEventListener('play', showBGVideo)

	function showBGVideo() {
		$bgVideo.removeEventListener('play', showBGVideo)
		$bgImg.style.opacity = '0'
	}
}

PageUpdateStore.emit('')
const selectedElement: HTMLElement = document.querySelector('*[data-selected=true]') as HTMLElement
if (selectedElement) CurrentButtonStore.emit(selectedElement)

// document.addEventListener('keydown', function (event) {
// 	if (event.key === 'Tab') {
// 		event.preventDefault()
// 	}
// })
