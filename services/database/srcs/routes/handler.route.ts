import { getUrlHealth } from './health.route.ts'
import { db } from '../index.ts'
import { executeQuery } from './db.route.ts'
import { getMetrics } from './metrics.route.ts'
import { total_failed_queries, total_queries_executed } from '../services/prometheus.service.ts'

const dbRoute = {
	'/executeQuery': {
		POST: (request: Request) => executeQuery(db, request)
	}
}

const healthRoute = {
	'/health': {
		GET: () => getUrlHealth()
	}
}

const metricsRoute = {
	'/metrics': {
		GET: async () => getMetrics()
	},
	'/fail': {
		GET: () => {
			total_queries_executed.inc()
			total_failed_queries.inc()
			return new Response('Intentional Failure for Testing')
		}
	}
}

export const routes = {
	...dbRoute,
	...healthRoute,
	...metricsRoute
}
