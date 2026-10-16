// Reprise des anciennes réponses après la révision des questions (version 2).
// Pour chaque question : ancien numéro de choix -> nouveau numéro de choix (null = pas de correspondance claire : la question sera reposée).
import { questions } from './questions.js';

export const QUESTIONS_VERSION = 2;
export const ANSWER_MAP = {"1": [0, 1, 2, 3, 2], "2": [0, 0, 1, 2], "3": [0, 1, 2, 3], "5": [0, 1, 2, null], "6": [0, 1, 2, 3], "7": [0, 1, 2, 2], "8": [0, 1, 2, 4, null, 3, 5, 6, null, 4, 7, null], "9": [0, 2, 3, null, 1], "10": [0, 1, 3, 2, null], "12": [0, 1, 2, null, 3], "14": [0, 1, 2, 2, 3], "15": [0, 1, 2, 3, null], "16": [0, 1, null, 2, 0], "17": [0, 1, 2, 3], "19": [0, 1, 3, 2, 3], "20": [0, 1, 2, 1, 3], "21": [0, 1, 2, 0, 3], "22": [0, 1, 2, null, 3], "23": [0, 1, 2, 3, null], "24": [0, 1, 2, 3, 3], "26": [0, 1, 2, 3, 3], "27": [0, 1, 2, null, 3, null], "28": [0, 1, 2, 2, 3], "30": [0, 1, 2, 3, 2], "31": [0, 1, 2, 3, 3], "32": [0, 1, 2, 3, null], "33": [0, 1, 2, 3, 3], "34": [0, 1, 2, 3, null], "35": [0, 1, 2, 3, 3], "36": [0, 1, 2, null, 3], "37": [0, 0, 1, 2, 2], "38": [0, 1, 2, 3, null], "39": [0, 1, 2, 3, 0, null], "40": [0, 1, 2, 3, null], "42": [0, 1, 2, 3, null, 4, 5, 6, null, null, 7, 3], "45": [0, 1, 3, 2, 3, 3], "46": [0, 1, 3, 2, 3, null], "47": [0, 1, 2, 3, 7, null, null, null, 4, 5, 6, null], "48": [0, 1, 2, 3, null], "50": [0, 0, 1, 2, 3, 5, null, 4, null, null, null, 6, 7]};

/** Convertit un jeu de réponses (anciens numéros de choix) vers la version actuelle. */
export function migrateAnswers(answers) {
  const out = { ...answers }, dropped = [];
  for (const [id, map] of Object.entries(ANSWER_MAP)) {
    const cur = answers[id];
    if (!cur || !cur.length) continue;
    const q = questions.find((x) => String(x.id) === id);
    let next = [...new Set(cur.map((i) => map[i]).filter((v) => v !== null && v !== undefined))];
    if (q && q.maxChoices > 0) next = next.slice(0, q.maxChoices); else next = next.slice(0, 1);
    if (next.length) out[id] = next; else { delete out[id]; dropped.push(Number(id)); }
  }
  return { answers: out, dropped };
}
