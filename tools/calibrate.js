// Banc d'essai du moteur de compatibilité : population fictive, distributions, symétrie, biais.
import { activeQuestions as questions } from '../src/questions.js';
import { computeMatch, AXES } from '../src/engine.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const R = rng(12345);
const pick = (n) => Math.floor(R() * n);

const TYPES = {
  'Traditionnel familial': { CLOSE: 90, INDEP: 25, COMM: 80, CONFLICT: 80, SOCIAL: 55, PLAN: 75, FAMILY: 95, AMBITION: 50, ACTIVITY: 45, FLEX: 45 },
  'Ambitieux carriériste': { CLOSE: 55, INDEP: 70, COMM: 70, CONFLICT: 75, SOCIAL: 65, PLAN: 90, FAMILY: 40, AMBITION: 95, ACTIVITY: 75, FLEX: 60 },
  'Aventurier libre': { CLOSE: 40, INDEP: 90, COMM: 65, CONFLICT: 60, SOCIAL: 85, PLAN: 20, FAMILY: 25, AMBITION: 60, ACTIVITY: 95, FLEX: 90 },
  'Casanier tendre': { CLOSE: 95, INDEP: 15, COMM: 70, CONFLICT: 60, SOCIAL: 25, PLAN: 55, FAMILY: 80, AMBITION: 30, ACTIVITY: 20, FLEX: 55 },
  'Social épicurien': { CLOSE: 60, INDEP: 55, COMM: 75, CONFLICT: 70, SOCIAL: 95, PLAN: 35, FAMILY: 55, AMBITION: 55, ACTIVITY: 80, FLEX: 80 },
  'Indépendant sans enfants': { CLOSE: 30, INDEP: 95, COMM: 55, CONFLICT: 55, SOCIAL: 50, PLAN: 60, FAMILY: 5, AMBITION: 70, ACTIVITY: 55, FLEX: 70 },
};

/** Profil : pour chaque question, l'option dont les valeurs d'axes collent le mieux à la cible. */
function persona(target, noise) {
  const ans = {};
  for (const q of questions) {
    if (q.maxChoices > 0) {
      const n = q.key === 'dealbreakers' ? pick(3) : Math.max(1, q.maxChoices - pick(2));
      ans[q.id] = q.options.map((_, i) => i).sort(() => R() - 0.5).slice(0, n);
      continue;
    }
    if (R() < noise) { ans[q.id] = [pick(q.options.length)]; continue; }
    let best = 0, bestD = 1e9;
    q.options.forEach((_, i) => {
      const d = Object.entries(q.axes).reduce((t, [a, v]) => t + Math.abs(v[i] - (target[a] ?? 50)), 0);
      if (d < bestD) { bestD = d; best = i; }
    });
    ans[q.id] = [best];
  }
  return ans;
}
const randomAnswers = () => Object.fromEntries(questions.map((q) => [q.id, q.maxChoices > 0 ? q.options.map((_, i) => i).sort(() => R() - 0.5).slice(0, 1 + pick(q.maxChoices)) : [pick(q.options.length)]]));

const pop = [];
for (const [name, target] of Object.entries(TYPES)) for (let i = 0; i < 40; i++) pop.push({ type: name, a: persona(target, 0.1 + R() * 0.15) });
for (let i = 0; i < 60; i++) pop.push({ type: 'Aléatoire', a: randomAnswers() });

const stats = (arr) => { const n = arr.length, m = arr.reduce((t, x) => t + x, 0) / n; const sd = Math.sqrt(arr.reduce((t, x) => t + (x - m) ** 2, 0) / n); const s = [...arr].sort((a, b) => a - b); return { n, mean: m, sd, p10: s[Math.floor(n * 0.1)], p50: s[Math.floor(n * 0.5)], p90: s[Math.floor(n * 0.9)], max: s[n - 1], ge80: arr.filter((x) => x >= 80).length / n }; };
const f = (x) => (typeof x === 'number' && x <= 1 && x >= 0 && !Number.isInteger(x) ? (x * 100).toFixed(1) + ' %' : typeof x === 'number' ? x.toFixed(1) : x);

const pairs = {}; // clé "A|B"
let asym = 0, maxAsym = 0, blockedCount = 0, total = 0; const blockTally = {};
for (let i = 0; i < pop.length; i++) for (let j = i + 1; j < pop.length; j++) {
  const r1 = computeMatch(pop[i].a, pop[j].a), r2 = computeMatch(pop[j].a, pop[i].a);
  const d = Math.abs(r1.score - r2.score); if (d > 0) asym++; maxAsym = Math.max(maxAsym, d);
  total++; if (r1.blocks.length) { blockedCount++; for (const b of r1.blocks) blockTally[b] = (blockTally[b] || 0) + 1; }
  const k = [pop[i].type, pop[j].type].sort().join(' × ');
  (pairs[k] = pairs[k] || []).push(r1.blocks.length ? null : r1.score);
}
console.log(`\nPopulation : ${pop.length} profils, ${total} paires`);
console.log(`Symétrie : ${asym} paires asymétriques (écart max ${maxAsym} pts)`);
console.log(`Paires bloquées par un deal-breaker : ${(blockedCount / total * 100).toFixed(1)} %  `, JSON.stringify(blockTally));
console.log('');

const types = [...Object.keys(TYPES), 'Aléatoire'];
console.log('--- Même type (score moyen / % ≥ 80) ---');
for (const t of types) { const s = stats((pairs[t + ' × ' + t] || []).filter((x) => x !== null)); console.log(t.padEnd(26), s.mean.toFixed(1).padStart(5), ' ≥80 :', (s.ge80 * 100).toFixed(0).padStart(3) + ' %'); }
console.log('\n--- Types différents (score moyen / % ≥ 80) ---');
const cross = [];
for (let a = 0; a < types.length; a++) for (let b = a + 1; b < types.length; b++) { const k = [types[a], types[b]].sort().join(' × '); const s = stats((pairs[k] || []).filter((x) => x !== null)); cross.push([k, s]); }
cross.sort((x, y) => y[1].mean - x[1].mean);
for (const [k, s] of cross) console.log(k.padEnd(52), s.mean.toFixed(1).padStart(5), ' ≥80 :', (s.ge80 * 100).toFixed(0).padStart(3) + ' %');

const all = Object.values(pairs).flat().filter((x) => x !== null);
const sAll = stats(all);
console.log('\n--- Toutes paires ---');
console.log(Object.entries(sAll).map(([k, v]) => `${k}=${f(v)}`).join('  '));
const rnd = stats((pairs['Aléatoire × Aléatoire'] || []).filter((x) => x !== null));
console.log('Aléatoire × Aléatoire :', Object.entries(rnd).map(([k, v]) => `${k}=${f(v)}`).join('  '));

// Biais : profil « ça dépend / je ne sais pas » partout
const hedge = Object.fromEntries(questions.map((q) => {
  if (q.maxChoices > 0) return [q.id, [0]];
  const idx = q.options.findIndex((o) => /dépend|ne sais pas|pas d'attente|pas vraiment d'avis/i.test(o));
  return [q.id, [idx >= 0 ? idx : Math.floor(q.options.length / 2)]];
}));
const hs = stats(pop.map((p) => computeMatch(hedge, p.a).score));
for (const T of [65, 70, 75, 80]) { const same = Object.keys(TYPES).flatMap((t) => pairs[t + ' × ' + t]).filter((x) => x !== null); const rn = (pairs['Aléatoire × Aléatoire'] || []).filter((x) => x !== null); const cr = cross.filter(([k]) => !k.includes('Aléatoire')).flatMap(([k]) => pairs[k]).filter((x) => x !== null); const pct = (a) => (a.filter((x) => x >= T).length / a.length * 100).toFixed(1).padStart(5); console.log(`Seuil ${T} → même type : ${pct(same)} % | types différents : ${pct(cr)} % | aléatoire : ${pct(rn)} %`); }
console.log(`\nProfil « indécis » (réponses neutres) vs population : moyenne ${hs.mean.toFixed(1)}, ≥80 : ${(hs.ge80 * 100).toFixed(0)} %, max ${hs.max}`);

// Pouvoir discriminant par question : écart-type du score de compatibilité lié à la question
console.log('\n--- Questions peu discriminantes (écart max entre options < 25 pts sur tous les axes) ---');
const weak = questions.filter((q) => q.maxChoices === 0 && Object.keys(q.axes).length && Object.values(q.axes).every((v) => Math.max(...v) - Math.min(...v) < 25));
console.log(weak.length ? weak.map((q) => 'Q' + q.id).join(', ') : 'aucune');
const noAxis = questions.filter((q) => q.maxChoices === 0 && !Object.keys(q.axes).length);
console.log('Questions simples sans score :', noAxis.length ? noAxis.map((q) => 'Q' + q.id).join(', ') : 'aucune');

// Stabilité : effet d'UNE réponse changée sur le score, et courbe de bruit
const base = pop[0].a; const others = pop.slice(1, 120);
let tot = 0, cnt = 0, worst = 0;
for (const o of others) { const s0 = computeMatch(base, o.a).score; for (const q of questions) { if (q.maxChoices > 0) continue; const alt = structuredClone(base); alt[q.id] = [(base[q.id][0] + 1 + pick(q.options.length - 1)) % q.options.length]; const d = Math.abs(computeMatch(alt, o.a).score - s0); tot += d; cnt++; worst = Math.max(worst, d); } }
console.log(`\nChanger UNE réponse : variation moyenne ${(tot / cnt).toFixed(2)} pt, maximum ${worst} pts`);
console.log('Bruit (part de réponses changées au hasard) → score moyen face au profil d\'origine :');
for (const noise of [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1]) { const sc = []; for (let k = 0; k < 40; k++) { const t = TYPES['Traditionnel familial']; const a0 = persona(t, 0), a1 = persona(t, noise); sc.push(computeMatch(a0, a1).score); } console.log(' ', String(noise * 100).padStart(3) + ' %  →', (sc.reduce((x, y) => x + y, 0) / sc.length).toFixed(1)); }
