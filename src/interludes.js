// Mini-quiz « pour le fun » entre les thèmes. Ils n'entrent PAS dans le score principal :
// ils servent à donner des sujets de conversation (goûts en commun, +1 point par goût partagé, 4 maximum)
// et à afficher un profil ludique. Ce ne sont pas des tests psychologiques validés.
export const FUN_HINT_ID = 113; // 1 = indice utilisé pour l'énigme

export const interludes = [
  { id: 101, after: 0, kind: 'cards', emoji: '✈️', title: 'Escapade à deux', prompt: 'Un week-end surprise à deux : tu choisis quelle ville ?', options: [
    { emoji: '🗼', label: 'Paris', tag: 'Romantique et raffiné(e)', feedback: 'Paris : tu aimes le charme, les terrasses et les belles histoires.' },
    { emoji: '🏯', label: 'Tokyo', tag: 'Curieux(se) et aventurier(ère)', feedback: "Tokyo : tu es attiré(e) par l'inconnu et l'effervescence." },
    { emoji: '🗽', label: 'New York', tag: 'Énergique et ambitieux(se)', feedback: 'New York : rythme, projets et énergie, ça te ressemble.' },
    { emoji: '🕌', label: 'Istanbul', tag: 'Passionné(e) de culture et de saveurs', feedback: "Istanbul : tu aimes l'histoire, les marchés et les bonnes tables." },
    { emoji: '🏙️', label: 'Dubaï', tag: 'Amateur(trice) de confort et de grand style', feedback: 'Dubaï : tu aimes quand tout est beau, moderne et sans compromis.' },
  ] },
  { id: 102, after: 1, kind: 'colors', emoji: '🎨', title: 'Ta couleur du moment', prompt: "Quelle palette te donne le plus envie aujourd'hui ?", options: [
    { color: '#1c5fd6', label: 'Bleu océan', tag: 'Calme et fiable', feedback: 'Bleu océan : posé(e), loyal(e), tu inspires confiance.' },
    { color: '#f08a24', label: 'Orange coucher de soleil', tag: 'Chaleureux(se) et sociable', feedback: 'Orange : tu mets de la chaleur et de la bonne humeur partout où tu passes.' },
    { color: '#2f9e5b', label: 'Vert forêt', tag: 'Posé(e) et proche de la nature', feedback: 'Vert forêt : tu aimes les choses vraies, simples et apaisantes.' },
    { color: '#7a4fd6', label: 'Violet nuit', tag: 'Créatif(ve) et un peu mystérieux(se)', feedback: 'Violet nuit : imaginatif(ve), tu gardes une part de mystère.' },
    { color: '#d63b3b', label: 'Rouge passion', tag: 'Intense et déterminé(e)', feedback: 'Rouge passion : quand tu veux quelque chose, tu y vas à fond.' },
  ] },
  { id: 103, after: 2, kind: 'riddle', emoji: '🧩', title: 'Une petite énigme', prompt: "Plus on en prend, plus on en laisse derrière soi. Qu'est-ce que c'est ?", hint: 'Pense à une promenade sur la plage…', answer: 0, options: [
    { label: 'Des pas' }, { label: 'Des photos' }, { label: 'Des souvenirs' }, { label: 'Des kilos' },
  ], results: {
    solved: { tag: 'Intuitif(ve)', feedback: 'Bravo, trouvé du premier coup !' },
    hinted: { tag: 'Persévérant(e)', feedback: "Bien joué : avec un petit indice, tu as trouvé. La persévérance paie !" },
    missed: { tag: 'Rêveur(se) créatif(ve)', feedback: "C'étaient les pas ! Mais « des souvenirs » est une très jolie réponse." },
  } },
  { id: 104, after: 3, kind: 'cards', emoji: '🌤️', title: 'Ta saison préférée', prompt: 'Si tu devais garder une seule saison ?', options: [
    { emoji: '☀️', label: 'Été', tag: 'Lumineux(se) et sociable', feedback: "Été : plage, longues soirées, tu es plutôt solaire." },
    { emoji: '❄️', label: 'Hiver', tag: 'Cocooning et chaleureux(se)', feedback: "Hiver : plaids, thé chaud et longues discussions, tu aimes le cocon." },
    { emoji: '🌸', label: 'Printemps', tag: 'Optimiste et plein(e) de projets', feedback: 'Printemps : nouveaux départs, tu regardes devant.' },
    { emoji: '🍂', label: 'Automne', tag: 'Nostalgique et sensible', feedback: 'Automne : tu apprécies la douceur, les belles lumières et les souvenirs.' },
  ] },
  { id: 105, after: 4, kind: 'cards', emoji: '💰', title: 'Le gros lot', prompt: 'Tu gagnes un très gros lot. Ton premier réflexe ?', options: [
    { emoji: '🏠', label: 'Une maison pour ma famille', tag: 'Protecteur(trice) et attaché(e) aux siens', feedback: 'Tu penses d’abord à la sécurité et au foyer.' },
    { emoji: '🌍', label: 'Un tour du monde', tag: 'Libre et avide d’expériences', feedback: 'Tu veux voir, goûter et vivre le plus de choses possible.' },
    { emoji: '📈', label: 'Je le fais fructifier', tag: 'Stratège et prévoyant(e)', feedback: 'Tu aimes construire sur le long terme.' },
    { emoji: '🎁', label: "J'en fais profiter mes proches", tag: 'Généreux(se)', feedback: 'Pour toi, le bonheur se partage.' },
    { emoji: '🛍️', label: 'Un plaisir immédiat', tag: 'Spontané(e) et épicurien(ne)', feedback: 'Tu vis le moment présent, et tu as raison de te faire plaisir.' },
  ] },
  { id: 106, after: 5, kind: 'cards', emoji: '🦸', title: 'Un super-pouvoir', prompt: 'Tu peux choisir un seul super-pouvoir :', options: [
    { emoji: '🧠', label: 'Lire dans les pensées', tag: 'Curieux(se) des autres', feedback: 'Tu aimes comprendre ce que les gens ressentent vraiment.' },
    { emoji: '⏳', label: 'Voyager dans le temps', tag: 'Rêveur(se) et nostalgique', feedback: 'Passé ou futur, tu aimes explorer d’autres époques.' },
    { emoji: '🕊️', label: 'Voler', tag: 'Épris(e) de liberté', feedback: 'La liberté avant tout : tu vois grand et loin.' },
    { emoji: '🗣️', label: 'Parler toutes les langues', tag: 'Ouvert(e) et sociable', feedback: 'Tu veux rencontrer tout le monde, partout.' },
    { emoji: '⚡', label: 'Se téléporter', tag: 'Impatient(e) et efficace', feedback: 'Tu aimes aller droit au but, sans perdre de temps.' },
  ] },
  { id: 107, after: 6, kind: 'cards', emoji: '🍿', title: 'Soirée parfaite', prompt: 'Soirée à la maison : on met quoi ?', options: [
    { emoji: '😂', label: 'Une comédie', tag: 'Joyeux(se) et léger(ère)', feedback: 'Rire d’abord : tu aimes la bonne humeur.' },
    { emoji: '💕', label: 'Une romance', tag: 'Romantique', feedback: 'Tu crois aux belles histoires, et tu as raison.' },
    { emoji: '🕵️', label: 'Un thriller', tag: 'Curieux(se) et amateur de suspense', feedback: 'Tu aimes être tenu(e) en haleine.' },
    { emoji: '🌍', label: 'Un documentaire', tag: 'Curieux(se) et cultivé(e)', feedback: 'Apprendre quelque chose, même en se détendant : voilà ton style.' },
    { emoji: '🎮', label: 'On joue plutôt', tag: 'Joueur(se) et compétiteur(trice)', feedback: 'Tu préfères l’action et un peu de compétition amicale.' },
  ] },
  { id: 108, after: 7, kind: 'cards', emoji: '🍽️', title: 'Dîner idéal', prompt: 'Ton dîner idéal à deux, ce serait :', options: [
    { emoji: '🍝', label: 'Un italien aux chandelles', tag: 'Romantique classique', feedback: 'Chandelles et belle ambiance : tu soignes les détails.' },
    { emoji: '🥘', label: 'La cuisine de maman', tag: 'Attaché(e) aux traditions', feedback: 'Les saveurs de chez soi, rien ne les remplace.' },
    { emoji: '🍣', label: 'Une découverte (sushi, fusion…)', tag: 'Aventurier(ère) du goût', feedback: 'Tu aimes goûter ce que tu ne connais pas encore.' },
    { emoji: '🍔', label: 'Street food sans chichi', tag: 'Décontracté(e) et naturel(le)', feedback: 'Simple et bon : pas besoin de faire des manières.' },
    { emoji: '👨‍🍳', label: 'Cuisiner ensemble', tag: 'Complice et fait(e) pour le duo', feedback: 'Pour toi, le plaisir, c’est de faire les choses à deux.' },
  ] },
];

export const FUN_IDS = interludes.map((i) => i.id);

/** Résultat « pour le fun » d'une réponse (libellé + tag + retour). */
export function funResult(it, answers) {
  const sel = answers[it.id];
  if (!sel || !sel.length) return null;
  if (it.kind === 'riddle') {
    const hinted = (answers[FUN_HINT_ID] || [])[0] === 1;
    const r = sel[0] === it.answer ? (hinted ? it.results.hinted : it.results.solved) : it.results.missed;
    return { id: it.id, emoji: it.emoji, title: it.title, label: it.options[sel[0]].label, tag: r.tag, feedback: r.feedback };
  }
  const o = it.options[sel[0]];
  return { id: it.id, emoji: o.emoji || it.emoji, title: it.title, label: o.label, tag: o.tag, feedback: o.feedback };
}

/** Profil ludique d'une personne. */
export const funProfile = (answers) => interludes.map((it) => funResult(it, answers)).filter(Boolean);

/** Goûts en commun entre deux personnes (hors énigme). */
export function sharedFun(a, b) {
  return interludes.filter((it) => it.kind !== 'riddle' && a[it.id] && b[it.id] && a[it.id][0] === b[it.id][0])
    .map((it) => ({ id: it.id, title: it.title, label: it.options[a[it.id][0]].label, emoji: it.options[a[it.id][0]].emoji || it.emoji }));
}
