// Moteur de compatibilité NEXA V1 (port fidèle de lib/engine.dart).
import { questions, activeQuestions } from './questions.js';
import { interludes, FUN_IDS, FUN_HINT_ID, sharedFun } from './interludes.js';

export const DIM_WEIGHTS = {
  couple: 0.2, family: 0.2, personality: 0.15, comm: 0.15,
  lifestyle: 0.1, ambition: 0.1, interests: 0.1,
};
export const AXES = ['CLOSE', 'INDEP', 'COMM', 'CONFLICT', 'SOCIAL', 'PLAN', 'FAMILY', 'AMBITION', 'ACTIVITY', 'FLEX'];
export const MATCH_THRESHOLD = 75;
// Calibrage : la similarité brute d'inconnus tirés au hasard vaut déjà ~69 %. On étire l'échelle pour que
// 0 % = très peu compatible et que 75 % ou plus signifie vraiment une forte compatibilité.
export const SCORE_FLOOR = 40;
const stretch = (raw) => Math.max(0, Math.min(100, ((raw - SCORE_FLOOR) / (100 - SCORE_FLOOR)) * 100));

const REASONS = {
  couple: 'Vous avez une vision du couple très proche',
  family: 'Vos projets de famille et vos valeurs sont alignés',
  personality: "Vos personnalités s'accordent bien",
  comm: 'Vous communiquez et gérez les désaccords de façon compatible',
  lifestyle: 'Vos modes de vie sont proches',
  ambition: 'Vos ambitions vont dans le même sens',
  interests: "Vous partagez des centres d'intérêt",
};

const first = (m, id) => (m[id] && m[id].length ? m[id][0] : null);

/** Toutes les questions (sauf Q47, facultative) ont une réponse. */
export function isComplete(answers) {
  return activeQuestions.every((q) => q.key === 'dealbreakers' || (answers[q.id] && answers[q.id].length > 0));
}

/** Valide et normalise les réponses reçues. Retourne { ok, answers | error }. */
export function validateAnswers(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'answers manquant' };
  const clean = {};
  for (const [k, v] of Object.entries(input)) {
    if (Number(k) === FUN_HINT_ID) {
      if (!Array.isArray(v) || !v.every((i) => i === 0 || i === 1)) return { ok: false, error: 'réponse invalide pour l\'indice' };
      clean[FUN_HINT_ID] = v.slice(0, 1);
      continue;
    }
    const it = interludes.find((x) => String(x.id) === String(k));
    if (it) {
      if (!Array.isArray(v) || v.length > 1 || !v.every((i) => Number.isInteger(i) && i >= 0 && i < it.options.length)) return { ok: false, error: `réponse invalide pour ${it.title}` };
      clean[it.id] = v;
      continue;
    }
    const q = questions.find((x) => String(x.id) === String(k));
    if (!q) return { ok: false, error: `question inconnue : ${k}` };
    if (!Array.isArray(v) || !v.every((i) => Number.isInteger(i) && i >= 0 && i < q.options.length)) {
      return { ok: false, error: `réponse invalide pour Q${q.id}` };
    }
    const uniq = [...new Set(v)];
    const max = q.maxChoices || 1;
    if (uniq.length > max) return { ok: false, error: `Q${q.id} : ${max} choix maximum` };
    clean[q.id] = uniq;
  }
  return { ok: true, answers: clean };
}

/** Profil interne : 10 axes (0-100) à partir des questions à choix unique. */
export function buildTraits(answers) {
  const sums = {}, counts = {};
  for (const q of activeQuestions) {
    const sel = answers[q.id];
    if (q.maxChoices > 0 || !sel || !sel.length) continue;
    for (const [axis, vals] of Object.entries(q.axes)) {
      sums[axis] = (sums[axis] || 0) + vals[sel[0]];
      counts[axis] = (counts[axis] || 0) + 1;
    }
  }
  const out = {};
  for (const a of AXES) if (counts[a]) out[a] = Math.round(sums[a] / counts[a]);
  return out;
}

function qCompat(q, a, b) {
  if (!a || !b || !a.length || !b.length || q.key === 'dealbreakers') return null;
  if (q.maxChoices > 0) {
    const w = (i) => (q.heavy.includes(i) ? 2 : 1);
    const sum = (arr) => arr.reduce((t, i) => t + w(i), 0);
    const sa = new Set(a), sb = new Set(b);
    const inter = sum([...sa].filter((i) => sb.has(i)));
    const union = sum([...new Set([...sa, ...sb])]);
    const minSide = Math.min(sum([...sa]), sum([...sb]));
    if (!union || !minSide) return null;
    return 100 * (0.5 * (inter / union) + 0.5 * (inter / minSide));
  }
  const axes = Object.values(q.axes);
  if (!axes.length) return null;
  const diff = axes.reduce((t, vals) => t + Math.abs(vals[a[0]] - vals[b[0]]), 0) / axes.length;
  return 100 - diff;
}

/** Incompatibilités majeures : plafonnent le score. */
function caps(a, b) {
  const out = [];
  const ca = first(a, 31), cb = first(b, 31);
  if (ca !== null && cb !== null) {
    const d = Math.abs(ca - cb);
    if (d >= 4) out.push({ max: 60, note: "Désir d'enfants très différent" });
    else if (d === 3) out.push({ max: 70, note: "Désir d'enfants assez différent" });
  }
  const ia = first(a, 1), ib = first(b, 1);
  if (ia !== null && ib !== null) {
    const serious = (x) => x === 0 || x === 1;
    if ((serious(ia) && ib === 3) || (serious(ib) && ia === 3)) {
      out.push({ max: 60, note: 'Type de relation recherchée très différent' });
    }
  }
  const ma = first(a, 30), mb = first(b, 30);
  if (ma !== null && mb !== null && ((ma === 0 && mb === 3) || (mb === 0 && ma === 3))) {
    out.push({ max: 70, note: 'Vision du mariage très différente' });
  }
  return out;
}

/** Deal-breakers (Q47) de `owner` déclenchés par les réponses de `other`. */
function triggered(owner, other) {
  const picks = owner[47] || [];
  const has = (i) => picks.includes(i);
  const out = [];
  if (has(1) && first(other, 2) === 3) out.push('Infidélité');
  if (has(4) && first(other, 37) === 4) out.push("Manque d'ambition");
  if (has(5) && first(other, 3) === 0 && first(other, 5) === 0) out.push("Manque d'indépendance");
  if (has(8) && (first(other, 31) ?? 0) >= 3) out.push("Refus d'avoir des enfants");
  if (has(9) && first(other, 30) === 3) out.push('Refus du mariage');
  if (has(10) && first(other, 6) === 3) out.push('Manque de communication');
  return out;
}

/** Score de compatibilité entre deux jeux de réponses. */
export function computeMatch(a, b) {
  const sums = {}, cnt = {};
  for (const q of activeQuestions) {
    const c = qCompat(q, a[q.id], b[q.id]);
    if (c === null) continue;
    sums[q.dim] = (sums[q.dim] || 0) + c;
    cnt[q.dim] = (cnt[q.dim] || 0) + 1;
  }
  const dims = {};
  let total = 0, wsum = 0;
  for (const d of Object.keys(sums)) {
    const v = sums[d] / cnt[d];
    dims[d] = Math.round(stretch(v));
    total += v * DIM_WEIGHTS[d];
    wsum += DIM_WEIGHTS[d];
  }
  let score = wsum ? stretch(total / wsum) : 0;
  // Goûts partagés (mini-quiz) : +1 point par goût en commun, 4 au maximum. Jamais de malus.
  const shared = sharedFun(a, b);
  score = Math.min(100, score + Math.min(4, shared.length));
  const warnings = [];
  for (const c of caps(a, b)) {
    warnings.push(c.note);
    if (score > c.max) score = c.max;
  }
  const blocks = [...new Set([...triggered(a, b), ...triggered(b, a)])];
  const reasons = Object.entries(dims).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([d]) => REASONS[d]);
  return { score: Math.max(0, Math.min(100, Math.round(score))), dims, reasons, warnings, blocks, shared };
}

// ---------------- Profils de démonstration (SIMULÉS, mode NEXA_DEMO=1) ----------------
export const DEMO_NAMES = {
  Femme: ['Sarah', 'Amira', 'Yasmine', 'Mariem', 'Ines', 'Nour', 'Rania', 'Salma'],
  Homme: ['Yassine', 'Amine', 'Sami', 'Karim', 'Anis', 'Mehdi', 'Walid', 'Firas'],
};
export const DEMO_CITIES = ['Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Bizerte', 'Monastir', 'Ariana', 'Ben Arous'];
const NOISE = [0.04, 0.09, 0.14, 0.2, 0.26, 0.34, 0.5, 0.8];

function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

/** Variations bruitées des réponses de l'utilisateur. */
export function demoAnswerSets(mine, seed = 1) {
  return NOISE.map((noise, i) => {
    const rnd = lcg(seed * 100 + i);
    const ans = {};
    for (const q of activeQuestions) {
      const base = mine[q.id] || [];
      if (rnd() >= noise && base.length) ans[q.id] = [...base];
      else if (q.maxChoices > 0) {
        const n = q.key === 'dealbreakers' ? Math.floor(rnd() * 3) : Math.max(1, q.maxChoices - Math.floor(rnd() * 2));
        const pool = q.options.map((_, k) => k).sort(() => rnd() - 0.5);
        ans[q.id] = pool.slice(0, Math.min(n, pool.length));
      } else ans[q.id] = [Math.floor(rnd() * q.options.length)];
    }
    for (const it of interludes) {
      const base = mine[it.id] || [];
      ans[it.id] = rnd() >= noise && base.length ? [...base] : [Math.floor(rnd() * it.options.length)];
    }
    return ans;
  });
}
