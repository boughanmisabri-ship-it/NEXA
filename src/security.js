import crypto from 'node:crypto';

/** Normalise un numéro en format international. 8 chiffres tunisiens -> +216XXXXXXXX. */
export function normalizePhone(input) {
  let p = String(input || '').replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (/^[2-579]\d{7}$/.test(p)) p = '+216' + p;
  else if (/^216\d{8}$/.test(p)) p = '+' + p;
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

/** Retourne un message d'erreur si le mot de passe est trop faible, sinon null. */
export function passwordProblem(pw, phone) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Mot de passe : 8 caractères minimum';
  if (pw.length > 100) return 'Mot de passe trop long';
  if (/^\d+$/.test(pw)) return 'Mot de passe : ajoute des lettres (pas seulement des chiffres)';
  if (/^(.)\1+$/.test(pw)) return 'Mot de passe trop simple';
  const digits = pw.replace(/\D/g, '');
  if (phone && digits.length >= 6 && phone.replace(/\D/g, '').endsWith(digits)) return 'Le mot de passe ne doit pas être ton numéro';
  return null;
}

/** Limiteur à fenêtre glissante, en mémoire. allow(clé, max, fenêtreMs) -> true si autorisé. */
export function makeLimiter() {
  const hits = new Map();
  return {
    allow(key, max, windowMs) {
      const now = Date.now();
      const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (arr.length >= max) { hits.set(key, arr); return false; }
      arr.push(now); hits.set(key, arr);
      if (hits.size > 50000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 86400000) hits.delete(k);
      return true;
    },
    count(key, windowMs) {
      const now = Date.now();
      return (hits.get(key) || []).filter((t) => now - t < windowMs).length;
    },
    add(key) { const a = hits.get(key) || []; a.push(Date.now()); hits.set(key, a); },
    reset(key) { hits.delete(key); },
  };
}

export const genCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
export const hashCode = (code, secret) => crypto.createHmac('sha256', secret).update(String(code)).digest('hex');

/**
 * Envoi de SMS. provider = 'console' (affiche dans les logs, pour le développement)
 * ou 'twilio' (variables TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM). Le mode Twilio n'a pas pu être testé ici.
 */
export async function sendSms(to, text, provider = 'console') {
  if (provider === 'twilio') {
    const { TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM } = process.env;
    if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) throw new Error('Twilio non configuré');
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: text }),
    });
    if (!r.ok) throw new Error(`Échec envoi SMS (${r.status})`);
    return;
  }
  console.log(`[SMS → ${to}] ${text}`);
}
