// Crée une sauvegarde de la base : npm run backup
import { openDb } from '../src/db.js';
import { createBackup, pruneBackups } from '../src/backup.js';
import path from 'node:path';
const file = process.env.NEXA_DB || 'data/nexa.db';
const dir = process.env.NEXA_BACKUP_DIR || path.join(path.dirname(file), 'backups');
const db = openDb(file);
const f = createBackup(db, dir);
pruneBackups(dir, Number(process.env.NEXA_BACKUP_KEEP || 7));
console.log('Sauvegarde créée :', f);
