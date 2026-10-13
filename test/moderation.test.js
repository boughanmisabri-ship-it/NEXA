import assert from 'node:assert/strict';
import { buildApp } from '../src/server.js';
import { questions } from '../src/questions.js';

const ADMIN = 'admintoken-1234567890';
const server = buildApp({ dbFile: ':memory:', demo: false, secret: 'm', devCodes: true, msgPerMin: 1000, adminToken: ADMIN });
await new Promise((r) => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}`;
const call = async (method, path, body, token, headers = {}) => {
  const r = await fetch(url + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
const admin = (m, p) => call(m, p, null, null, { 'X-Admin-Token': ADMIN });
const mine = {};
for (const q of questions) mine[q.id] = q.maxChoices > 0 ? [0, 1, 2].slice(0, Math.min(3, q.maxChoices)) : [q.id % q.options.length];
mine[47] = [];
const jpeg = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1]), Buffer.alloc(800, 9)]).toString('base64');

let n = 0;
async function user(name, gender, look, { complete = true } = {}) {
  const phone = `2${String(1000000 + ++n * 7919).padStart(7, '0')}`;
  const r = await call('POST', '/auth/register', { phone, password: 'motdepasse1', name, age: 28, city: 'Tunis', gender, lookingFor: look });
  const t = r.data.token;
  const c = await call('POST', '/auth/send-code', null, t); await call('POST', '/auth/verify-code', { code: c.data.devCode }, t);
  if (complete) { await call('POST', '/answers', { answers: mine }, t); }
  const p = await call('POST', '/photos', { image: jpeg }, t);
  return { t, id: r.data.user.id, photo: p.data.id };
}
const W = await user('Sarah', 'Femme', 'Un homme');
const M = [await user('Amine', 'Homme', 'Une femme'), await user('Yassine', 'Homme', 'Une femme'), await user('Karim', 'Homme', 'Une femme')];
const X = await user('Inconnu', 'Homme', 'Une femme', { complete: false });

// 1. Seuls ceux qui ont vu un profil peuvent le signaler
assert.equal((await call('POST', '/reports', { userId: W.id, category: 'harcelement' }, X.t)).status, 403, 'signalement impossible sans avoir vu le profil');
assert.equal((await call('POST', '/reports', { userId: W.id, category: 'nimporte' }, M[0].t)).status, 400, 'catégorie invalide');
assert.equal((await call('GET', '/report-categories', null, M[0].t)).data.categories.length, 6);

// 2. Suspension automatique : 3 signaleurs DIFFÉRENTS
const r1 = await call('POST', '/reports', { userId: W.id, category: 'harcelement', details: 'insultes' }, M[0].t);
assert.equal(r1.status, 201); assert.equal(r1.data.action, null);
assert.equal((await call('POST', '/reports', { userId: W.id, category: 'harcelement' }, M[0].t)).data.duplicate, true, 'même signaleur : pas de double compte');
assert.equal((await call('GET', '/profile', null, W.t)).data.user.suspended, false, 'un seul compte ne suspend pas');
await call('POST', '/reports', { userId: W.id, category: 'harcelement' }, M[1].t);
const r3 = await call('POST', '/reports', { userId: W.id, category: 'faux_profil' }, M[2].t);
assert.equal(r3.data.action, 'suspended', '3 signaleurs différents -> suspension');
assert.equal((await call('GET', '/matches', null, W.t)).data.code, 'suspended', 'compte suspendu bloqué');
assert.equal((await call('GET', '/profile', null, W.t)).data.user.suspended, true, 'profil lisible pour afficher le message');
assert.ok(!(await call('GET', '/matches', null, M[0].t)).data.matches.some((m) => m.user && m.user.id === W.id), 'compte suspendu invisible des autres');

// 3. Recours
assert.equal((await call('POST', '/appeal', { text: 'Je pense que c\'est une erreur.' }, W.t)).status, 201);
assert.equal((await call('POST', '/appeal', { text: 'encore' }, W.t)).status, 409, 'un recours à la fois');
assert.equal((await call('POST', '/appeal', { text: 'x' }, M[0].t)).status, 400, 'recours réservé aux comptes suspendus');

// 4. Administration
assert.equal((await call('GET', '/admin/overview')).status, 401, 'admin sans jeton refusé');
assert.equal((await call('GET', '/admin/overview', null, null, { 'X-Admin-Token': 'faux-jeton-faux-jeton' })).status, 401, 'mauvais jeton refusé');
const ov = await admin('GET', '/admin/overview');
assert.equal(ov.status, 200); assert.equal(ov.data.reported[0].reporters, 3); assert.equal(ov.data.appeals.length, 1);
const adminPage = await fetch(url + '/admin'); assert.equal(adminPage.status, 200); assert.ok((await adminPage.text()).includes('Modération'));
assert.equal((await admin('POST', `/admin/users/${W.id}/unsuspend`)).status, 200);
assert.equal((await call('GET', '/matches', null, W.t)).status, 200, 'compte réactivé');
assert.equal((await admin('GET', '/admin/overview')).data.reported.length, 0, 'signalements classés après réactivation');

// 5. Règle anti-arnaque : pas de lien au début d'une conversation
const con = await call('POST', `/connections/${W.id}`, null, M[0].t); assert.equal(con.status, 201);
const inc = await call('GET', '/connections/incoming', null, W.t);
await call('POST', `/connections/${inc.data.requests[0].id}/accept`, null, W.t);
const msg = (t, text) => call('POST', `/conversations/${con.data.id}/messages`, { text }, t);
assert.equal((await msg(W.t, 'Clique ici http://arnaque.example/gagner')).status, 400, 'lien refusé');
assert.equal((await msg(W.t, 'va sur promo-gratuite.com')).status, 400, 'nom de domaine refusé');
assert.equal((await msg(W.t, 'Salut, ça va ?')).status, 201, 'message normal accepté');

// 6. Photo signalée par 2 personnes différentes -> masquée
await call('POST', '/reports', { userId: W.id, category: 'contenu_inapproprie', photoId: W.photo }, M[0].t);
assert.equal((await fetch(`${url}/photos/${W.photo}`, { headers: { Authorization: `Bearer ${M[2].t}` } })).status, 200, 'photo encore visible avec 1 signalement');
await call('POST', '/reports', { userId: W.id, category: 'contenu_inapproprie', photoId: W.photo }, M[1].t);
assert.equal((await fetch(`${url}/photos/${W.photo}`, { headers: { Authorization: `Bearer ${M[2].t}` } })).status, 404, 'photo masquée aux autres');
assert.equal((await fetch(`${url}/photos/${W.photo}`, { headers: { Authorization: `Bearer ${W.t}` } })).status, 200, 'le propriétaire la voit encore');
assert.equal((await call('GET', '/profile', null, W.t)).data.user.photos.length, 0, 'plus listée publiquement');
assert.ok((await call('GET', '/notifications', null, W.t)).data.notifications.some((x) => x.text.includes('masquée')), 'propriétaire prévenu');
assert.equal((await admin('POST', `/admin/photos/${W.photo}/show`)).status, 200);
assert.equal((await fetch(`${url}/photos/${W.photo}`, { headers: { Authorization: `Bearer ${M[2].t}` } })).status, 200, 'photo réaffichée par l\'admin');

// 7. Catégories graves : 2 signaleurs suffisent
// (on repart d'un compte propre pour isoler la règle « catégorie grave »)
await admin('POST', `/admin/users/${W.id}/unsuspend`);
await admin('POST', `/admin/users/${W.id}/dismiss`);
assert.equal((await call('GET', '/profile', null, W.t)).data.user.suspended, false);
assert.equal((await call('POST', '/reports', { userId: W.id, category: 'arnaque' }, M[2].t)).data.action, null, '1 signalement grave ne suspend pas');
const sv = await call('POST', '/reports', { userId: W.id, category: 'arnaque' }, M[0].t);
assert.equal(sv.data.action, 'suspended', '2 signaleurs « arnaque » (2 seulement) -> suspension');

// 8. Blocage / déblocage
assert.equal((await call('POST', '/blocks', { userId: W.id }, M[1].t)).status, 200);
assert.equal((await call('GET', '/blocks', null, M[1].t)).data.blocked[0].id, W.id);
assert.equal((await call('DELETE', `/blocks/${W.id}`, null, M[1].t)).status, 200);
assert.equal((await call('GET', '/blocks', null, M[1].t)).data.blocked.length, 0);

server.close();
console.log('✓ modération : tous les tests passent');
