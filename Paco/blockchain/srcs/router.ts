import { getNodeID } from './avalanche'
import { slashRoute } from './router/api'

// const idRoute = {
// 	'/:id': {
// 		GET: (req: Request) => {
// 			console.log('This is a new request')
// 			console.log(req)
// 			return new Response('This is a new / GET')
// 		},
// 		POST: () => new Response('This is / POST')
// 	}
// }

// const infoRoute = {
// 	'/info': {
// 		GET: async () => {
// 			const result = await getNodeID()
// 			return new Response(JSON.stringify(result), {
// 				headers: { 'Content-Type': 'application/json' }
// 			})
// 		}
// 	}
// }

export const routes = {
	...slashRoute
	// ...idRoute,
	// ...infoRoute
}
