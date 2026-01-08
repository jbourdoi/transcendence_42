import { Database } from 'sqlite3'
import { total_failed_queries, total_queries_executed, total_successful_queries } from '../services/prometheus.service.ts'
import { endpointType, methodType, queryObjectType, queryType } from '../types/query.type.ts'
import { executeMethod, pushLog } from '../crud/database.crud.ts'

export async function executeQuery(db: Database, request: Request): Promise<any> {
	const { endpoint, query } = (await request.json()) as { endpoint: endpointType; query: queryType }
	console.log('ENDPOINT:', endpoint, 'QUERY:', query)
	const method: methodType = endpoint.toLowerCase().replace('db', '') as methodType
	const start_time = process.hrtime.bigint()
	const query_type = query.verb
	let status: 'success' | 'failure' = 'success'
	let error_code: string | null = null
	let error_message: string | null = null
	let res

	try {
		res = await executeMethod(method, res, db, query)
		total_queries_executed.inc()
		total_successful_queries.inc()
	} catch (error: any) {
		status = 'failure'
		error_code = error.code
		error_message = error.message
		total_queries_executed.inc()
		total_failed_queries.inc()
		res = Response.json({ status: 500, message: String(error) })
	} finally {
		const query_info: queryObjectType = { query_type, sql: query.sql, status, error_code, error_message }
		pushLog(start_time, db, query_info)
		return res
	}
}
