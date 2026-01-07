import sqlite3 from 'sqlite3'
import { log } from '../logs'

export default function initDb() {
	const db = new sqlite3.Database('/app/services/database/data/db.sqlite', err => {
		if (err) return log(`Could not connect to database: ${err}`, 'error')
		else log('Connected to database', 'info')
	})
	db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY NOT NULL,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            pwd TEXT,
            avatar TEXT
        )
    `)
	db.run(`
        CREATE TABLE IF NOT EXISTS queries_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_type TEXT,
            query TEXT NOT NULL,
            status TEXT CHECK( status IN ('success','failure') ) NOT NULL,
            error_code TEXT,
            error_message TEXT,
            latency_seconds REAL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)
	console.log('\x1b[32m%s\x1b[0m', 'Users and queries_log tables created if not already exists')
	return db
}
