import { Database } from 'sqlite3'
import { UserType } from '../types/request.type.ts'
import { ErrorResponseType } from '../types/error.type.ts'
import { queries_latency_histogram } from '../services/prometheus.service.ts'
import { methodType, queryObjectType } from '../types/query.type.ts'
import { log } from '../logs.ts'

export async function executeMethod(method: methodType, res: any, db: Database, query: any){
	switch (method) {
		case 'run':
			res = await dbRun(db, query.sql, query?.data)
			break
		case 'get':
			res = await dbGet(db, query.sql, query?.data)
			break
		case 'all':
			res = await dbAll(db, query.sql, query.data)
			break
	}
	return res
}

export async function dbRun(db: Database, sql: string, data: any[]): Promise<Response> {
	console.log('DB RUN - data:', data, 'sql:', sql)
	try {
		const res = await new Promise((resolve, reject) => {
			db.run(sql, data, function (this: any, err: ErrorResponseType) {
				console.log('INSIDE DB RUN - data:', data, 'sql:', sql, 'err:', err)
				if (err) {
					return reject(err)
				}
				return resolve({ status: 200, data: { lastID: this.lastID, name: data[0], changes: this?.changes } })
			})
		})
		return Response.json(res)
	} catch (error: any) {
		if (error && error.code === 'SQLITE_CONSTRAINT') return Response.json({ status: 400, message: error })
		return Response.json({ status: 500, message: String(error) })
	}
}

export async function dbGet(db: Database, sql: string, data: any[]): Promise<Response> {
	console.log('DB GET - data:', data, 'sql:', sql)
	try {
		const res = await new Promise((resolve, reject) => {
			db.get(sql, data, (err: ErrorResponseType, row: UserType) => {
				console.log('INSIDE DB GET - data:', data, 'sql:', sql, 'err:', err, 'row:', row)
				if (err) reject(err)
				else if (!row) resolve({ status: 404, message: 'User not found' })
				else resolve({ status: 200, data: row })
			})
		})
		return Response.json(res)
	} catch (error: unknown) {
		return Response.json({ status: 500, message: String(error) })
	}
}

export async function dbAll(db: Database, sql: string, data: any[]): Promise<Response> {
	try {
		const res = await new Promise((resolve, reject) => {
			db.all(sql, data, (err: ErrorResponseType, rows: any[]) => {
				console.log('INSIDE DB ALL - sql:', sql)
				console.log('INSIDE DB ALL - data:', data)
				console.log('INSIDE DB ALL - err:', err)
				console.log('INSIDE DB ALL - rows:', rows)
				err ? reject(err) : resolve({ status: 200, data: rows })
			})
		})
		console.log('DB ALL - res:', res)
		return Response.json(res)
	} catch (error: unknown) {
		return Response.json({ status: 500, message: String(error) })
	}
}

export function pushLog(start_time: bigint, db: Database, query_info: queryObjectType) {
	const end_time = process.hrtime.bigint()
	const latency_seconds = Number(end_time - start_time) / 1e9
	queries_latency_histogram.observe(latency_seconds)
	const executed_at = new Date().toISOString()
	const sql = `INSERT INTO queries_log (query, query_type, status, error_code, error_message, latency_seconds, executed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
	dbRun(db, sql, [
		query_info.sql,
		query_info.query_type,
		query_info.status,
		query_info.error_code,
		query_info.error_message,
		latency_seconds,
		executed_at
	])
	.catch((err) => {
		log('Failed to log query in queries_log table:', 'error')
	})
}