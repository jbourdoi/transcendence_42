import sqlite3 from 'sqlite3'
import bcrypt from 'bcrypt'
import { log } from '../logs'

async function vaultPostQuery(endpoint: string, body: object) {
	const res = await fetch(`http://vault:6988/vault/${endpoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
	return res.json()
}

async function getVaultSecret<T>(name: string, parser: (value: string) => T): Promise<T | null> {
	const res = await vaultPostQuery('getSecret', { name })
	try {
		return parser(res.message.value)
	} catch (error) {
		return null
	}
}

export default function initDb() {
	getVaultSecret<string>('bcrypt_salt', value => value).then(salt => {
		if (!salt) process.exit(1)
		bcrypt.hash('pwd', salt).then(pass => {
			db.exec(`
			INSERT OR IGNORE INTO users (id, username, email, pwd, avatar, is_oauth) VALUES
				(1,  'alice',  'alice@test.com',  '${pass}',  NULL, 0),
				(2,  'bob',    'bob@test.com',    '${pass}',  NULL, 0),
				(3,  'carol',  'carol@test.com',  '${pass}',  NULL, 0),
				(4,  'dave',   'dave@test.com',   '${pass}',  NULL, 0),
				(5,  'eve',    'eve@test.com',    '${pass}',  NULL, 0),
				(6,  'frank',  'frank@test.com',  '${pass}',  NULL, 0),
				(7,  'grace',  'grace@test.com',  '${pass}',  NULL, 0),
				(8,  'heidi',  'heidi@test.com',  '${pass}',  NULL, 0),
				(9,  'ivan',   'ivan@test.com',   '${pass}',  NULL, 0),
				(10, 'judy',   'judy@test.com',   '${pass}', NULL, 0),
				(11, 'kate',   'kate@test.com',   '${pass}', NULL, 0),
				(12, 'leo',    'leo@test.com',    '${pass}', NULL, 0),
				(13, 'mallory','mallory@test.com','${pass}', NULL, 0),
				(14, 'nancy',  'nancy@test.com',  '${pass}', NULL, 0),
				(15, 'oscar',  'oscar@test.com',  '${pass}', NULL, 0),
				(16, 'peggy',  'peggy@test.com',  '${pass}', NULL, 0),
				(17, 'quentin','quentin@test.com','${pass}', NULL, 0),
				(18, 'ruth',   'ruth@test.com',   '${pass}', NULL, 0),
				(19, 'sybil',  'sybil@test.com',  '${pass}', NULL, 0),
				(20, 'trent',  'trent@test.com',  '${pass}', NULL, 0);
			`)
		})
	})

	const db = new sqlite3.Database('/app/services/database/data/db.sqlite', err => {
		if (err) return log(`Could not connect to database: ${err}`, 'error')
		else log('Connected to database', 'info')
	})
	db.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY NOT NULL,
				username TEXT NOT NULL UNIQUE,
				email TEXT NOT NULL UNIQUE,
				pwd TEXT,
				avatar TEXT,
				is_oauth INTEGER NOT NULL DEFAULT 0
			);

			CREATE TABLE IF NOT EXISTS queries_log (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				query_type TEXT,
				query TEXT NOT NULL,
				status TEXT CHECK( status IN ('success','failure') ) NOT NULL,
				error_code TEXT,
				error_message TEXT,
				latency_seconds REAL,
				executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS friend_requests (
				from_username TEXT NOT NULL,
				to_username   TEXT NOT NULL,
				created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

				PRIMARY KEY (from_username, to_username),
				FOREIGN KEY (from_username) REFERENCES users(username) ON DELETE CASCADE,
				FOREIGN KEY (to_username)   REFERENCES users(username) ON DELETE CASCADE,
				CHECK (from_username != to_username)
			);

			CREATE TABLE IF NOT EXISTS friendships (
				username_1 TEXT NOT NULL,
				username_2 TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

				PRIMARY KEY (username_1, username_2),
				FOREIGN KEY (username_1) REFERENCES users(username) ON DELETE CASCADE,
				FOREIGN KEY (username_2) REFERENCES users(username) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS blocks (
				blocker_username TEXT NOT NULL,
				blocked_username TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

				PRIMARY KEY (blocker_username, blocked_username),
				FOREIGN KEY (blocker_username) REFERENCES users(username) ON DELETE CASCADE,
				FOREIGN KEY (blocked_username) REFERENCES users(username) ON DELETE CASCADE,
				CHECK (blocker_username != blocked_username)
			);
			
			CREATE TABLE IF NOT EXISTS matches (
				id INTEGER PRIMARY KEY NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS match_players (
				match_id INTEGER NOT NULL,
				username TEXT NOT NULL,
				result TEXT NOT NULL CHECK (result IN ('win', 'lose')),
				PRIMARY KEY (match_id, username),
				FOREIGN KEY (match_id) REFERENCES matches(id),
				FOREIGN KEY (username) REFERENCES users(id)
			);

			
			CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(username_1);
			CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(username_2);
			CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_username);
			CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_username);
			
			
			INSERT OR IGNORE INTO friend_requests (from_username, to_username) VALUES
			('alice','bob'),
			('bob','carol'),
			('carol','dave'),
			('dave','eve'),
			('eve','frank'),
			('frank','grace'),
			('grace','heidi'),
			('heidi','ivan'),
			('ivan','judy'),
			('judy','kate'),
			('kate','leo'),
			('leo','mallory'),
			('mallory','nancy'),
			('nancy','oscar'),
			('oscar','peggy'),
			('peggy','quentin'),
			('quentin','ruth'),
			('ruth','sybil'),
			('sybil','trent'),
			('trent','alice');
			
			INSERT OR IGNORE INTO friendships (username_1, username_2) VALUES
			('alice','bob'),
			('bob','carol'),
			('carol','dave'),
			('dave','eve'),
			('eve','frank'),
			('frank','grace'),
			('grace','heidi'),
			('heidi','ivan'),
			('ivan','judy'),
			('judy','kate'),
			('kate','leo'),
			('leo','mallory'),
			('mallory','nancy'),
			('nancy','oscar'),
			('oscar','peggy'),
			('peggy','quentin'),
			('quentin','ruth'),
			('ruth','sybil'),
			('sybil','trent'),
			('alice','trent');



			INSERT OR IGNORE INTO matches (id) VALUES
			(1),(2),(3),(4),(5),
			(6),(7),(8),(9),(10),
			(11),(12),(13),(14),(15),
			(16),(17),(18),(19),(20);

			INSERT OR IGNORE INTO match_players (match_id, username, result) VALUES
			(1,'alice','win'),   (1,'bob','lose'),
			(2,'alice','win'),   (2,'bob','lose'),
			(3,'alice','win'),   (3,'bob','lose'),
			(4,'carol','lose'),   (4,'dave','lose'), (4,'alice','win'),
			(5,'ivan','win'),    (5,'judy','lose'),
			(6,'kate','win'),    (6,'leo','lose'),
			(7,'mallory','win'), (7,'nancy','lose'),
			(8,'oscar','win'),   (8,'peggy','lose'),
			(9,'quentin','win'), (9,'ruth','lose'),
			(10,'sybil','win'),  (10,'trent','lose'),
			(11,'bob','win'),    (11,'alice','lose'),
			(12,'dave','win'),   (12,'carol','lose'),
			(13,'frank','win'),  (13,'eve','lose'),
			(14,'heidi','win'),  (14,'grace','lose'),
			(15,'judy','win'),   (15,'ivan','lose'),
			(16,'leo','win'),    (16,'kate','lose'),
			(17,'nancy','win'),  (17,'mallory','lose'),
			(18,'peggy','win'),  (18,'oscar','lose'),
			(19,'ruth','win'),   (19,'quentin','lose'),
			(20,'trent','win'),  (20,'sybil','lose');
			`)

	console.log('\x1b[32m%s\x1b[0m', 'Tables created if not already exists')
	return db
}
