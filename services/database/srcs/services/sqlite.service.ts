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
				is_oauth INTEGER NOT NULL DEFAULT 0,
				has_2fa INTEGER NOT NULL DEFAULT 0
			);

			CREATE TABLE IF NOT EXISTS two_fa_challenges (
				user_id INTEGER PRIMARY KEY,
				code_hash TEXT NOT NULL,
				purpose TEXT NOT NULL,
				expires_at DATETIME NOT NULL,
				used_at DATETIME,
				attempts INTEGER NOT NULL DEFAULT 0,

				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS queries_log (
				id INTEGER PRIMARY KEY,
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
				type TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS match_players (
				match_id INTEGER NOT NULL,
				username TEXT NOT NULL,
				result TEXT NOT NULL CHECK (result IN ('win', 'lose')),
				PRIMARY KEY (match_id, username),
				FOREIGN KEY (match_id) REFERENCES matches(id),
				FOREIGN KEY (username) REFERENCES users(username)
			);

			
			CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(username_1);
			CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(username_2);
			CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_username);
			CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_username);
			
			
			INSERT OR IGNORE INTO blocks (blocker_username, blocked_username) VALUES
			('mallory','nancy'),
			('ruth','quentin');

			INSERT OR IGNORE INTO friend_requests (from_username, to_username) VALUES
			('alice','bob'),
			('bob','carol'),
			('carol','dave'),
			('dave','eve'),
			('eve','frank');
			
			INSERT OR IGNORE INTO friendships (username_1, username_2) VALUES
			('eve','frank'),
			('frank','grace'),
			('grace','heidi'),
			('heidi','ivan');
			
			
			CREATE TRIGGER IF NOT EXISTS update_username_cascade
			AFTER UPDATE OF username ON users
			FOR EACH ROW
			BEGIN
				UPDATE friend_requests
				SET from_username = NEW.username
				WHERE from_username = OLD.username;

				UPDATE friend_requests
				SET to_username = NEW.username
				WHERE to_username = OLD.username;

				UPDATE friendships
				SET username_1 = NEW.username
				WHERE username_1 = OLD.username;

				UPDATE friendships
				SET username_2 = NEW.username
				WHERE username_2 = OLD.username;

				UPDATE blocks
				SET blocker_username = NEW.username
				WHERE blocker_username = OLD.username;

				UPDATE blocks
				SET blocked_username = NEW.username
				WHERE blocked_username = OLD.username;

				UPDATE match_players
				SET username = NEW.username
				WHERE username = OLD.username;
			END;
			`)

	console.log('\x1b[32m%s\x1b[0m', 'Tables created if not already exists')
	return db
}
