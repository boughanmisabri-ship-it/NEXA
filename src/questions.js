// Généré à partir de lib/questions.dart — source de vérité partagée app/backend.
const DIMS = { couple:'couple', family:'family', personality:'personality', comm:'comm', lifestyle:'lifestyle', ambition:'ambition', interests:'interests' };
function q(id, dim, text, options, o = {}) { return { id, dim, text, options, axes: o.axes || {}, maxChoices: o.maxChoices || 0, heavy: o.heavy || [], key: o.key || null }; }
export const questions = [
  q(1, 'couple', "Que cherches-tu aujourd'hui ?", [
    "Une relation sérieuse qui mène au mariage",
    "Une relation sérieuse, sans me presser",
    "Apprendre à connaître quelqu'un, on verra ensuite",
    "Quelque chose de léger, sans engagement",
  ], {axes: {
    'CLOSE': [90, 85, 65, 35],
    'FAMILY': [90, 80, 55, 20],
  }, key: 'intent'}),
  q(2, 'couple', "Que représente la fidélité pour toi ?", [
    "Absolue : aucune exception",
    "Importante : on fixe nos règles ensemble",
    "Flexible : je m'adapte au couple",
  ], {axes: {
    'CLOSE': [95, 75, 45],
    'FLEX': [45, 75, 90],
  }, key: 'fidelity'}),
  q(3, 'couple', "Quelle place veux-tu donner à ton/ta partenaire dans ta vie ?", [
    "Centrale : on fait presque tout ensemble",
    "Très importante, avec chacun ses amis et ses activités",
    "Une priorité parmi d'autres (famille, amis, travail)",
    "Secondaire : mon indépendance passe avant tout",
  ], {axes: {
    'CLOSE': [95, 85, 70, 45],
    'INDEP': [25, 45, 70, 95],
  }}),
  q(4, 'couple', 'Selon toi, un couple doit-il partager la majorité de ses activités ?', [
    "Presque tout à deux : c'est ça, pour moi, un couple",
    "Environ les trois quarts à deux, le reste chacun de son côté",
    "La moitié à deux, la moitié chacun",
    "Surtout chacun de son côté, avec quelques moments à deux",
  ], {axes: {
    'CLOSE': [95, 85, 65, 40],
    'INDEP': [20, 40, 70, 95],
  }}),
  q(5, 'couple', "Comment imagines-tu le quotidien d'un couple idéal ?", [
    "Tout partager : projets, finances, entourage",
    "Un duo soudé qui garde ses jardins secrets",
    "Deux personnes libres qui se retrouvent",
  ], {axes: {
    'CLOSE': [95, 80, 45],
    'INDEP': [15, 55, 95],
  }}),
  q(6, 'couple', "Comment doit-on parler dans un couple ?", [
    "Tout se dit, même les sujets difficiles",
    "On se dit l'essentiel, chacun garde un jardin secret",
    "On parle surtout quand il y a un problème",
    "J'évite de parler des problèmes",
  ], {axes: {
    'COMM': [100, 85, 70, 30],
    'CONFLICT': [90, 80, 70, 35],
  }}),
  q(7, 'couple', "À quel rythme avances-tu dans une relation ?", [
    "Vite : si on se plaît, on s'engage",
    "Doucement : on prend plusieurs mois",
    "Sans étapes fixées : on voit comment ça évolue",
  ], {axes: {
    'FLEX': [55, 75, 90],
    'CLOSE': [85, 70, 70],
  }}),
  q(8, 'couple', "Ce qui compte le plus dans une relation (3 maximum)", [
    "Confiance",
    "Fidélité",
    "Communication",
    "Respect",
    "Complicité",
    "Stabilité",
    "Liberté",
    "Valeurs communes",
  ], {maxChoices: 3, heavy: [0, 1, 2, 3, 7], key: 'values'}),
  q(9, 'personality', "Après une semaine chargée, quel week-end te ferait du bien ?", [
    "Sortir et voir du monde",
    "Une escapade nature ou plage",
    "Une activité à deux",
    "Rester tranquille à la maison",
  ], {axes: {
    'SOCIAL': [90, 55, 70, 30],
    'ACTIVITY': [90, 85, 70, 30],
  }}),
  q(10, 'personality', "Ton/ta partenaire est contrarié(e) et ne veut pas parler. Tu…", [
    "Lui laisses de l'espace",
    "Essaies doucement de comprendre",
    "Fais un geste gentil sans en parler",
    "Insistes pour régler ça tout de suite",
  ], {axes: {
    'COMM': [40, 70, 50, 80],
    'CONFLICT': [65, 80, 60, 45],
  }}),
  q(11, 'personality', 'Une sortie est prévue, mais au dernier moment ton/ta partenaire préfère rester à la maison. Tu…', [
    "Tu restes avec lui/elle, sans aucun problème",
    "Tu proposes quelque chose de plus calme à la place",
    "Tu es déçu(e) et tu le dis, mais tu restes",
    "Tu y vas sans lui/elle : ton programme est maintenu",
    "Ça dépend de la raison",
  ], {axes: {
    'FLEX': [95, 85, 65, 40, 70],
    'SOCIAL': [40, 55, 60, 80, 55],
  }}),
  q(12, 'personality', "Quelqu'un te fait une remarque négative. Ta réaction ?", [
    "J'essaie de voir si elle a raison",
    "Je me défends tout de suite",
    "Ça me touche, même si je ne le montre pas",
    "J'en parle à un proche pour avoir un avis",
  ], {axes: {
    'CONFLICT': [90, 35, 50, 70],
    'COMM': [75, 40, 35, 60],
  }}),
  q(13, 'personality', 'Lorsque tu dois prendre une décision importante, tu es plutôt…', [
    "Je prends mon temps, parfois trop, avant de trancher",
    "Je demande conseil à mes proches",
    "Je fais confiance à mon intuition",
    "Je me fixe une date limite puis je tranche",
    "Je décide rapidement et j'assume mon choix",
  ], {axes: {
    'PLAN': [80, 60, 35, 75, 45],
    'FLEX': [55, 70, 80, 60, 50],
  }}),
  q(14, 'personality', "Dans un groupe de personnes que tu ne connais pas, tu…", [
    "Lances les conversations",
    "T'intègres après quelques minutes",
    "Observes d'abord",
    "Restes en petit comité",
  ], {axes: {
    'SOCIAL': [95, 75, 50, 20],
    'ACTIVITY': [80, 65, 45, 30],
  }}),
  q(15, 'personality', "Ton/ta partenaire te déçoit. Tu…", [
    "En parles directement",
    "Attends d'être calme pour en parler",
    "Prends tes distances sans expliquer",
    "Gardes ça pour toi",
  ], {axes: {
    'COMM': [95, 80, 35, 25],
    'CONFLICT': [90, 85, 45, 30],
  }}),
  q(16, 'personality', "Laquelle de ces phrases te ressemble le plus ?", [
    "Je vis dans le moment présent",
    "J'aime prévoir et organiser",
    "Je garde mes habitudes et ma routine",
  ], {axes: {
    'PLAN': [20, 95, 70],
    'FLEX': [60, 35, 25],
  }}),
  q(17, 'comm', "Quand un désaccord apparaît, tu préfères…", [
    "En parler tout de suite",
    "Attendre que ça se calme, puis en parler",
    "Écrire ce que je ressens avant d'en parler",
    "Éviter la confrontation",
  ], {axes: {
    'COMM': [95, 80, 65, 30],
    'CONFLICT': [60, 90, 75, 30],
  }}),
  q(18, 'comm', 'Ton/ta partenaire te dit : « J\'ai besoin d\'être seul(e) ce soir. » Tu…', [
    "Respectes immédiatement son besoin d'espace",
    "Demandes si quelque chose ne va pas",
    "Acceptes, mais tu restes inquiet(ète) toute la soirée",
    "Le prends personnellement",
    "Ça dépend de la situation",
  ], {axes: {
    'INDEP': [90, 60, 70, 40, 60],
    'COMM': [55, 80, 75, 70, 60],
  }}),
  q(19, 'comm', "Énervé(e) pendant une dispute, tu…", [
    "Discutes jusqu'à trouver une solution",
    "Fais une pause puis reviens",
    "Dis ce que tu penses, parfois trop",
    "Te tais ou t'éloignes",
  ], {axes: {
    'CONFLICT': [85, 95, 35, 55],
    'COMM': [90, 80, 70, 40],
  }}),
  q(20, 'comm', "On te fait un reproche que tu trouves injuste. Tu…", [
    "L'écoutes en entier avant de répondre",
    "Expliques tout de suite ta version",
    "Proposes un compromis pour avancer",
    "Arrêtes la discussion et y reviens plus tard",
  ], {axes: {
    'CONFLICT': [95, 50, 85, 60],
    'FLEX': [85, 35, 90, 60],
  }}),
  q(21, 'comm', "Après une dispute, tu attends surtout…", [
    "Que l'autre fasse le premier pas tout de suite",
    "Un peu de temps pour moi",
    "Un geste d'affection",
    "Une discussion calme pour comprendre",
  ], {axes: {
    'COMM': [85, 50, 70, 95],
    'CLOSE': [75, 40, 90, 70],
  }}),
  q(22, 'comm', "Ton/ta partenaire reconnaît une erreur qui t'a blessé(e). Tu…", [
    "Pardonnes vite et tournes la page",
    "Pardonnes, mais il te faut du temps",
    "Pardonnes, mais tu n'oublies pas",
    "Penses que certaines erreurs sont impardonnables",
  ], {axes: {
    'CONFLICT': [95, 80, 45, 40],
    'FLEX': [90, 75, 40, 35],
  }}),
  q(23, 'lifestyle', "Quel rythme de vie te correspond ?", [
    "Très actif(ve) : toujours quelque chose à faire",
    "Actif(ve), avec des moments calmes",
    "Plutôt calme : une ou deux sorties par semaine",
    "Très casanier(ère)",
  ], {axes: {
    'ACTIVITY': [95, 75, 40, 15],
    'SOCIAL': [80, 65, 40, 25],
  }}),
  q(24, 'lifestyle', "À quelle fréquence sors-tu avec des amis ?", [
    "Plusieurs fois par semaine",
    "Environ une fois par semaine",
    "Quelques fois par mois",
    "Rarement, je préfère les sorties à deux",
  ], {axes: {
    'SOCIAL': [95, 80, 55, 25],
    'CLOSE': [20, 40, 60, 75],
  }}),
  q(25, 'lifestyle', 'Ton/ta partenaire souhaite passer une soirée avec ses amis sans toi. Tu…', [
    "Tu trouves ça totalement normal",
    "Ça me va, mais j'aimerais qu'il/elle me prévienne à l'avance",
    "Je préfère qu'on passe la majorité de nos soirées ensemble",
    "Je pourrais être un peu gêné(e)",
    "Cela dépend de la situation",
  ], {axes: {
    'INDEP': [95, 80, 30, 45, 60],
    'CLOSE': [20, 45, 90, 70, 60],
  }}),
  q(26, 'lifestyle', "Quelle place a le sport dans ta vie ?", [
    "Tous les jours ou presque",
    "2 à 3 fois par semaine",
    "Quand j'en ai envie",
    "Rarement ou jamais",
  ], {axes: {
    'ACTIVITY': [95, 85, 65, 35],
    'PLAN': [85, 75, 50, 35],
  }}),
  q(27, 'lifestyle', "Quelles vacances te ressemblent ?", [
    "Aventure et découverte",
    "Plage et détente",
    "Villes, culture et restaurants",
    "Rester près de chez moi",
  ], {axes: {
    'ACTIVITY': [95, 25, 70, 15],
    'SOCIAL': [70, 40, 75, 25],
  }}),
  q(28, 'lifestyle', "Comment gères-tu ton argent ?", [
    "Je planifie et j'épargne beaucoup",
    "Je dépense raisonnablement tout en épargnant",
    "Je profite sans trop calculer",
    "Chacun gère son argent de son côté",
  ], {axes: {
    'PLAN': [95, 80, 40, 50],
    'INDEP': [40, 50, 45, 95],
  }}),
  q(29, 'lifestyle', 'Après une longue journée de travail, tu préfères…', [
    'Passer du temps avec mon/ma partenaire',
    'Sortir ou faire une activité',
    'Me détendre seul(e)',
    'Faire du sport',
    'Regarder un film/série à la maison',
    'Ça dépend de la journée',
  ], {axes: {
    'CLOSE': [95, 40, 25, 40, 55, 60],
    'SOCIAL': [45, 85, 20, 50, 30, 50],
  }}),
  q(30, 'family', "Quelle place a le mariage dans ton projet de vie ?", [
    "Un objectif important pour moi",
    "Je veux me marier, mais avec la bonne personne",
    "Ce n'est pas un objectif, ça viendra peut-être",
    "Ça ne m'intéresse pas",
  ], {axes: {
    'FAMILY': [95, 80, 55, 20],
    'CLOSE': [90, 80, 60, 35],
  }, key: 'marriage'}),
  q(31, 'family', "Souhaites-tu avoir des enfants ?", [
    "Oui, certainement",
    "Oui, probablement",
    "Je ne sais pas encore",
    "Non",
  ], {axes: {
    'FAMILY': [95, 80, 50, 5],
  }, key: 'children'}),
  q(32, 'family', "Combien d'enfants aimerais-tu avoir ?", [
    "Je n'en veux pas",
    "1 enfant",
    "2 enfants",
    "3 enfants ou plus",
  ], {axes: {
    'FAMILY': [5, 40, 75, 95],
  }}),
  q(33, 'family', "Quelle importance a ta famille dans ta vie ?", [
    "Centrale : ma famille passe en premier",
    "Importante, en équilibre avec ma vie de couple",
    "Importante, mais je la vois surtout pour les occasions",
    "Je suis plutôt indépendant(e) de ma famille",
  ], {axes: {
    'FAMILY': [95, 80, 65, 35],
  }}),
  q(34, 'family', "Quelle relation veux-tu avec la famille de ton/ta partenaire ?", [
    "Très proche, comme avec ma propre famille",
    "Chaleureuse : on se voit régulièrement",
    "Cordiale : surtout aux occasions",
    "Distante : chacun garde sa famille de son côté",
  ], {axes: {
    'FAMILY': [95, 80, 55, 40],
    'INDEP': [20, 45, 65, 90],
  }}),
  q(35, 'family', "Ton/ta partenaire doit déménager pour son travail. Tu…", [
    "Pars sans hésiter",
    "Y réfléchis sérieusement avec lui/elle",
    "Cherches un compromis (télétravail, distance)",
    "Refuses de quitter ta ville",
  ], {axes: {
    'FLEX': [95, 85, 70, 15],
    'AMBITION': [80, 70, 55, 25],
  }}),
  q(36, 'family', "Comment prendre les grandes décisions du couple ?", [
    "Toujours ensemble",
    "Ensemble, mais chacun a son domaine",
    "La personne la plus concernée décide",
    "Chacun décide de son côté",
  ], {axes: {
    'CLOSE': [95, 75, 50, 30],
    'INDEP': [20, 50, 75, 95],
  }}),
  q(37, 'ambition', "Quelle place a ta carrière ?", [
    "Une priorité majeure, j'accepte de beaucoup travailler",
    "Importante, mais je protège ma vie personnelle",
    "Ma vie personnelle passe avant",
  ], {axes: {
    'AMBITION': [95, 65, 40],
    'PLAN': [85, 60, 45],
  }}),
  q(38, 'ambition', "Ton/ta partenaire s'investit beaucoup dans sa carrière. Tu…", [
    "L'encourages, c'est très positif",
    "N'as pas de souci tant qu'on garde du temps pour nous",
    "Préfères que le couple reste prioritaire",
    "Crains des tensions dans votre relation",
  ], {axes: {
    'AMBITION': [95, 80, 40, 25],
    'FLEX': [90, 85, 50, 25],
  }}),
  q(39, 'ambition', "Comment imagines-tu ta vie dans 5 à 10 ans ?", [
    "Stable : couple, famille, maison",
    "Une carrière ambitieuse",
    "Beaucoup de voyages et d'expériences",
    "Mon propre projet ou ma propre entreprise",
  ], {axes: {
    'FAMILY': [95, 35, 35, 25],
    'AMBITION': [30, 95, 60, 90],
  }}),
  q(40, 'ambition', "Vivre à l'étranger avec ton/ta partenaire, ce serait…", [
    "Oui, sans hésiter",
    "À discuter longuement avant de décider",
    "Quelques années, puis retour en Tunisie",
    "Non, je ne veux pas quitter la Tunisie",
  ], {axes: {
    'FLEX': [95, 85, 70, 20],
    'AMBITION': [85, 75, 60, 25],
  }}),
  q(41, 'ambition', 'Dans un couple, comment vois-tu les ambitions personnelles ?', [
    "Nous devons nous soutenir mutuellement pour réaliser nos ambitions",
    "Chacun poursuit ses ambitions de son côté",
    "Les projets communs doivent passer avant les projets personnels",
    "Je préfère une relation où la stabilité est plus importante que l'ambition",
    "Je n'ai pas vraiment d'avis",
  ], {axes: {
    'AMBITION': [90, 70, 40, 20, 50],
    'FLEX': [85, 75, 60, 50, 50],
  }}),
  q(42, 'interests', "Activités à partager avec ton/ta partenaire (3 maximum)", [
    "Restaurants et sorties",
    "Voyages",
    "Sport",
    "Cinéma et séries",
    "Musique et concerts",
    "Plage et nature",
    "Cuisine",
    "Soirées entre amis",
  ], {maxChoices: 3}),
  q(43, 'interests', 'Quel rôle les voyages jouent-ils dans ta vie ?', [
    "Plusieurs voyages par an : c'est essentiel pour moi",
    "Un ou deux grands voyages par an",
    "Quand l'occasion se présente, sans en faire une priorité",
    "Je préfère les vacances tranquilles près de chez moi",
    "Je voyage rarement",
  ], {axes: {
    'ACTIVITY': [95, 80, 55, 30, 15],
    'FLEX': [80, 75, 60, 50, 40],
  }}),
  q(44, 'interests', 'Quel type d\'activité physique préfères-tu ?', [
    'Salle de sport / musculation',
    'Course / marche',
    'Sports collectifs',
    'Sports de raquette',
    'Activités en plein air',
    'Je préfère les activités calmes',
    'Je ne pratique pas vraiment de sport',
  ], {axes: {
    'ACTIVITY': [90, 80, 80, 75, 85, 35, 10],
    'SOCIAL': [50, 40, 90, 70, 55, 25, 25],
  }}),
  q(45, 'interests', "Quelle place ont les animaux pour toi ?", [
    "J'adore, j'aimerais en avoir",
    "Je les aime, mais ce n'est pas indispensable chez moi",
    "Je suis plutôt indifférent(e)",
    "Pas d'animaux à la maison",
  ], {axes: {
    'ACTIVITY': [95, 85, 45, 25],
    'FLEX': [40, 50, 80, 65],
  }}),
  q(46, 'interests', "Ta soirée type ?", [
    "Dîner puis sortie",
    "Soirée entre amis",
    "Soirée romantique à deux",
    "Film ou série à la maison",
  ], {axes: {
    'SOCIAL': [80, 100, 40, 20],
    'CLOSE': [60, 45, 100, 70],
  }}),
  q(47, 'couple', "Ce qui serait rédhibitoire pour toi (3 maximum, facultatif)", [
    "Mensonge fréquent",
    "Infidélité",
    "Manque de respect",
    "Jalousie excessive",
    "Refus d'avoir des enfants",
    "Refus du mariage",
    "Manque de communication",
    "Manque d'ambition",
  ], {maxChoices: 3, key: 'dealbreakers'}),
  q(48, 'family', "Ton/ta partenaire ne partage pas tes valeurs principales. Pour toi…", [
    "C'est rédhibitoire, je ne continue pas",
    "C'est très difficile, j'aurais du mal à rester",
    "C'est acceptable si on se respecte",
    "C'est une richesse, j'aime découvrir d'autres façons de voir",
  ], {axes: {
    'FLEX': [15, 30, 70, 90],
  }}),
  q(49, 'family', 'Quelle différence de mode de vie pourrais-tu difficilement accepter ?', [
    'Une personne très casanière alors que je suis très sociable',
    'Une personne très dépensière alors que je suis économe',
    'Une personne très indépendante alors que je suis très fusionnel(le)',
    'Une personne très religieuse alors que je ne le suis pas',
    'Une personne qui ne souhaite pas avoir d\'enfants',
    'Une personne qui ne souhaite pas se marier',
    'Aucune en particulier',
  ], {axes: {
    'FLEX': [40, 40, 35, 25, 20, 25, 95],
  }}),
  q(50, 'family', "Ce que ton/ta partenaire doit absolument partager avec toi (3 maximum)", [
    "Valeurs",
    "Projet familial",
    "Désir d'avoir des enfants",
    "Communication",
    "Fidélité",
    "Mode de vie",
    "Religion et spiritualité",
    "Vision financière",
  ], {maxChoices: 3, heavy: [0, 1, 2, 3, 4], key: 'must'}),
];
export const RETIRED_IDS = [4, 11, 13, 18, 25, 29, 41, 43, 44, 49];
export const activeQuestions = questions.filter((q) => !RETIRED_IDS.includes(q.id));
