import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Schéma versionné : chaque évolution de la base est une migration numérotée, jouée une seule fois, dans l'ordre.
 * Ne JAMAIS modifier une migration déjà publiée : en ajouter une nouvelle à la fin de la liste.
 */
const SCHEMA_V1 = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      pass_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      city TEXT NOT NULL,
      gender TEXT NOT NULL,
      looking_for TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      verified INTEGER NOT NULL DEFAULT 0,
      suspended INTEGER NOT NULL DEFAULT 0,
      suspended_reason TEXT,
      premium INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      demo_for INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS answers (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL,
      selected TEXT NOT NULL,
      PRIMARY KEY (user_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (from_id, to_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS blocks (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, blocked_id)
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      reported_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'autre',
      details TEXT,
      photo_id INTEGER,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS mod_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS otp (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_sent INTEGER NOT NULL,
      sent_count INTEGER NOT NULL DEFAULT 1,
      window_start INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mime TEXT NOT NULL,
      data BLOB NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      hidden INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conn ON messages(connection_id);
  `;

function addColumn(db, table, col, ddl) {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
}

export const MIGRATIONS = [
  { v: 1, name: 'schéma initial', up: (db) => db.exec(SCHEMA_V1) },
  {
    v: 2, name: 'rattrapage des bases créées avant le versionnement',
    up: (db) => {
      const hadVerified = db.prepare('PRAGMA table_info(users)').all().some((c) => c.name === 'verified');
      addColumn(db, 'users', 'verified', 'INTEGER NOT NULL DEFAULT 0');
      if (!hadVerified) db.exec('UPDATE users SET verified = 1 WHERE is_demo = 1');
      addColumn(db, 'users', 'suspended', 'INTEGER NOT NULL DEFAULT 0'); addColumn(db, 'users', 'suspended_reason', 'TEXT');
      addColumn(db, 'users', 'demo_for', 'INTEGER');
      addColumn(db, 'reports', 'category', "TEXT NOT NULL DEFAULT 'autre'"); addColumn(db, 'reports', 'details', 'TEXT');
      addColumn(db, 'reports', 'photo_id', 'INTEGER'); addColumn(db, 'reports', 'status', "TEXT NOT NULL DEFAULT 'open'");
      addColumn(db, 'photos', 'hidden', 'INTEGER NOT NULL DEFAULT 0');
    },
  },
  {
    v: 3, name: 'index de performance',
    up: (db) => db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_search ON users(gender, looking_for, completed, suspended);
      CREATE INDEX IF NOT EXISTS idx_conn_to ON connections(to_id, status);
      CREATE INDEX IF NOT EXISTS idx_conn_from ON connections(from_id, status);
      CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, id);
      CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id, status);
    `),
  },
];

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;');
  // Contrôle d'intégrité au démarrage : on refuse de tourner sur une base abîmée plutôt que d'aggraver les choses.
  const check = db.prepare('PRAGMA quick_check').get();
  if (Object.values(check)[0] !== 'ok') {
    db.close();
    throw new Error('Base de données endommagée. Restaure la dernière sauvegarde : npm run restore -- chemin/vers/sauvegarde.db');
  }
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
  const done = new Set(db.prepare('SELECT version FROM schema_version').all().map((r) => r.version));
  for (const m of MIGRATIONS) {
    if (done.has(m.v)) continue;
    db.exec('BEGIN');
    try {
      m.up(db);
      db.prepare('INSERT INTO schema_version (version, name) VALUES (?, ?)').run(m.v, m.name);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${m.v} (${m.name}) échouée : ${e.message}`);
    }
  }
  return db;
}
