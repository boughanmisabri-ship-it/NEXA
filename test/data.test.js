import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { buildApp } from '../src/server.js';
import { openDb, MIGRATIONS } from '../src/db.js';
import { verifyBackup, restoreBackup, listBackups, pruneBackups } from '../src/backup.js';
import { questions } from '../src/questions.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nexa-data-'));

// 1. Migration depuis une ancienne base (créée avant le versionnement)
{
  const old = path.join(tmp, 'ancienne.db');
  const d = new DatabaseSync(old);
  d.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT NOT NULL UNIQUE, pass_hash TEXT NOT NULL, name TEXT NOT NULL, age INTEGER NOT NULL, city TEXT NOT NULL, gender TEXT NOT NULL, looking_for TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '', completed INTEGER NOT NULL DEFAULT 0, premium INTEGER NOT NULL DEFAULT 0, is_demo INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE reports (id INTEGER PRIMARY KEY AUTOINCREMENT, reporter_id INTEGER NOT NULL, reported_id INTEGER NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE photos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, mime TEXT NOT NULL, data BLOB NOT NULL, position INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    INSERT INTO users (phone, pass_hash, name, age, city, gender, looking_for, is_demo) VALUES ('+21620000001','h','Réel',30,'Tunis','Femme','Un homme',0), ('demo-1','h','Démo',30,'Tunis','Homme','Une femme',1);
    INSERT INTO reports (reporter_id, reported_id, reason) VALUES (1,2,'ancien');`);
  d.close();
  const db = openDb(old);
  const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  assert.ok(['verified', 'suspended', 'demo_for'].every((c) => cols('users').includes(c)), 'colonnes users ajoutées');
  assert.ok(['category', 'status', 'photo_id'].every((c) => cols('reports').includes(c)) && cols('photos').includes('hidden'));
  assert.deepEqual(db.prepare('SELECT version FROM schema_version ORDER BY version').all().map((r) => r.version), MIGRATIONS.map((m) => m.v), 'toutes les migrations enregistrées');
  assert.equal(db.prepare("SELECT name FROM users WHERE phone = '+21620000001'").get().name, 'Réel', 'données conservées');
  assert.equal(db.prepare('SELECT verified FROM users WHERE is_demo = 1').get().verified, 1);
  assert.equal(db.prepare('SELECT verified FROM users WHERE is_demo = 0').get().verified, 0);
  assert.equal(db.prepare('SELECT status FROM reports').get().status, 'open', 'ancien signalement migré');
  db.close();
  const again = openDb(old); assert.equal(again.prepare('SELECT COUNT(*) n FROM schema_version').get().n, MIGRATIONS.length, 'migrations rejouées sans effet'); again.close();
}

// 2. Base corrompue : refus de démarrer
{
  const bad = path.join(tmp, 'corrompue.db'); fs.writeFileSync(bad, Buffer.alloc(4096, 0x41));
  assert.throws(() => openDb(bad), 'une base corrompue est refusée');
}

// 3. Sauvegarde, restauration, entretien, export, téléchargement admin
const dbFile = path.join(tmp, 'live', 'nexa.db');
const ADMIN = 'admintoken-1234567890';
const server = buildApp({ dbFile, demo: false, secret: 'd', devCodes: true, msgPerMin: 1000, adminToken: ADMIN });
await new Promise((r) => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}`;
const call = async (method, p, body, token, headers = {}) => {
  const r = await fetch(url + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') || '';
  return { status: r.status, headers: r.headers, data: ct.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()) };
};
const mine = Object.fromEntries(questions.map((q) => [q.id, q.maxChoices > 0 ? [0] : [0]])); mine[47] = [];
const jpeg = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1]), Buffer.alloc(600, 5)]).toString('base64');
async function user(phone, name) {
  const r = await call('POST', '/auth/register', { phone, password: 'motdepasse1', name, age: 30, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' });
  const t = r.data.token; const c = await call('POST', '/auth/send-code', null, t);
  await call('POST', '/auth/verify-code', { code: c.data.devCode }, t);
  await call('POST', '/answers', { answers: mine }, t); await call('POST', '/photos', { image: jpeg }, t);
  return { t, id: r.data.user.id };
}
const A = await user('20400001', 'Alice'), B = await user('20400002', 'Bea');

const name = server.backupNow(true);
assert.match(name, /^nexa-auto-.*\.db$/, 'sauvegarde automatique créée');
const bdir = path.join(path.dirname(dbFile), 'backups');
const info = verifyBackup(path.join(bdir, name));
assert.ok(info.ok && info.users === 2 && info.schemaVersion === MIGRATIONS.length, 'sauvegarde vérifiée (2 utilisateurs)');
assert.equal(server.backupNow(), null, 'pas plus d\'une sauvegarde automatique par jour');
assert.ok((await call('GET', '/health')).data.lastBackup, '/health indique la dernière sauvegarde');

// restauration après une perte de données
await call('DELETE', '/account', null, B.t);
const restored = path.join(tmp, 'restauree.db');
restoreBackup(path.join(bdir, name), restored);
const rdb = openDb(restored);
assert.equal(rdb.prepare('SELECT COUNT(*) n FROM users').get().n, 2, 'les 2 comptes sont revenus après restauration');
assert.equal(rdb.prepare('SELECT COUNT(*) n FROM photos').get().n, 2, 'les photos aussi');
rdb.close();
fs.writeFileSync(path.join(tmp, 'garbage.db'), 'pas une base');
assert.throws(() => restoreBackup(path.join(tmp, 'garbage.db'), restored), 'sauvegarde invalide refusée');
fs.copyFileSync(restored, path.join(tmp, 'sur.db')); restoreBackup(path.join(bdir, name), path.join(tmp, 'sur.db'));
assert.ok(fs.readdirSync(tmp).some((f) => f.startsWith('sur.db.avant-restauration-')), 'ancienne base conservée avant restauration');

// rotation
for (let i = 1; i <= 6; i++) fs.writeFileSync(path.join(bdir, `nexa-auto-2020010${i}-000000.db`), 'x');
pruneBackups(bdir, 3);
assert.equal(listBackups(bdir).length, 3, 'rotation : 3 sauvegardes conservées'); assert.equal(listBackups(bdir)[0].name, name, 'la plus récente est conservée');

// téléchargement admin
assert.equal((await call('GET', '/admin/backup')).status, 401);
const dl = await call('GET', '/admin/backup', null, null, { 'X-Admin-Token': ADMIN });
assert.equal(dl.status, 200); assert.equal(dl.data.subarray(0, 15).toString(), 'SQLite format 3', 'le téléchargement est une vraie base SQLite');
assert.match(dl.headers.get('content-disposition'), /attachment; filename="nexa-export-.*\.db"/);
const lst = await call('GET', '/admin/backups', null, null, { 'X-Admin-Token': ADMIN }); assert.ok(lst.data.dbBytes > 0 && lst.data.backups.length >= 1);

// entretien : codes expirés supprimés
const c3 = await call('POST', '/auth/register', { phone: '20400003', password: 'motdepasse1', name: 'Cy', age: 30, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' });
await call('POST', '/auth/send-code', null, c3.data.token);
const side = new DatabaseSync(dbFile); side.prepare('UPDATE otp SET expires_at = 1').run(); side.close();
assert.equal(server.maintenance().otpDeleted, 1, 'code expiré purgé');

// export des données personnelles
const ex = await call('GET', '/account/export', null, A.t);
assert.equal(ex.status, 200); assert.equal(Object.keys(ex.data.answers).length, 50); assert.equal(ex.data.photos.length, 1);
assert.ok(!JSON.stringify(ex.data).includes('pass_hash') && !JSON.stringify(ex.data).includes('scrypt'), 'aucun secret dans l\'export');
assert.equal(ex.data.profile.name, 'Alice');
await call('GET', '/account/export', null, A.t); await call('GET', '/account/export', null, A.t);
assert.equal((await call('GET', '/account/export', null, A.t)).status, 429, 'export limité à 3 par jour');

server.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log('✓ données : migrations, sauvegarde, restauration, entretien, export');
