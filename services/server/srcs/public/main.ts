import { PageChangeStore } from "./stores/page_change.js"

const $bgContainer = document.querySelector('background-container')

if ($bgContainer) {
	const $bgVideo = $bgContainer.querySelector('video') as HTMLVideoElement
	const $bgImg = $bgContainer.querySelector('img') as HTMLImageElement
	$bgVideo.addEventListener('canplaythrough', evt => {
		$bgImg.style.opacity = '0'
		setTimeout(() => {
			$bgVideo.play()
		}, 300)
	})
}

PageChangeStore.emit('')
