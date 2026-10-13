// Diagnostic : npm run check  → vérifie Node, SQLite, l'écriture disque et le démarrage complet du serveur.
const ok = (m) => console.log('✅', m), ko = (m) => { console.log('❌', m); process.exitCode = 1; };
const [maj, min] = process.versions.node.split('.').map(Number);
(maj > 22 || (maj === 22 && min >= 13)) ? ok(`Node ${process.versions.node}`) : ko(`Node ${process.versions.node} trop ancien (22.13 minimum)`);
try { await import('node:sqlite'); ok('SQLite intégré disponible'); } catch (e) { ko('SQLite indisponible : ' + e.message); }
try {
  const { buildApp } = await import('../src/server.js');
  const app = buildApp({ dbFile: ':memory:', demo: false, secret: 'check', devCodes: true });
  await new Promise((r) => app.listen(0, r));
  const r = await fetch(`http://127.0.0.1:${app.address().port}/health`);
  const h = await r.json();
  h.ok ? ok('Serveur démarré et base opérationnelle') : ko('Serveur démarré mais base en erreur');
  const page = await fetch(`http://127.0.0.1:${app.address().port}/`);
  page.ok ? ok('Page web servie') : ko('Page web introuvable (dossier public manquant ?)');
  app.close();
} catch (e) { ko('Démarrage impossible : ' + e.message); }
import('node:fs').then(({ default: fs }) => { try { fs.mkdirSync('data', { recursive: true }); fs.writeFileSync('data/.test', 'x'); fs.rmSync('data/.test'); ok('Écriture disque (dossier data) possible'); } catch (e) { ko('Écriture disque impossible : ' + e.message); } });
