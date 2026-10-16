import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { openDb } from './db.js';
import { createBackup, listBackups, pruneBackups } from './backup.js';
import { normalizePhone, passwordProblem, makeLimiter, genCode, hashCode, sendSms } from './security.js';
import { activeQuestions } from './questions.js';
import { interludes, funProfile } from './interludes.js';
import { QUESTIONS_VERSION, ANSWER_MAP } from './answer_map.js';
import {
  buildTraits, computeMatch, isComplete, validateAnswers, demoAnswerSets,
  DEMO_NAMES, DEMO_CITIES, MATCH_THRESHOLD,
} from './engine.js';

export const FREE_MESSAGES = 50;
export const FREE_VISIBLE = 3;
export const MAX_PHOTOS = 3;
export const REPORT_CATEGORIES = {
  faux_profil: 'Faux profil ou photos d\'une autre personne',
  harcelement: 'Harcèlement ou insultes',
  contenu_inapproprie: 'Contenu inapproprié',
  arnaque: 'Arnaque ou demande d\'argent',
  mineur: 'Personne mineure',
  autre: 'Autre',
};
const SEVERE = new Set(['mineur', 'arnaque']);
const SEVERE_THRESHOLD = 2;
const MAX_PHOTO_BYTES = 1_000_000;

/** Détecte le vrai format d'une image par ses premiers octets (JPEG, PNG, WebP). */
export function sniffImage(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}
const FREE_LIMIT = 5;
const PREMIUM_LIMIT = 20;
const DEMO_REPLIES = ['Salut ! NEXA nous a rapprochés 😊', 'Haha, raconte-moi plus !', 'Moi aussi, j\'adore ça.', 'On devrait se parler de vive voix bientôt.', 'Quelle est ta ville préférée en Tunisie ?'];

class HttpError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra; }
}
const bad = (m) => new HttpError(400, m);

export function buildApp({ dbFile = process.env.NEXA_DB || 'data/nexa.db', demo = process.env.NEXA_DEMO === '1', fakePayment = process.env.NEXA_PAYMENT !== 'off', secret,
  threshold = Number(process.env.NEXA_THRESHOLD || MATCH_THRESHOLD), anyone = process.env.NEXA_ANYONE === '1',
  devCodes = process.env.NEXA_DEV_CODES === '1', smsProvider = process.env.NEXA_SMS || 'console', msgPerMin = Number(process.env.NEXA_MSG_PER_MIN || 20),
  requirePhoto = process.env.NEXA_REQUIRE_PHOTO === '1',
  adminToken = process.env.NEXA_ADMIN_TOKEN || '', backupDir, backupKeep = Number(process.env.NEXA_BACKUP_KEEP || 7), reportThreshold = Number(process.env.NEXA_REPORT_THRESHOLD || 3) } = {}) {
  const db = openDb(dbFile);
  const BACKUP_DIR = backupDir || process.env.NEXA_BACKUP_DIR || (dbFile === ':memory:' ? null : path.join(path.dirname(dbFile), 'backups'));
  const SECRET = secret || process.env.NEXA_SECRET || (() => {
    if (dbFile === ':memory:') return crypto.randomBytes(32).toString('hex');
    const f = path.join(path.dirname(dbFile), 'secret.txt');
    if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
    return fs.readFileSync(f, 'utf8');
  })();

  // ------------------------------------------------------------ helpers
  const q = (sql, ...p) => db.prepare(sql).all(...p);
  const one = (sql, ...p) => db.prepare(sql).get(...p);
  const run = (sql, ...p) => db.prepare(sql).run(...p);

  const b64 = (b) => Buffer.from(b).toString('base64url');
  const sign = (payload) => {
    const body = b64(JSON.stringify(payload));
    return `${body}.${crypto.createHmac('sha256', SECRET).update(body).digest('base64url')}`;
  };
  const verify = (token) => {
    const [body, sig] = (token || '').split('.');
    if (!body || !sig) return null;
    const exp = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    const a = Buffer.from(sig), c = Buffer.from(exp);
    if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  };
  const hashPw = (pw) => { const s = crypto.randomBytes(16); return `${s.toString('hex')}:${crypto.scryptSync(pw, s, 64).toString('hex')}`; };
  const checkPw = (pw, stored) => {
    const [s, h] = stored.split(':');
    const x = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 64);
    return crypto.timingSafeEqual(x, Buffer.from(h, 'hex'));
  };

  const limiter = makeLimiter();
  const tooMany = (msg = 'Trop de requêtes, réessaie plus tard') => new HttpError(429, msg);

  const answersOf = (uid) => {
    const out = {};
    for (const r of q('SELECT question_id, selected FROM answers WHERE user_id = ?', uid)) out[r.question_id] = JSON.parse(r.selected);
    return out;
  };
  const notify = (uid, text) => run('INSERT INTO notifications (user_id, text) VALUES (?, ?)', uid, text);
  const photoIds = (uid) => q('SELECT id FROM photos WHERE user_id = ? AND hidden = 0 ORDER BY position, id', uid).map((r) => r.id);
  const pub = (u) => ({ id: u.id, name: u.name, age: u.age, city: u.city, bio: u.bio, photos: photoIds(u.id) });
  const me_ = (u) => ({ ...pub(u), phone: u.phone, gender: u.gender, lookingFor: u.looking_for, premium: !!u.premium, completed: !!u.completed, verified: !!u.verified, suspended: !!u.suspended });
  const isBlocked = (a, b) => !!one('SELECT 1 x FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)', a, b, b, a);

  /** Meilleures correspondances (>= seuil, 75 % par défaut, deal-breakers exclus), triées. */
  function matchesFor(me) {
    const myAns = answersOf(me.id);
    const wantGender = me.looking_for === 'Un homme' ? 'Homme' : 'Femme';
    const wantsMe = me.gender === 'Homme' ? 'Un homme' : 'Une femme';
    const photoClause = requirePhoto ? ' AND EXISTS (SELECT 1 FROM photos ph WHERE ph.user_id = users.id)' : '';
    const rows = anyone
      ? q(`SELECT * FROM users WHERE id != ? AND completed = 1 AND is_demo = 0 AND suspended = 0
          AND id NOT IN (SELECT blocked_id FROM blocks WHERE user_id = ?)
          AND id NOT IN (SELECT user_id FROM blocks WHERE blocked_id = ?)` + photoClause, me.id, me.id, me.id)
      : q(`SELECT * FROM users WHERE id != ? AND gender = ? AND looking_for = ? AND completed = 1 AND suspended = 0
          AND id NOT IN (SELECT blocked_id FROM blocks WHERE user_id = ?)
          AND id NOT IN (SELECT user_id FROM blocks WHERE blocked_id = ?)` + photoClause, me.id, wantGender, wantsMe, me.id, me.id);
    const out = [];
    for (const u of rows) {
      const r = computeMatch(myAns, answersOf(u.id));
      if (r.blocks.length === 0 && r.score >= threshold) out.push({ user: u, ...r });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, me.premium ? PREMIUM_LIMIT : FREE_LIMIT);
  }

  function spawnDemo(me) {
    const mine = answersOf(me.id);
    const gender = me.looking_for === 'Un homme' ? 'Homme' : 'Femme';
    const wants = me.gender === 'Homme' ? 'Un homme' : 'Une femme';
    if (one('SELECT COUNT(*) n FROM users WHERE demo_for = ?', me.id).n > 0) return 0;
    const sets = demoAnswerSets(mine, me.id);
    const ins = db.prepare(`INSERT INTO users (phone, pass_hash, name, age, city, gender, looking_for, bio, completed, is_demo, demo_for, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 1)`);
    const insA = db.prepare('INSERT INTO answers (user_id, question_id, selected) VALUES (?, ?, ?)');
    let n = 0;
    sets.forEach((ans, i) => {
      const r = ins.run(`demo-${crypto.randomBytes(5).toString('hex')}`, hashPw(crypto.randomBytes(8).toString('hex')),
        DEMO_NAMES[gender][i], 24 + ((me.id + i * 3) % 10), DEMO_CITIES[(me.id + i) % DEMO_CITIES.length], gender, wants,
        'Profil de démonstration simulé.', me.id);
      for (const [qid, sel] of Object.entries(ans)) insA.run(r.lastInsertRowid, Number(qid), JSON.stringify(sel));
      n++;
    });
    return n;
  }

  function connectionFor(userId, connId) {
    const c = one('SELECT * FROM connections WHERE id = ?', connId);
    if (!c || (c.from_id !== userId && c.to_id !== userId)) throw new HttpError(404, 'Conversation introuvable');
    return c;
  }

  // ------------------------------------------------------------ routes
  const routes = [];
  const route = (method, pattern, handler, auth = true, open = false) =>
    routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler, auth, open });

  route('GET', '/health', () => {
    const b = BACKUP_DIR ? listBackups(BACKUP_DIR)[0] : null;
    return { ok: !!one('SELECT 1 x'), demo, version: '0.1.0', lastBackup: b ? b.date : null };
  }, false);

  route('POST', '/auth/register', ({ body, ip }) => {
    if (!limiter.allow('ip:' + ip, 30, 60000)) throw tooMany('Trop de tentatives, réessaie dans une minute');
    if (limiter.count('reg:' + ip, 3600000) >= 8) throw tooMany('Trop de comptes créés depuis cette connexion. Réessaie plus tard.');
    const { password, name, age, city, gender, lookingFor } = body;
    const phone = normalizePhone(body.phone);
    if (!phone) throw bad('Numéro de téléphone invalide (ex. +21620123456 ou 20123456)');
    const pw = passwordProblem(password, phone);
    if (pw) throw bad(pw);
    if (typeof name !== 'string' || !name.trim() || name.length > 40) throw bad('Prénom invalide');
    if (!Number.isInteger(age) || age < 18 || age > 99) throw bad('Âge invalide (18 ans minimum)');
    if (typeof city !== 'string' || !city.trim()) throw bad('Ville invalide');
    if (!['Femme', 'Homme'].includes(gender)) throw bad('Genre invalide');
    if (!['Un homme', 'Une femme'].includes(lookingFor)) throw bad('Recherche invalide');
    if (one('SELECT 1 x FROM users WHERE phone = ?', phone)) throw new HttpError(409, 'Ce numéro est déjà inscrit');
    const r = run('INSERT INTO users (phone, pass_hash, name, age, city, gender, looking_for) VALUES (?,?,?,?,?,?,?)',
      phone, hashPw(password), name.trim(), age, city.trim(), gender, lookingFor);
    const id = Number(r.lastInsertRowid);
    limiter.add('reg:' + ip);
    return [201, { token: sign({ uid: id, exp: Date.now() + 30 * 864e5 }), user: me_(one('SELECT * FROM users WHERE id = ?', id)) }];
  }, false);

  route('POST', '/auth/login', ({ body, ip }) => {
    if (!limiter.allow('ip:' + ip, 30, 60000)) throw tooMany('Trop de tentatives, réessaie dans une minute');
    const phone = normalizePhone(body.phone) || '';
    const lockKey = 'fail:' + phone;
    if (limiter.count(lockKey, 15 * 60000) >= 5) throw tooMany('Trop d\'échecs. Réessaie dans 15 minutes.');
    const u = one('SELECT * FROM users WHERE phone = ? AND is_demo = 0', phone);
    if (!u || !checkPw(String(body.password || ''), u.pass_hash)) {
      limiter.add(lockKey);
      throw new HttpError(401, 'Identifiants incorrects');
    }
    limiter.reset(lockKey);
    return { token: sign({ uid: u.id, exp: Date.now() + 30 * 864e5 }), user: me_(u) };
  }, false);

  // Vérification du numéro par code SMS à 6 chiffres (valable 10 min, 5 essais, 5 envois par heure).
  route('POST', '/auth/send-code', async ({ user }) => {
    if (user.verified) return { sent: false, verified: true };
    const now = Date.now();
    const o = one('SELECT * FROM otp WHERE user_id = ?', user.id);
    if (o && now - o.last_sent < 60000) throw tooMany(`Attends ${Math.ceil((60000 - (now - o.last_sent)) / 1000)} secondes avant de redemander un code`);
    let count = 1, windowStart = now;
    if (o && now - o.window_start < 3600000) {
      if (o.sent_count >= 5) throw tooMany('Trop de codes demandés. Réessaie dans une heure.');
      count = o.sent_count + 1; windowStart = o.window_start;
    }
    const code = genCode();
    try { await sendSms(user.phone, `NEXA : ton code de vérification est ${code}. Il expire dans 10 minutes.`, smsProvider); }
    catch (e) { console.error('SMS', e.message); throw new HttpError(502, "Impossible d'envoyer le SMS pour le moment. Réessaie dans quelques minutes."); }
    run(`INSERT INTO otp (user_id, code_hash, expires_at, attempts, last_sent, sent_count, window_start) VALUES (?,?,?,0,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0,
      last_sent = excluded.last_sent, sent_count = excluded.sent_count, window_start = excluded.window_start`,
      user.id, hashCode(code, SECRET), now + 600000, now, count, windowStart);
    return { sent: true, resendIn: 60, ...(devCodes ? { devCode: code } : {}) };
  }, true, true);

  route('POST', '/auth/verify-code', ({ user, body }) => {
    if (user.verified) return { verified: true };
    const o = one('SELECT * FROM otp WHERE user_id = ?', user.id);
    if (!o) throw bad("Demande d'abord un code");
    if (Date.now() > o.expires_at) throw new HttpError(410, 'Code expiré, demande-en un nouveau');
    if (o.attempts >= 5) throw tooMany('Trop d\'essais. Demande un nouveau code.');
    const given = Buffer.from(hashCode(String(body.code || '').trim(), SECRET)), real = Buffer.from(o.code_hash);
    if (!crypto.timingSafeEqual(given, real)) {
      run('UPDATE otp SET attempts = attempts + 1 WHERE user_id = ?', user.id);
      throw bad('Code incorrect');
    }
    run('UPDATE users SET verified = 1 WHERE id = ?', user.id);
    run('DELETE FROM otp WHERE user_id = ?', user.id);
    return { verified: true };
  }, true, true);


  // Export des données personnelles de l'utilisateur (droit d'accès / portabilité).
  route('GET', '/account/export', ({ user }) => {
    if (!limiter.allow('export:' + user.id, 3, 86400000)) throw tooMany('3 exports par jour maximum.');
    const conns = q('SELECT * FROM connections WHERE from_id = ? OR to_id = ?', user.id, user.id);
    return {
      exportedAt: new Date().toISOString(),
      profile: { name: user.name, phone: user.phone, age: user.age, city: user.city, gender: user.gender, lookingFor: user.looking_for, bio: user.bio, premium: !!user.premium, createdAt: user.created_at },
      answers: answersOf(user.id),
      photos: q('SELECT id, mime, length(data) AS bytes, hidden FROM photos WHERE user_id = ?', user.id),
      connections: conns.map((c) => ({ id: c.id, with: c.from_id === user.id ? c.to_id : c.from_id, direction: c.from_id === user.id ? 'envoyée' : 'reçue', status: c.status, score: c.score, createdAt: c.created_at })),
      messages: conns.flatMap((c) => q('SELECT sender_id, text, created_at FROM messages WHERE connection_id = ? ORDER BY id', c.id).map((m) => ({ connection: c.id, mine: m.sender_id === user.id, text: m.text, createdAt: m.created_at }))),
      reportsMade: q('SELECT category, details, status, created_at FROM reports WHERE reporter_id = ?', user.id),
      notifications: q('SELECT text, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 200', user.id),
    };
  }, true, true);

  route('GET', '/profile', ({ user }) => {
    const ans = answersOf(user.id);
    return { user: me_(user), traits: user.completed ? buildTraits(ans) : {}, fun: funProfile(ans) };
  }, true, true);

  route('PUT', '/profile', ({ user, body }) => {
    const name = body.name ?? user.name, city = body.city ?? user.city, bio = body.bio ?? user.bio;
    const age = body.age ?? user.age;
    if (typeof name !== 'string' || !name.trim() || name.length > 40) throw bad('Prénom invalide');
    if (!Number.isInteger(age) || age < 18 || age > 99) throw bad('Âge invalide');
    if (typeof bio !== 'string' || bio.length > 300) throw bad('Bio : 300 caractères maximum');
    run('UPDATE users SET name = ?, city = ?, bio = ?, age = ? WHERE id = ?', name.trim(), String(city).trim(), bio, age, user.id);
    return { user: me_(one('SELECT * FROM users WHERE id = ?', user.id)) };
  });

  route('DELETE', '/account', ({ user }) => {
    run('DELETE FROM users WHERE demo_for = ?', user.id);
    run('DELETE FROM users WHERE id = ?', user.id);
    return { deleted: true };
  }, true, true);

  route('GET', '/questions', () => ({
    questions: activeQuestions.map(({ id, dim, text, options, maxChoices, key }) => ({ id, dim, text, options, maxChoices, key })),
    interludes,
    version: QUESTIONS_VERSION,
    answerMap: ANSWER_MAP,
  }));

  route('GET', '/answers', ({ user }) => ({ answers: answersOf(user.id), version: QUESTIONS_VERSION }));

  route('POST', '/answers', ({ user, body }) => {
    const v = validateAnswers(body.answers);
    if (!v.ok) throw bad(v.error);
    const up = db.prepare('INSERT INTO answers (user_id, question_id, selected) VALUES (?,?,?) ON CONFLICT(user_id, question_id) DO UPDATE SET selected = excluded.selected');
    db.exec('BEGIN');
    try {
      for (const [qid, sel] of Object.entries(v.answers)) up.run(user.id, Number(qid), JSON.stringify(sel));
      const all = answersOf(user.id);
      run('UPDATE users SET completed = ? WHERE id = ?', isComplete(all) ? 1 : 0, user.id);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    const all = answersOf(user.id);
    return { completed: isComplete(all), answered: Object.keys(all).length, traits: buildTraits(all) };
  });

  route('POST', '/compatibility/analyze', ({ user }) => {
    if (!user.completed) throw new HttpError(409, 'Termine d\'abord le questionnaire');
    const spawned = demo ? spawnDemo(user) : 0;
    const count = matchesFor(user).length;
    notify(user.id, count ? `NEXA a trouvé ${count} personne(s) compatible(s) avec toi.` : `NEXA continue de chercher : aucune personne ≥ ${threshold} % pour l'instant.`);
    return { traits: buildTraits(answersOf(user.id)), matches: count, demoProfilesCreated: spawned };
  });

  const present = (m, idx, me) => {
    const locked = idx >= FREE_VISIBLE && !me.premium;
    if (locked) return { locked: true, score: m.score };
    return { locked: false, score: m.score, user: pub(m.user), dims: m.dims, reasons: m.reasons, warnings: m.warnings, shared: m.shared };
  };

  route('GET', '/matches', ({ user }) => {
    if (!user.completed) throw new HttpError(409, 'Termine d\'abord le questionnaire');
    if (requirePhoto && photoIds(user.id).length === 0) throw new HttpError(409, 'Ajoute au moins une photo pour voir tes compatibilités', { code: 'photo_required' });
    const list = matchesFor(user);
    return { threshold, matches: list.map((m, i) => present(m, i, user)) };
  });

  route('GET', '/matches/:id', ({ user, params }) => {
    const list = matchesFor(user);
    const i = list.findIndex((m) => m.user.id === Number(params.id));
    if (i < 0) throw new HttpError(404, 'Ce profil ne fait pas partie de tes compatibilités');
    if (i >= FREE_VISIBLE && !user.premium) throw new HttpError(402, 'Profil réservé aux abonnés Premium', { code: 'premium_required' });
    const conn = one('SELECT * FROM connections WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)', user.id, list[i].user.id, list[i].user.id, user.id);
    return { ...present(list[i], i, user), connection: conn ? { id: conn.id, status: conn.status, mine: conn.from_id === user.id } : null };
  });

  route('POST', '/connections/:userId', ({ user, params }) => {
    const target = Number(params.userId);
    if (!limiter.allow('conn:' + user.id, 15, 86400000)) throw tooMany('Limite de 15 demandes par jour atteinte.');
    const list = matchesFor(user);
    const i = list.findIndex((m) => m.user.id === target);
    if (i < 0) throw new HttpError(403, 'Tu ne peux contacter que tes compatibilités (≥ ' + threshold + ' %)');
    if (i >= FREE_VISIBLE && !user.premium) throw new HttpError(402, 'Profil réservé aux abonnés Premium', { code: 'premium_required' });
    if (isBlocked(user.id, target)) throw new HttpError(403, 'Action impossible');
    if (one('SELECT 1 x FROM connections WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)', user.id, target, target, user.id)) {
      throw new HttpError(409, 'Une demande existe déjà avec cette personne');
    }
    const m = list[i];
    const r = run('INSERT INTO connections (from_id, to_id, score) VALUES (?,?,?)', user.id, target, m.score);
    const id = Number(r.lastInsertRowid);
    notify(target, `Quelqu'un souhaite faire connaissance avec toi. Compatibilité : ${m.score} %.`);
    if (demo && m.user.is_demo) { // acceptation automatique des profils simulés
      run("UPDATE connections SET status = 'accepted' WHERE id = ?", id);
      run('INSERT INTO messages (connection_id, sender_id, text) VALUES (?,?,?)', id, target, DEMO_REPLIES[0]);
      notify(user.id, `${m.user.name} a accepté ta demande. La conversation est ouverte.`);
    }
    return [201, { id, status: one('SELECT status FROM connections WHERE id = ?', id).status }];
  });

  route('GET', '/connections/incoming', ({ user }) => ({
    requests: q(`SELECT c.id, c.score, c.created_at, u.id uid, u.name, u.age, u.city, u.bio FROM connections c
      JOIN users u ON u.id = c.from_id WHERE c.to_id = ? AND c.status = 'pending' AND u.suspended = 0 ORDER BY c.id DESC`, user.id)
      .map((r) => ({ id: r.id, score: r.score, createdAt: r.created_at, user: { id: r.uid, name: r.name, age: r.age, city: r.city, bio: r.bio } })),
  }));

  const decide = (status) => ({ user, params }) => {
    const c = one('SELECT * FROM connections WHERE id = ?', Number(params.id));
    if (!c || c.to_id !== user.id) throw new HttpError(404, 'Demande introuvable');
    if (c.status !== 'pending') throw new HttpError(409, 'Demande déjà traitée');
    run('UPDATE connections SET status = ? WHERE id = ?', status, c.id);
    if (status === 'accepted') notify(c.from_id, `${user.name} a accepté ta demande. La conversation est ouverte.`);
    return { id: c.id, status };
  };
  route('POST', '/connections/:id/accept', decide('accepted'));
  route('POST', '/connections/:id/reject', decide('rejected'));

  route('GET', '/conversations', ({ user }) => ({
    conversations: q("SELECT * FROM connections WHERE status = 'accepted' AND (from_id = ? OR to_id = ?) ORDER BY id DESC", user.id, user.id).filter((c) => !one('SELECT suspended FROM users WHERE id = ?', c.from_id === user.id ? c.to_id : c.from_id).suspended).map((c) => {
      const other = one('SELECT * FROM users WHERE id = ?', c.from_id === user.id ? c.to_id : c.from_id);
      const last = one('SELECT text, created_at, sender_id FROM messages WHERE connection_id = ? ORDER BY id DESC LIMIT 1', c.id);
      const n = one('SELECT COUNT(*) n FROM messages WHERE connection_id = ?', c.id).n;
      return { id: c.id, score: c.score, user: pub(other), lastMessage: last ? last.text : null, messageCount: n };
    }),
  }));

  route('GET', '/conversations/:id/messages', ({ user, params, query }) => {
    const c = connectionFor(user.id, Number(params.id));
    if (c.status !== 'accepted') throw new HttpError(403, 'Conversation non ouverte');
    const after = Number(query.get('after') || 0);
    const msgs = q('SELECT id, sender_id, text, created_at FROM messages WHERE connection_id = ? AND id > ? ORDER BY id', c.id, after)
      .map((m) => ({ id: m.id, mine: m.sender_id === user.id, text: m.text, createdAt: m.created_at }));
    const n = one('SELECT COUNT(*) n FROM messages WHERE connection_id = ?', c.id).n;
    const other = one('SELECT premium FROM users WHERE id = ?', c.from_id === user.id ? c.to_id : c.from_id);
    return { messages: msgs, total: n, freeLimit: FREE_MESSAGES, canSend: !!(user.premium || other.premium) || n < FREE_MESSAGES };
  });

  route('POST', '/conversations/:id/messages', ({ user, params, body }) => {
    const c = connectionFor(user.id, Number(params.id));
    if (c.status !== 'accepted') throw new HttpError(403, 'Conversation non ouverte');
    if (!limiter.allow('msg:' + user.id, msgPerMin, 60000)) throw tooMany('Tu envoies trop de messages, ralentis un peu.');
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > 1000) throw bad('Message vide ou trop long (1000 caractères max)');
    const otherId = c.from_id === user.id ? c.to_id : c.from_id;
    const other = one('SELECT * FROM users WHERE id = ?', otherId);
    const n = one('SELECT COUNT(*) n FROM messages WHERE connection_id = ?', c.id).n;
    if (n >= FREE_MESSAGES && !user.premium && !other.premium) {
      throw new HttpError(402, 'Vous avez beaucoup de choses à vous dire ❤️ Passez en Premium pour continuer votre conversation.', { code: 'premium_required' });
    }
    if (other.suspended) throw new HttpError(403, 'Conversation indisponible');
    const mine = one('SELECT COUNT(*) n FROM messages WHERE connection_id = ? AND sender_id = ?', c.id, user.id).n;
    if (mine < 5 && /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|me|ly|tn|xyz|io)\b)/i.test(text)) throw bad('Les liens ne sont pas autorisés au début d\'une conversation.');
    const r = run('INSERT INTO messages (connection_id, sender_id, text) VALUES (?,?,?)', c.id, user.id, text);
    if (demo && other.is_demo) run('INSERT INTO messages (connection_id, sender_id, text) VALUES (?,?,?)', c.id, otherId, DEMO_REPLIES[1 + (n % (DEMO_REPLIES.length - 1))]);
    else notify(otherId, `Nouveau message de ${user.name}.`);
    return [201, { id: Number(r.lastInsertRowid) }];
  });

  route('GET', '/notifications', ({ user }) => ({
    notifications: q('SELECT id, text, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50', user.id)
      .map((n) => ({ id: n.id, text: n.text, read: !!n.is_read, createdAt: n.created_at })),
  }));
  route('POST', '/notifications/read', ({ user }) => { run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', user.id); return { ok: true }; });

  route('GET', '/subscription', ({ user }) => ({ premium: !!user.premium, plan: user.premium ? 'premium' : 'free' }));
  route('POST', '/subscription', ({ user }) => {
    // TODO production : paiement réel (Konnect / Paymee / achat intégré) avant d'activer Premium.
    if (!fakePayment) throw new HttpError(501, 'Paiement non configuré');
    run('UPDATE users SET premium = 1 WHERE id = ?', user.id);
    return { premium: true };
  });


  // ----- Photos (JPEG/PNG/WebP, 3 max, 1 Mo max, stockées en base) -----
  route('POST', '/photos', ({ user, body }) => {
    if (!limiter.allow('photo:' + user.id, 10, 3600000)) throw tooMany('Trop d\'envois de photos. Réessaie plus tard.');
    if (one('SELECT COUNT(*) n FROM photos WHERE user_id = ?', user.id).n >= MAX_PHOTOS) throw new HttpError(409, `${MAX_PHOTOS} photos maximum`);
    const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
    if (!m) throw bad('Image invalide (JPEG, PNG ou WebP attendu)');
    const buf = Buffer.from(m[1], 'base64');
    if (buf.length > MAX_PHOTO_BYTES) throw new HttpError(413, 'Photo trop lourde (1 Mo maximum)');
    const mime = sniffImage(buf);
    if (!mime) throw bad('Ce fichier n\'est pas une image valide');
    const pos = one('SELECT COALESCE(MAX(position), -1) + 1 p FROM photos WHERE user_id = ?', user.id).p;
    const r = run('INSERT INTO photos (user_id, mime, data, position) VALUES (?,?,?,?)', user.id, mime, buf, pos);
    return [201, { id: Number(r.lastInsertRowid), photos: photoIds(user.id) }];
  });

  route('GET', '/photos', ({ user }) => ({ photos: photoIds(user.id) }));

  route('DELETE', '/photos/:id', ({ user, params }) => {
    const r = run('DELETE FROM photos WHERE id = ? AND user_id = ?', Number(params.id), user.id);
    if (!r.changes) throw new HttpError(404, 'Photo introuvable');
    return { photos: photoIds(user.id) };
  });

  const seeCache = new Map();
  const visibleOwners = (viewer) => {
    const k = viewer.id + ':' + viewer.premium, c = seeCache.get(k);
    if (c && Date.now() - c.t < 20000) return c.ids;
    const ids = new Set(matchesFor(viewer).filter((_, i) => viewer.premium || i < FREE_VISIBLE).map((m) => m.user.id));
    seeCache.set(k, { t: Date.now(), ids });
    return ids;
  };
  route('GET', '/photos/:id', ({ user, params }) => {
    const ph = one('SELECT id, user_id, mime, data FROM photos WHERE id = ?', Number(params.id));
    if (!ph) throw new HttpError(404, 'Photo introuvable');
    const owner = ph.user_id;
    if (one('SELECT hidden FROM photos WHERE id = ?', ph.id).hidden && owner !== user.id) throw new HttpError(404, 'Photo introuvable');
    const allowed = owner === user.id
      || (!isBlocked(user.id, owner) && (one('SELECT 1 x FROM connections WHERE status IN (\'pending\',\'accepted\') AND ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))', user.id, owner, owner, user.id)
        || visibleOwners(user).has(owner)));
    if (!allowed) throw new HttpError(403, 'Photo non accessible');
    return { __binary: { mime: ph.mime, data: Buffer.from(ph.data) } };
  });

  route('POST', '/blocks', ({ user, body }) => {
    const t = Number(body.userId);
    if (!one('SELECT 1 x FROM users WHERE id = ?', t) || t === user.id) throw bad('Utilisateur invalide');
    run('INSERT OR IGNORE INTO blocks (user_id, blocked_id) VALUES (?,?)', user.id, t);
    run("UPDATE connections SET status = 'blocked' WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)", user.id, t, t, user.id);
    return { blocked: true };
  });
  route('GET', '/blocks', ({ user }) => ({ blocked: q('SELECT u.id, u.name FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.user_id = ?', user.id).map((r) => ({ id: r.id, name: r.name })) }));
  route('DELETE', '/blocks/:userId', ({ user, params }) => { run('DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?', user.id, Number(params.userId)); return { unblocked: true }; });

  // ----- Signalements -----
  route('GET', '/report-categories', () => ({ categories: Object.entries(REPORT_CATEGORIES).map(([id, label]) => ({ id, label })) }));

  const canSee = (viewer, ownerId) => !!one("SELECT 1 x FROM connections WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)", viewer.id, ownerId, ownerId, viewer.id) || visibleOwners(viewer).has(ownerId);
  const suspend = (uid, reason) => { run('UPDATE users SET suspended = 1, suspended_reason = ? WHERE id = ?', reason, uid); run('INSERT INTO mod_log (action, target, note) VALUES (?,?,?)', 'suspend', 'user:' + uid, reason); };

  route('POST', '/reports', ({ user, body }) => {
    const t = Number(body.userId);
    const target = one('SELECT * FROM users WHERE id = ?', t);
    if (!target || t === user.id) throw bad('Utilisateur invalide');
    const category = String(body.category || 'autre');
    if (!REPORT_CATEGORIES[category]) throw bad('Catégorie de signalement invalide');
    const details = typeof body.details === 'string' ? body.details.trim().slice(0, 500) : '';
    if (!limiter.allow('rep:' + user.id, 10, 86400000)) throw tooMany('Trop de signalements aujourd\'hui.');
    if (!canSee(user, t)) throw new HttpError(403, 'Tu ne peux signaler que des profils que tu as vus dans NEXA.');
    let photoId = null;
    if (body.photoId != null) {
      const ph = one('SELECT id FROM photos WHERE id = ? AND user_id = ?', Number(body.photoId), t);
      if (!ph) throw bad('Photo invalide');
      photoId = ph.id;
    }
    if (one("SELECT 1 x FROM reports WHERE reporter_id = ? AND reported_id = ? AND category = ? AND status = 'open' AND COALESCE(photo_id, 0) = COALESCE(?, 0)", user.id, t, category, photoId)) {
      return [200, { reported: true, duplicate: true }];
    }
    run('INSERT INTO reports (reporter_id, reported_id, reason, category, details, photo_id) VALUES (?,?,?,?,?,?)', user.id, t, REPORT_CATEGORIES[category], category, details || null, photoId);
    // Réaction automatique : on compte des SIGNALEURS DIFFÉRENTS (un seul compte ne peut pas suspendre quelqu'un).
    const open = q("SELECT reporter_id, category, photo_id FROM reports WHERE reported_id = ? AND status = 'open'", t);
    const distinct = new Set(open.map((r) => r.reporter_id)).size;
    const severe = new Set(open.filter((r) => SEVERE.has(r.category)).map((r) => r.reporter_id)).size;
    let action = null;
    if (!target.suspended && (distinct >= reportThreshold || severe >= SEVERE_THRESHOLD)) { suspend(t, 'Suspension automatique : signalements multiples'); action = 'suspended'; }
    if (photoId) {
      const pr = new Set(open.filter((r) => r.photo_id === photoId).map((r) => r.reporter_id)).size;
      if (pr >= 2) { run('UPDATE photos SET hidden = 1 WHERE id = ?', photoId); notify(t, 'Une de tes photos a été masquée après signalements. Elle sera examinée.'); }
    }
    return [201, { reported: true, action }];
  });

  // Recours d'un compte suspendu (route ouverte aux comptes suspendus).
  route('POST', '/appeal', ({ user, body }) => {
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 1000) : '';
    if (!user.suspended) throw bad('Ton compte n\'est pas suspendu.');
    if (!text) throw bad('Écris ton message');
    if (one("SELECT 1 x FROM appeals WHERE user_id = ? AND status = 'open'", user.id)) throw new HttpError(409, 'Ta demande est déjà en cours d\'examen.');
    run('INSERT INTO appeals (user_id, text) VALUES (?,?)', user.id, text);
    return [201, { sent: true }];
  }, true, true);

  // ----- Administration (jeton NEXA_ADMIN_TOKEN dans l'en-tête X-Admin-Token) -----
  const requireAdmin = (req, ip) => {
    if (!adminToken || adminToken.length < 16) throw new HttpError(404, 'Route inconnue');
    if (!limiter.allow('adm:' + ip, 20, 60000)) throw tooMany();
    const h = (x) => crypto.createHash('sha256').update(String(x)).digest();
    if (!crypto.timingSafeEqual(h(req.headers['x-admin-token'] || ''), h(adminToken))) throw new HttpError(401, 'Jeton administrateur invalide');
  };
  const adm = (method, pattern, fn) => route(method, pattern, (ctx) => { requireAdmin(ctx.req, ctx.ip); return fn(ctx); }, false);
  const log = (action, target, note) => run('INSERT INTO mod_log (action, target, note) VALUES (?,?,?)', action, target, note || null);
  const allPhotoIds = (uid) => q('SELECT id, hidden FROM photos WHERE user_id = ? ORDER BY position, id', uid).map((r) => ({ id: r.id, hidden: !!r.hidden }));

  adm('GET', '/admin/overview', () => {
    const users = q("SELECT reported_id uid, COUNT(DISTINCT reporter_id) n FROM reports WHERE status = 'open' GROUP BY reported_id ORDER BY n DESC");
    return {
      stats: { users: one('SELECT COUNT(*) n FROM users WHERE is_demo = 0').n, suspended: one('SELECT COUNT(*) n FROM users WHERE suspended = 1').n, openReports: one("SELECT COUNT(*) n FROM reports WHERE status = 'open'").n },
      reported: users.map((r) => {
        const u = one('SELECT * FROM users WHERE id = ?', r.uid);
        return { id: u.id, name: u.name, age: u.age, city: u.city, phone: u.phone, suspended: !!u.suspended, reporters: r.n, photos: allPhotoIds(u.id),
          reports: q("SELECT id, category, details, photo_id, created_at FROM reports WHERE reported_id = ? AND status = 'open' ORDER BY id DESC LIMIT 20", u.id) };
      }),
      appeals: q("SELECT a.id, a.user_id, a.text, a.created_at, u.name FROM appeals a JOIN users u ON u.id = a.user_id WHERE a.status = 'open' ORDER BY a.id"),
    };
  });
  adm('POST', '/admin/users/:id/suspend', ({ params, body }) => { const id = Number(params.id); if (!one('SELECT 1 x FROM users WHERE id = ?', id)) throw new HttpError(404, 'Utilisateur introuvable'); suspend(id, String(body.note || 'Suspendu par un administrateur').slice(0, 200)); return { suspended: true }; });
  adm('POST', '/admin/users/:id/unsuspend', ({ params }) => { const id = Number(params.id); run('UPDATE users SET suspended = 0, suspended_reason = NULL WHERE id = ?', id); run("UPDATE reports SET status = 'reviewed' WHERE reported_id = ? AND status = 'open'", id); run("UPDATE appeals SET status = 'closed' WHERE user_id = ?", id); log('unsuspend', 'user:' + id); return { suspended: false }; });
  adm('POST', '/admin/users/:id/dismiss', ({ params }) => { const id = Number(params.id); run("UPDATE reports SET status = 'dismissed' WHERE reported_id = ? AND status = 'open'", id); log('dismiss', 'user:' + id); return { dismissed: true }; });
  adm('POST', '/admin/photos/:id/hide', ({ params }) => { run('UPDATE photos SET hidden = 1 WHERE id = ?', Number(params.id)); log('hide-photo', 'photo:' + params.id); return { hidden: true }; });
  adm('POST', '/admin/photos/:id/show', ({ params }) => { run('UPDATE photos SET hidden = 0 WHERE id = ?', Number(params.id)); log('show-photo', 'photo:' + params.id); return { hidden: false }; });
  adm('DELETE', '/admin/photos/:id', ({ params }) => { run('DELETE FROM photos WHERE id = ?', Number(params.id)); log('delete-photo', 'photo:' + params.id); return { deleted: true }; });
  adm('GET', '/admin/backups', () => ({ dir: !!BACKUP_DIR, backups: BACKUP_DIR ? listBackups(BACKUP_DIR) : [], dbBytes: one('SELECT page_count * page_size AS b FROM pragma_page_count(), pragma_page_size()').b }));
  adm('POST', '/admin/backups', () => { if (!BACKUP_DIR) throw new HttpError(501, 'Pas de dossier de sauvegarde (base en mémoire)'); const f = createBackup(db, BACKUP_DIR); pruneBackups(BACKUP_DIR, backupKeep); log('backup', path.basename(f)); return { created: path.basename(f) }; });
  adm('GET', '/admin/backup', () => {
    const tmp = fs.mkdtempSync(path.join(BACKUP_DIR || process.env.TMPDIR || '/tmp', 'dl-'));
    try { const f = createBackup(db, tmp, 'nexa-export'); return { __binary: { mime: 'application/octet-stream', filename: path.basename(f), data: fs.readFileSync(f) } }; }
    finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
  adm('GET', '/admin/photos/:id', ({ params }) => { const ph = one('SELECT mime, data FROM photos WHERE id = ?', Number(params.id)); if (!ph) throw new HttpError(404, 'Photo introuvable'); return { __binary: { mime: ph.mime, data: Buffer.from(ph.data) } }; });

  // ------------------------------------------------------------ HTTP
  const server = http.createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      });
      res.end(JSON.stringify(data));
    };
    try {
      if (req.method === 'OPTIONS') return send(204, {});
      const url = new URL(req.url, 'http://localhost');
      let body = {};
      if (req.method === 'POST' || req.method === 'PUT') {
        const chunks = []; let size = 0;
        for await (const c of req) { size += c.length; if (size > 2.2e6) throw new HttpError(413, 'Requête trop grande'); chunks.push(c); }
        const raw = Buffer.concat(chunks).toString();
        if (raw) { try { body = JSON.parse(raw); } catch { throw bad('JSON invalide'); } }
      }
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        return res.end(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'index.html')));
      }
      if (req.method === 'GET' && url.pathname === '/admin' && adminToken.length >= 16) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' });
        return res.end(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'admin.html')));
      }
      const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
      if (!r) throw new HttpError(404, 'Route inconnue');
      const params = url.pathname.match(r.re).groups || {};
      let user = null;
      if (r.auth) {
        const t = (req.headers.authorization || '').replace(/^Bearer /, '');
        const p = verify(t);
        user = p && one('SELECT * FROM users WHERE id = ?', p.uid);
        if (!user) throw new HttpError(401, 'Non authentifié');
        if (user.suspended && !r.open) throw new HttpError(403, 'Ton compte est suspendu.', { code: 'suspended' });
        if (!r.open && !user.verified) throw new HttpError(403, 'Vérifie ton numéro de téléphone pour continuer', { code: 'phone_unverified' });
      }
      const out = await r.handler({ req, body, params, query: url.searchParams, user, ip: req.socket.remoteAddress });
      if (out && out.__binary) {
        res.writeHead(200, { ...(out.__binary.filename ? { 'Content-Disposition': `attachment; filename="${out.__binary.filename}"` } : {}), 'Content-Type': out.__binary.mime, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': '*' });
        return res.end(out.__binary.data);
      }
      Array.isArray(out) ? send(out[0], out[1]) : send(200, out);
    } catch (e) {
      if (e instanceof HttpError) return send(e.status, { error: e.message, ...e.extra });
      console.error(e);
      send(500, { error: 'Erreur serveur' });
    }
  });
  /** Nettoyage quotidien : codes SMS expirés, vieilles notifications lues. */
  server.maintenance = () => {
    const a = run('DELETE FROM otp WHERE expires_at < ?', Date.now() - 3600000).changes;
    const b = run("DELETE FROM notifications WHERE is_read = 1 AND created_at < datetime('now', '-90 days')").changes;
    return { otpDeleted: Number(a), notificationsDeleted: Number(b) };
  };
  /** Sauvegarde automatique (au plus une par jour). Retourne le nom du fichier créé, ou null. */
  server.backupNow = (force = false) => {
    if (!BACKUP_DIR) return null;
    const last = listBackups(BACKUP_DIR)[0];
    if (!force && last && Date.now() - new Date(last.date).getTime() < 23 * 3600000) return null;
    const f = createBackup(db, BACKUP_DIR); pruneBackups(BACKUP_DIR, backupKeep);
    return path.basename(f);
  };
  server.on('close', () => db.close());
  return server;
}
