import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

/** Copie cohérente de la base (même pendant l'utilisation) via VACUUM INTO, puis vérification. */
export function createBackup(db, dir, prefix = 'nexa-auto') {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${prefix}-${stamp()}.db`);
  if (fs.existsSync(file)) return file;
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const info = verifyBackup(file);
  if (!info.ok) { fs.rmSync(file, { force: true }); throw new Error('Sauvegarde invalide : ' + info.error); }
  return file;
}

/** Ouvre une sauvegarde en lecture seule : intégrité + nombre d'utilisateurs. */
export function verifyBackup(file) {
  let db;
  try {
    db = new DatabaseSync(file, { readOnly: true });
    const q = Object.values(db.prepare('PRAGMA integrity_check').get())[0];
    if (q !== 'ok') return { ok: false, error: 'intégrité : ' + q };
    const users = db.prepare('SELECT COUNT(*) n FROM users').get().n;
    const version = db.prepare('SELECT MAX(version) v FROM schema_version').get().v;
    return { ok: true, users, schemaVersion: version };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally { if (db) db.close(); }
}

export function listBackups(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^nexa-auto-.*\.db$/.test(f)).map((f) => {
    const st = fs.statSync(path.join(dir, f));
    return { name: f, size: st.size, date: st.mtime.toISOString() };
  }).sort((a, b) => b.name.localeCompare(a.name));
}

/** Garde les `keep` sauvegardes automatiques les plus récentes. */
export function pruneBackups(dir, keep = 7) {
  for (const b of listBackups(dir).slice(keep)) fs.rmSync(path.join(dir, b.name), { force: true });
}

/** Remplace la base `target` par la sauvegarde `source` (après vérification et copie de sécurité). */
export function restoreBackup(source, target) {
  const info = verifyBackup(source);
  if (!info.ok) throw new Error('Sauvegarde inutilisable : ' + info.error);
  if (fs.existsSync(target)) fs.copyFileSync(target, `${target}.avant-restauration-${stamp()}`);
  for (const ext of ['-wal', '-shm']) fs.rmSync(target + ext, { force: true });
  fs.copyFileSync(source, target);
  return info;
}
