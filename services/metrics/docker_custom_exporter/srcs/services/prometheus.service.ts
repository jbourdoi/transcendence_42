import client from 'prom-client'
import Docker from 'dockerode'

export const register = new client.Registry()
const docker = new Docker({ socketPath: process.env.SOCKET_PATH })

const runningContainers = new client.Gauge({
	name: 'running_containers',
	help: 'Number of running Docker containers'
})

const stoppedContainers = new client.Gauge({
	name: 'stopped_containers',
	help: 'Number of stopped Docker containers'
})

const totalImages = new client.Gauge({
	name: 'total_images',
	help: 'Total number of Docker images'
})

register.registerMetric(runningContainers)
register.registerMetric(stoppedContainers)
register.registerMetric(totalImages)

export async function updateMetrics() {
	const containers = await docker.listContainers({ all: true })
	// console.log('containers: ', containers.length)
	runningContainers.set(
		containers.filter(c => c.State === 'running' && c.Labels && c.Labels['projectLabel'] === 'transcendence').length
	)
	stoppedContainers.set(
		containers.filter(c => c.State !== 'running' && c.Labels && c.Labels['projectLabel'] === 'transcendence').length
	)
	const images = await docker.listImages()
	const image = images.find(img => img.RepoTags && img.RepoTags.some(tag => tag.includes('transcendence-')))
	if (!image) {
		
		console.log('No transcendence image found')
	return []
	}
	const folderPath = image.Context || image.Path
	const relatedImages = images.filter(img => img.Context === folderPath || img.Path === folderPath)
	totalImages.set(relatedImages.length)
}
