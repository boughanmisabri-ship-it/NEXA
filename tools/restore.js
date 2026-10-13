// Restaure la base depuis une sauvegarde : npm run restore -- chemin/sauvegarde.db
// (arrête le serveur avant ; l'ancienne base est conservée à côté en « .avant-restauration-… »)
import { restoreBackup } from '../src/backup.js';
const source = process.argv[2];
if (!source) { console.error('Usage : npm run restore -- chemin/vers/sauvegarde.db'); process.exit(1); }
const info = restoreBackup(source, process.env.NEXA_DB || 'data/nexa.db');
console.log(`Base restaurée : ${info.users} utilisateur(s), schéma v${info.schemaVersion}.`);
