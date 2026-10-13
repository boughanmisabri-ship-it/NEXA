// Point d'entrée. Vérifie d'abord la version de Node pour donner un message clair (visible dans les logs de l'hébergeur).
const [maj, min] = process.versions.node.split('.').map(Number);
console.log(`NEXA : Node ${process.versions.node}, base ${process.env.NEXA_DB || 'data/nexa.db'}`);
if (maj < 22 || (maj === 22 && min < 13)) {
  console.error(`ERREUR : Node ${process.versions.node} est trop ancien. NEXA demande Node 22.13 ou plus (SQLite intégré).`);
  console.error('Sur Render : ajoute la variable NODE_VERSION = 22.16.0 (ou un fichier .node-version contenant 22.16.0).');
  process.exit(1);
}

let app;
try {
  const { buildApp } = await import('./server.js');
  app = buildApp();
} catch (e) {
  console.error('ERREUR au démarrage :', e.message);
  if (/endommag|corrupt|not a database/i.test(e.message)) console.error('La base semble abîmée : restaure une sauvegarde (npm run restore -- fichier.db).');
  process.exit(1);
}

const port = Number(process.env.PORT || 3000);
const demo = process.env.NEXA_DEMO === '1';
app.listen(port, '0.0.0.0', () => {
  console.log(`NEXA backend prêt sur http://0.0.0.0:${port}${demo ? '  (mode DÉMO : profils simulés activés)' : ''}`);
  if (process.env.NEXA_DEV_CODES === '1') console.log('ATTENTION : NEXA_DEV_CODES=1 → les codes SMS sont affichés à l\'écran (test uniquement).');
});
app.on('error', (e) => { console.error('ERREUR serveur :', e.message); process.exit(1); });

// Entretien : une sauvegarde au démarrage (si la dernière date de plus de 23 h) puis toutes les 6 h, et nettoyage quotidien.
const job = () => {
  try { const b = app.backupNow(); if (b) console.log('Sauvegarde créée :', b); app.maintenance(); }
  catch (e) { console.error('Entretien/sauvegarde :', e.message); }
};
job();
setInterval(job, 6 * 3600000).unref();
