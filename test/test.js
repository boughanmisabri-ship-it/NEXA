import assert from 'node:assert/strict';
import { buildApp } from '../src/server.js';
import { questions } from '../src/questions.js';
import { computeMatch, buildTraits, isComplete } from '../src/engine.js';
import { makeLimiter, normalizePhone, passwordProblem } from '../src/security.js';
import { interludes, funProfile, sharedFun, FUN_HINT_ID } from '../src/interludes.js';
import { validateAnswers } from '../src/engine.js';
import { activeQuestions } from '../src/questions.js';

// --- Tests moteur ---------------------------------------------------------
const base = {};
for (const q of questions) base[q.id] = q.maxChoices > 0 ? [0, 1].slice(0, Math.min(2, q.maxChoices)) : [0];
base[47] = [];
assert.ok(isComplete(base), 'réponses complètes');
const same = computeMatch(base, base);
assert.equal(same.score, 100, 'identiques = 100 %');
assert.equal(Object.keys(buildTraits(base)).length, 10, '10 axes');

const noKids = structuredClone(base); noKids[31] = [4];          // "Non" aux enfants
const capped = computeMatch(base, noKids);
assert.ok(capped.score <= 60 && capped.warnings.length > 0, 'plafond enfants');

const db1 = structuredClone(base); db1[47] = [8];                  // deal-breaker : refus d'enfants
const blocked = computeMatch(db1, noKids);
assert.ok(blocked.blocks.includes("Refus d'avoir des enfants"), 'deal-breaker déclenché');
// Mini-quiz : bonus plafonné, jamais de malus, énigme non comparée, validation
const f0 = { ...base }; for (const it of interludes) f0[it.id] = [0];
const f1 = { ...base }; for (const it of interludes) f1[it.id] = [1];
const noFun = computeMatch(base, base), sameFun = computeMatch(f0, f0), diffFun = computeMatch(f0, f1);
assert.ok(sameFun.shared.length === 7 && sameFun.score >= noFun.score, 'goûts partagés comptés (7, énigme exclue)');
const tweak = structuredClone(base); for (const q of activeQuestions.slice(0, 18)) if (q.maxChoices === 0 && q.options.length > 2) tweak[q.id] = [2];
const withShared = computeMatch({ ...tweak, ...Object.fromEntries(interludes.map((i) => [i.id, [0]])) }, { ...base, ...Object.fromEntries(interludes.map((i) => [i.id, [0]])) });
const withoutShared = computeMatch({ ...tweak, ...Object.fromEntries(interludes.map((i) => [i.id, [0]])) }, { ...base, ...Object.fromEntries(interludes.map((i) => [i.id, [1]])) });
assert.ok(withoutShared.score < 90, 'profil de test volontairement moins proche : ' + withoutShared.score);
assert.equal(withShared.score - withoutShared.score, 4, 'bonus de 4 points maximum, sans malus');
assert.equal(diffFun.shared.length, 0);
assert.equal(activeQuestions.length, 40);
assert.ok(isComplete(Object.fromEntries(activeQuestions.map((q) => [q.id, [0]]))), 'complet avec les 40 questions actives seulement (mini-quiz facultatifs)');
const riddle = interludes.find((i) => i.kind === 'riddle');
assert.equal(funProfile({ [riddle.id]: [0] })[0].tag, 'Intuitif(ve)'); assert.equal(funProfile({ [riddle.id]: [0], [FUN_HINT_ID]: [1] })[0].tag, 'Persévérant(e)'); assert.equal(funProfile({ [riddle.id]: [2] })[0].tag, 'Rêveur(se) créatif(ve)');
assert.ok(!validateAnswers({ 101: [9] }).ok && !validateAnswers({ [FUN_HINT_ID]: [5] }).ok && validateAnswers({ 101: [2], [FUN_HINT_ID]: [1] }).ok, 'validation des réponses mini-quiz');
const lim = makeLimiter();
assert.ok([1, 2, 3].every(() => lim.allow('k', 3, 60000)) && !lim.allow('k', 3, 60000), 'limiteur : 4e requête refusée');
assert.equal(normalizePhone('20 123 456'), '+21620123456'); assert.equal(normalizePhone('0021620123456'), '+21620123456'); assert.equal(normalizePhone('12'), null);
assert.ok(passwordProblem('12345678') && passwordProblem('aaaaaaaa') && !passwordProblem('motdepasse1') && !passwordProblem('motdepasse2', '+21620765432') && passwordProblem('a20765432', '+21620765432'));
console.log('✓ moteur + sécurité (unitaire)');

// --- Tests API ------------------------------------------------------------
const server = buildApp({ dbFile: ':memory:', demo: true, secret: 'test', devCodes: true, msgPerMin: 1000 });
await new Promise((r) => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}`;
const call = async (method, path, body, token) => {
  const r = await fetch(url + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
};

assert.equal((await call('GET', '/health')).status, 200);
assert.equal((await call('GET', '/profile')).status, 401, 'auth requise');

const reg = await call('POST', '/auth/register', { phone: '+21620123456', password: 'motdepasse1', name: 'Sarah', age: 27, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' });
assert.equal(reg.status, 201);
const tok = reg.data.token;
assert.equal(reg.data.user.verified, false, 'compte non vérifié à la création');
assert.equal((await call('GET', '/questions', null, tok)).data.code, 'phone_unverified', 'accès bloqué avant vérification');
assert.equal((await call('POST', '/auth/verify-code', { code: '000000' }, tok)).status, 400, 'demande un code d\'abord');
const sc = await call('POST', '/auth/send-code', null, tok);
assert.equal(sc.status, 200); assert.match(sc.data.devCode, /^\d{6}$/);
assert.equal((await call('POST', '/auth/send-code', null, tok)).status, 429, 'renvoi trop rapide refusé');
const wrong = sc.data.devCode === '123456' ? '654321' : '123456';
assert.equal((await call('POST', '/auth/verify-code', { code: wrong }, tok)).status, 400, 'mauvais code refusé');
assert.equal((await call('POST', '/auth/verify-code', { code: sc.data.devCode }, tok)).status, 200, 'bon code accepté');
assert.equal((await call('GET', '/profile', null, tok)).data.user.verified, true);
assert.equal((await call('POST', '/auth/register', { phone: '+21620123456', password: 'motdepasse1', name: 'X', age: 27, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' })).status, 409, 'doublon');
assert.equal((await call('POST', '/auth/register', { phone: '+21620999999', password: 'motdepasse1', name: 'Mineur', age: 16, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' })).status, 400, 'mineur refusé');
assert.equal((await call('POST', '/auth/login', { phone: '+21620123456', password: 'faux' })).status, 401);
assert.equal((await call('POST', '/auth/login', { phone: '+21620123456', password: 'motdepasse1' })).status, 200);

const qs = await call('GET', '/questions', null, tok);
assert.equal(qs.data.questions.length, 40); assert.equal(qs.data.interludes.length, 8, '8 mini-quiz');
assert.equal((await call('GET', '/matches', null, tok)).status, 409, 'questionnaire requis');

const bad = await call('POST', '/answers', { answers: { 1: [99] } }, tok);
assert.equal(bad.status, 400, 'réponse invalide refusée');

const mine = {};
for (const q of questions) mine[q.id] = q.maxChoices > 0 ? [0, 1, 2].slice(0, Math.min(3, q.maxChoices)) : [q.id % q.options.length];
mine[47] = [];
const ans = await call('POST', '/answers', { answers: mine }, tok);
assert.equal(ans.status, 200);
assert.equal(ans.data.completed, true);

const an = await call('POST', '/compatibility/analyze', null, tok);
assert.equal(an.status, 200);
assert.equal(an.data.demoProfilesCreated, 8);
assert.ok(an.data.matches >= 3, `au moins 3 matchs (obtenu ${an.data.matches})`);

const m = await call('GET', '/matches', null, tok);
const list = m.data.matches;
console.log('  scores :', list.map((x) => (x.locked ? '🔒' : x.user.name) + ' ' + x.score + '%').join(' | '));
assert.ok(list.every((x) => x.score >= 80), 'seuil 80 %');
assert.ok(list.length <= 5);
assert.ok(list.slice(3).every((x) => x.locked), 'profils 4-5 masqués en gratuit');
assert.deepEqual([...list].map((x) => x.score), [...list].map((x) => x.score).sort((a, b) => b - a), 'tri décroissant');

const top = list[0];
const det = await call('GET', `/matches/${top.user.id}`, null, tok);
assert.equal(det.status, 200);
assert.equal(det.data.reasons.length, 3);

// Demande de connexion + acceptation auto (démo)
const con = await call('POST', `/connections/${top.user.id}`, null, tok);
assert.equal(con.status, 201);
assert.equal(con.data.status, 'accepted');
assert.equal((await call('POST', `/connections/${top.user.id}`, null, tok)).status, 409, 'doublon refusé');
assert.equal((await call('POST', '/connections/9999', null, tok)).status, 403, 'hors compatibilité refusé');
if (list.length > 3 && list[3].locked) {
  assert.equal((await call('GET', `/conversations`, null, tok)).data.conversations.length, 1);
}

// Chat : 50 messages gratuits
const convId = con.data.id;
let sent = 0, blockedAt = null;
for (let i = 0; i < 60; i++) {
  const r = await call('POST', `/conversations/${convId}/messages`, { text: `msg ${i}` }, tok);
  if (r.status === 402) { blockedAt = (await call('GET', `/conversations/${convId}/messages`, null, tok)).data.total; break; }
  assert.equal(r.status, 201); sent++;
}
assert.ok(blockedAt >= 50 && blockedAt <= 51, 'blocage à 50 messages (+1 réponse démo possible)');
const st = await call('GET', `/conversations/${convId}/messages`, null, tok);
assert.equal(st.data.canSend, false);
assert.equal((await call('POST', '/subscription', null, tok)).data.premium, true);
assert.equal((await call('POST', `/conversations/${convId}/messages`, { text: 'merci Premium' }, tok)).status, 201, 'Premium débloque le chat');
const m2 = await call('GET', '/matches', null, tok);
assert.ok(m2.data.matches.every((x) => !x.locked), 'Premium voit tous les profils');

// Notifications, signalement, blocage, isolation entre utilisateurs
assert.ok((await call('GET', '/notifications', null, tok)).data.notifications.length >= 2);
assert.equal((await call('POST', '/reports', { userId: top.user.id, reason: 'faux profil' }, tok)).status, 201);
const reg2 = await call('POST', '/auth/register', { phone: '+21620765432', password: 'motdepasse2', name: 'Amine', age: 30, city: 'Sfax', gender: 'Homme', lookingFor: 'Une femme' }, null)
const sc2 = await call('POST', '/auth/send-code', null, reg2.data.token);
await call('POST', '/auth/verify-code', { code: sc2.data.devCode }, reg2.data.token);
assert.equal((await call('GET', `/conversations/${convId}/messages`, null, reg2.data.token)).status, 404, 'conversation privée');
assert.equal((await call('POST', '/blocks', { userId: top.user.id }, tok)).status, 200);
const m3 = await call('GET', '/matches', null, tok);
assert.ok(!m3.data.matches.some((x) => x.user && x.user.id === top.user.id), 'profil bloqué disparaît');

// Sécurité : numéros, mots de passe, verrouillage, limites
const r3 = await call('POST', '/auth/register', { phone: '20333444', password: 'motdepasse3', name: 'Nour', age: 25, city: 'Sousse', gender: 'Femme', lookingFor: 'Un homme' });
assert.equal(r3.status, 201); assert.equal(r3.data.user.phone, '+21620333444', 'numéro normalisé en +216');
assert.equal((await call('POST', '/auth/register', { phone: '+216 20 333 444', password: 'motdepasse3', name: 'Dup', age: 25, city: 'Sousse', gender: 'Femme', lookingFor: 'Un homme' })).status, 409, 'doublon détecté malgré le format');
assert.equal((await call('POST', '/auth/register', { phone: '+21620555666', password: '12345678', name: 'Faible', age: 25, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' })).status, 400, 'mot de passe 100 % chiffres refusé');
assert.equal((await call('POST', '/auth/register', { phone: 'abc', password: 'motdepasse3', name: 'X', age: 25, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' })).status, 400, 'numéro invalide refusé');
assert.equal((await call('POST', '/auth/login', { phone: '20333444', password: 'motdepasse3' })).status, 200, 'connexion avec le format local');
for (let i = 0; i < 5; i++) assert.equal((await call('POST', '/auth/login', { phone: '20333444', password: 'faux' + i })).status, 401);
assert.equal((await call('POST', '/auth/login', { phone: '20333444', password: 'motdepasse3' })).status, 429, 'compte verrouillé après 5 échecs');

// Photos
const jpeg = (n = 2000) => 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1]), Buffer.alloc(n, 7)]).toString('base64');
assert.equal((await call('POST', '/photos', { image: 'data:image/jpeg;base64,' + Buffer.from('ceci est du texte, pas une image').toString('base64') }, tok)).status, 400, 'faux fichier refusé');
assert.equal((await call('POST', '/photos', { image: 'data:text/html;base64,PGI+' }, tok)).status, 400, 'type non autorisé refusé');
assert.equal((await call('POST', '/photos', { image: jpeg(1_200_000) }, tok)).status, 413, 'photo trop lourde refusée');
const up = await call('POST', '/photos', { image: jpeg() }, tok);
assert.equal(up.status, 201); const pid = up.data.id;
assert.equal((await call('GET', '/profile', null, tok)).data.user.photos.length, 1, 'photo visible dans le profil');
const raw = await fetch(`${url}/photos/${pid}`, { headers: { Authorization: `Bearer ${tok}` } });
assert.equal(raw.status, 200); assert.equal(raw.headers.get('content-type'), 'image/jpeg'); assert.equal(raw.headers.get('x-content-type-options'), 'nosniff');
assert.equal((await fetch(`${url}/photos/${pid}`)).status, 401, 'photo privée sans connexion');
assert.equal((await fetch(`${url}/photos/${pid}`, { headers: { Authorization: `Bearer ${reg2.data.token}` } })).status, 403, 'photo non accessible à un inconnu');
await call('POST', '/photos', { image: jpeg() }, tok); await call('POST', '/photos', { image: jpeg() }, tok);
assert.equal((await call('POST', '/photos', { image: jpeg() }, tok)).status, 409, '3 photos maximum');
assert.equal((await call('DELETE', `/photos/${pid}`, null, reg2.data.token)).status, 404, 'on ne supprime pas la photo d\'un autre');
assert.equal((await call('DELETE', `/photos/${pid}`, null, tok)).status, 200);
assert.equal((await fetch(`${url}/photos/${pid}`, { headers: { Authorization: `Bearer ${tok}` } })).status, 404);

// Exigence de photo (NEXA_REQUIRE_PHOTO)
{
  const s2 = buildApp({ dbFile: ':memory:', demo: false, secret: 'x', devCodes: true, requirePhoto: true });
  await new Promise((r) => s2.listen(0, r));
  const u2 = `http://127.0.0.1:${s2.address().port}`;
  const c2 = async (m, p, b, t) => { const r = await fetch(u2 + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json() }; };
  const rg = await c2('POST', '/auth/register', { phone: '20999888', password: 'motdepasse9', name: 'Test', age: 30, city: 'Tunis', gender: 'Femme', lookingFor: 'Un homme' });
  const t2 = rg.data.token; const cd = await c2('POST', '/auth/send-code', null, t2); await c2('POST', '/auth/verify-code', { code: cd.data.devCode }, t2);
  await c2('POST', '/answers', { answers: mine }, t2);
  const m1 = await c2('GET', '/matches', null, t2);
  assert.equal(m1.status, 409); assert.equal(m1.data.code, 'photo_required', 'photo exigée pour voir les matchs');
  await c2('POST', '/photos', { image: jpeg() }, t2);
  assert.equal((await c2('GET', '/matches', null, t2)).status, 200, 'accès après ajout de la photo');
  s2.close();
}

// Suppression de compte
assert.equal((await call('DELETE', '/account', null, tok)).status, 200);
assert.equal((await call('GET', '/profile', null, tok)).status, 401);

server.close();
console.log('✓ API : tous les tests passent');
