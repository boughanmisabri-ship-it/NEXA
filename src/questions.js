// Généré à partir de lib/questions.dart — source de vérité partagée app/backend.
const DIMS = { couple:'couple', family:'family', personality:'personality', comm:'comm', lifestyle:'lifestyle', ambition:'ambition', interests:'interests' };
function q(id, dim, text, options, o = {}) { return { id, dim, text, options, axes: o.axes || {}, maxChoices: o.maxChoices || 0, heavy: o.heavy || [], key: o.key || null }; }
export const questions = [
  q(1, 'couple', 'Que recherches-tu principalement aujourd\'hui ?', [
    'Une relation sérieuse pouvant mener au mariage',
    'Une relation sérieuse, mais sans précipiter les choses',
    'Faire connaissance et voir où cela mène',
    'Une relation légère / sans engagement',
    'Je ne sais pas encore',
  ], {axes: {
    'CLOSE': [90, 85, 65, 35, 50],
    'FAMILY': [90, 80, 55, 20, 45],
  }, key: 'intent'}),
  q(2, 'couple', 'Pour toi, dans un couple, quelle importance a la fidélité ?', [
    "Absolue : aucune exception, jamais",
    "Très importante : une trahison serait très difficile à pardonner",
    "Importante, mais on peut discuter des limites du couple",
    "Je suis flexible sur ce sujet, je m'adapte au couple",
  ], {axes: {
    'CLOSE': [95, 90, 75, 45],
    'FLEX': [45, 55, 75, 90],
  }, key: 'fidelity'}),
  q(3, 'couple', 'Quelle place souhaites-tu donner à ton/ta partenaire dans ta vie ?', [
    "Centrale : on décide et on fait presque tout ensemble",
    "Très importante, avec chacun ses amis et ses activités",
    "Une priorité parmi d'autres (famille, amis, travail, projets)",
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
    "Je ne sais pas encore",
  ], {axes: {
    'CLOSE': [95, 80, 45, 60],
    'INDEP': [15, 55, 95, 60],
  }}),
  q(6, 'couple', 'Quelle importance accordes-tu à la communication dans un couple ?', [
    "Tout se dit, même les sujets difficiles, sans filtre",
    "On se dit l'essentiel, chacun garde un jardin secret",
    "On parle surtout quand il y a un problème à régler",
    "Je préfère éviter les discussions sur les problèmes",
  ], {axes: {
    'COMM': [100, 85, 70, 30],
    'CONFLICT': [90, 80, 70, 35],
  }}),
  q(7, 'couple', 'Lorsque tu commences une relation, à quel rythme souhaites-tu avancer ?', [
    "Vite : si on se plaît, on s'engage rapidement",
    "Doucement : on prend plusieurs mois pour se connaître",
    "Sans pression : on voit comment ça évolue, sans étapes fixées",
    "Selon la personne : j'adapte le rythme à ce que ressent l'autre",
  ], {axes: {
    'FLEX': [55, 75, 90, 80],
    'CLOSE': [85, 70, 70, 55],
  }}),
  q(8, 'couple', 'Qu\'est-ce qui est le plus important pour toi dans une relation ? (3 max)', [
    'Confiance', 'Fidélité', 'Communication', 'Complicité', 'Attraction',
    'Respect', 'Stabilité', 'Liberté / indépendance', 'Humour',
    'Soutien mutuel', 'Valeurs communes', 'Projets communs',
  ], {maxChoices: 3, heavy: [0, 1, 2, 5, 10], key: 'values'}),
  q(9, 'personality', 'Après une semaine très chargée, quel week-end te ferait le plus de bien ?', [
    "Sortir, voir des amis et profiter",
    "Faire une activité à deux avec mon/ma partenaire",
    "Rester tranquillement à la maison",
    "Un mélange de sorties et de moments calmes",
    "Une escapade : nature, plage, petite virée",
  ], {axes: {'SOCIAL': [90, 70, 30, 60, 55], 'ACTIVITY': [90, 70, 30, 60, 85]}}),
  q(10, 'personality', 'Ton/ta partenaire est contrarié(e), mais ne veut pas parler. Tu…', [
    "Lui laisse de l'espace jusqu'à ce qu'il/elle soit prêt(e)",
    "Essaies doucement de comprendre ce qui ne va pas",
    "Insistes pour régler le problème immédiatement",
    "Fais quelque chose de gentil (message, repas, câlin) sans en parler",
    "Ne sais pas trop comment réagir",
  ], {axes: {'COMM': [40, 70, 80, 50, 45], 'CONFLICT': [65, 80, 45, 60, 35]}}),
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
  q(12, 'personality', 'Lorsqu\'une personne te fait une remarque négative sur toi, ta première réaction est plutôt…', [
    "J'essaie de comprendre si elle a raison",
    "Je me défends immédiatement",
    "Ça me touche, même si je ne le montre pas",
    "Je l'écoute mais je passe rapidement à autre chose",
    "J'en parle ensuite à un proche pour avoir un avis extérieur",
  ], {axes: {'CONFLICT': [90, 35, 50, 65, 70], 'COMM': [75, 40, 35, 60, 60]}}),
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
  q(14, 'personality', 'Dans un groupe de personnes que tu ne connais pas, tu es généralement…', [
    "Je lance les conversations et j'anime le groupe",
    "Je m'intègre facilement après quelques minutes",
    "J'observe d'abord, puis je participe",
    "Je reste avec une ou deux personnes, en petit comité",
    "Je préfère éviter ce genre de situation",
  ], {axes: {
    'SOCIAL': [95, 75, 50, 40, 20],
    'ACTIVITY': [80, 65, 45, 40, 30],
  }}),
  q(15, 'personality', 'Ton/ta partenaire fait quelque chose qui t\'a vraiment déçu(e). Que fais-tu généralement ?', [
    "J'en parle directement",
    "J'attends d'être calme avant d'en parler",
    "Je prends mes distances quelque temps, sans expliquer",
    "Je garde ça pour moi et je fais comme si de rien n'était",
    "Cela dépend de la situation",
  ], {axes: {
    'COMM': [95, 80, 35, 25, 60],
    'CONFLICT': [90, 85, 45, 30, 60],
  }}),
  q(16, 'personality', 'Laquelle de ces phrases te correspond le mieux ?', [
    "Je vis beaucoup dans le moment présent",
    "J'aime prévoir et organiser les choses",
    "J'ai besoin d'un équilibre entre spontanéité et organisation",
    "Je suis fidèle à mes habitudes et à ma routine",
    "Je change facilement d'avis selon les circonstances",
  ], {axes: {'PLAN': [20, 95, 60, 70, 35], 'FLEX': [60, 35, 80, 25, 95]}}),
  q(17, 'comm', 'Lorsqu\'un désaccord apparaît dans ton couple, tu préfères…', [
    "En parler immédiatement pour régler le problème",
    "Attendre que les émotions retombent puis en discuter",
    "Écrire un message pour dire ce que je ressens, avant d'en parler",
    "Éviter les confrontations autant que possible",
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
  q(19, 'comm', 'Lorsque tu es énervé(e) pendant une dispute, tu as plutôt tendance à…', [
    "Continuer à discuter pour trouver une solution",
    "Faire une pause puis revenir discuter",
    "Me taire jusqu'à ce que je me calme",
    "Dire ce que je pense même si je peux dépasser ma pensée",
    "Quitter la pièce et couper la discussion",
  ], {axes: {
    'CONFLICT': [85, 95, 55, 35, 25],
    'COMM': [90, 80, 40, 70, 25],
  }}),
  q(20, 'comm', 'Ton/ta partenaire te reproche quelque chose que tu ne penses pas avoir fait. Tu…', [
    "Tu l'écoutes en entier avant de répondre",
    "Tu expliques immédiatement ta version",
    "Tu proposes un compromis pour avancer",
    "Tu te sens injustement accusé(e)",
    "Tu préfères arrêter la discussion et y revenir plus tard",
  ], {axes: {
    'CONFLICT': [95, 50, 85, 40, 60],
    'FLEX': [85, 35, 90, 40, 60],
  }}),
  q(21, 'comm', 'Après une dispute importante, qu\'attends-tu principalement de ton/ta partenaire ?', [
    "Qu'il/elle fasse le premier pas tout de suite",
    "Qu'il/elle me laisse un peu de temps",
    "Un geste d'affection pour montrer que tout va bien",
    "Des excuses si nécessaire",
    "Une discussion calme pour comprendre ce qui s'est passé",
  ], {axes: {
    'COMM': [85, 50, 70, 65, 95],
    'CLOSE': [75, 40, 90, 65, 70],
  }}),
  q(22, 'comm', 'Ton/ta partenaire fait une erreur qui te blesse mais la reconnaît sincèrement. Pour toi…', [
    "Je pardonne vite et je tourne la page",
    "Je pardonne, mais il me faut du temps",
    "Je pardonne mais je n'oublie pas : ça reste en moi",
    "Ça dépend de la gravité de l'erreur",
    "Certaines erreurs sont impardonnables pour moi",
  ], {axes: {
    'CONFLICT': [95, 80, 45, 65, 40],
    'FLEX': [90, 75, 40, 60, 35],
  }}),
  q(23, 'lifestyle', 'Quel rythme de vie te correspond le mieux ?', [
    "Très actif(ve) : j'aime toujours avoir quelque chose à faire",
    "Actif(ve), mais j'apprécie aussi les moments calmes",
    "Plutôt calme : une sortie ou deux par semaine me suffisent",
    "Très casanier(ère) : ma maison est mon endroit préféré",
    "Ça dépend des périodes",
  ], {axes: {
    'ACTIVITY': [95, 75, 40, 15, 55],
    'SOCIAL': [80, 65, 40, 25, 55],
  }}),
  q(24, 'lifestyle', 'À quelle fréquence aimes-tu sortir avec des amis ?', [
    'Plusieurs fois par semaine',
    'Environ une fois par semaine',
    'Quelques fois par mois',
    'Rarement',
    'Je préfère principalement les sorties en couple',
  ], {axes: {
    'SOCIAL': [95, 80, 55, 25, 35],
    'CLOSE': [20, 40, 60, 75, 95],
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
  q(26, 'lifestyle', 'Quel rôle le sport joue-t-il dans ta vie ?', [
    "Tous les jours ou presque",
    "2 à 3 fois par semaine",
    "Quand j'en ai envie, sans routine",
    "Rarement",
    "Jamais",
  ], {axes: {
    'ACTIVITY': [95, 85, 65, 35, 15],
    'PLAN': [85, 75, 50, 35, 25],
  }}),
  q(27, 'lifestyle', 'Quel type de vacances te correspond le mieux ?', [
    'Voyage aventure / découverte',
    'Plage, détente et repos',
    'Découvrir des villes, restaurants et lieux culturels',
    'Voyage organisé et confortable',
    'Rester près de chez moi me convient parfaitement',
    'Un mélange de plusieurs styles',
  ], {axes: {
    'ACTIVITY': [95, 25, 70, 35, 15, 60],
    'SOCIAL': [70, 40, 75, 45, 25, 60],
  }}),
  q(28, 'lifestyle', 'Comment gères-tu généralement ton argent ?', [
    'Je planifie et j\'épargne beaucoup',
    'Je dépense raisonnablement tout en épargnant',
    'Je profite de mon argent sans trop calculer',
    'Je dépense facilement pour les loisirs et les expériences',
    'Je préfère que chacun gère totalement son argent',
  ], {axes: {
    'PLAN': [95, 80, 40, 25, 50],
    'INDEP': [40, 50, 45, 55, 95],
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
  q(30, 'family', 'Quelle place le mariage occupe-t-il dans ton projet de vie ?', [
    "C'est un objectif important pour moi",
    "Je veux me marier, mais seulement avec la bonne personne",
    "Le mariage viendra peut-être, mais ce n'est pas un objectif",
    "Je ne suis pas particulièrement intéressé(e) par le mariage",
    "Je ne sais pas encore",
  ], {axes: {
    'FAMILY': [95, 80, 55, 20, 45],
    'CLOSE': [90, 80, 60, 35, 50],
  }, key: 'marriage'}),
  q(31, 'family', 'Souhaites-tu avoir des enfants ?', [
    'Oui, certainement',
    'Oui, probablement',
    'Je ne sais pas encore',
    'Probablement pas',
    'Non',
  ], {axes: {
    'FAMILY': [95, 80, 50, 25, 5],
  }, key: 'children'}),
  q(32, 'family', 'Combien d\'enfants aimerais-tu idéalement avoir ?', [
    'Aucun', '1', '2', '3 ou plus', 'Je ne sais pas encore',
  ], {axes: {
    'FAMILY': [5, 40, 75, 95, 50],
  }}),
  q(33, 'family', 'Quelle importance accordes-tu à la famille dans ta vie ?', [
    "Très importante, ma famille occupe une place centrale",
    "Importante, mais je veux préserver l'équilibre avec ma vie de couple",
    "Importante, mais je la vois surtout pour les occasions",
    "Je suis assez indépendant(e) de ma famille",
    "La famille n'a pas une place particulière dans ma vie",
  ], {axes: {
    'FAMILY': [95, 80, 65, 35, 15],
  }}),
  q(34, 'family', 'Quelle relation souhaites-tu avoir avec la famille de ton/ta partenaire ?', [
    "Très proche, comme avec ma propre famille",
    "Chaleureuse : on se voit régulièrement",
    "Cordiale : on se voit surtout lors des occasions",
    "Distante : chacun garde sa famille de son côté",
    "Je n'ai pas d'attente particulière",
  ], {axes: {
    'FAMILY': [95, 80, 55, 40, 50],
    'INDEP': [20, 45, 65, 90, 60],
  }}),
  q(35, 'family', 'Si ton/ta partenaire souhaite vivre dans une autre ville pour son travail, tu serais…', [
    "Je pars sans hésiter",
    "J'y réfléchis sérieusement avec lui/elle",
    "Je chercherais un compromis (télétravail, distance)",
    "Je préférerais qu'il/elle trouve un travail ici",
    "Hors de question de quitter ma ville",
  ], {axes: {
    'FLEX': [95, 85, 70, 40, 15],
    'AMBITION': [80, 70, 55, 35, 25],
  }}),
  q(36, 'family', 'Comment les grandes décisions d\'un couple doivent-elles être prises ?', [
    'Toujours ensemble',
    'Ensemble, mais chacun doit avoir son domaine de décision',
    'Celui/celle qui est le plus concerné(e) décide',
    'Cela dépend de la situation',
    'Je préfère une grande indépendance dans les décisions',
  ], {axes: {
    'CLOSE': [95, 75, 50, 60, 30],
    'INDEP': [20, 50, 75, 60, 95],
  }}),
  q(37, 'ambition', 'Quelle importance accordes-tu à ta carrière professionnelle ?', [
    "C'est une priorité majeure dans ma vie",
    "Très importante : j'accepte de beaucoup travailler pour réussir",
    "Importante, mais je protège mes soirées et mes week-ends",
    "Ma vie personnelle passe avant ma carrière",
    "Le travail n'occupe pas une place importante dans ma vie",
  ], {axes: {
    'AMBITION': [95, 85, 65, 40, 20],
    'PLAN': [85, 80, 60, 45, 30],
  }}),
  q(38, 'ambition', 'Ton/ta partenaire souhaite consacrer beaucoup de temps à sa carrière. Comment le vois-tu ?', [
    "Je trouve ça très positif et je l'encourage",
    "Pas de souci tant qu'on garde du temps pour nous",
    "Je préférerais que le couple reste prioritaire",
    "Cela pourrait créer des difficultés dans notre relation",
    "Je ne sais pas",
  ], {axes: {
    'AMBITION': [95, 80, 40, 25, 50],
    'FLEX': [90, 85, 50, 25, 55],
  }}),
  q(39, 'ambition', 'Comment imagines-tu ta vie dans 5 à 10 ans ?', [
    'Une vie stable : couple, famille et maison',
    'Une carrière ambitieuse avec beaucoup de projets',
    'Beaucoup de voyages et de nouvelles expériences',
    'Créer une entreprise ou développer mes propres projets',
    'Une vie simple et tranquille',
    'Je n\'ai pas encore de vision précise',
  ], {axes: {
    'FAMILY': [95, 35, 35, 25, 75, 50],
    'AMBITION': [30, 95, 60, 90, 15, 45],
  }}),
  q(40, 'ambition', 'Si tu avais la possibilité de partir vivre à l\'étranger avec ton/ta partenaire, tu…', [
    "Je saisirais l'opportunité sans hésiter",
    "J'en discuterais longuement avant de décider",
    "Je partirais quelques années, puis je reviendrais en Tunisie",
    "Je ne voudrais pas quitter la Tunisie",
    "Ça dépendrait du pays et des conditions",
  ], {axes: {'FLEX': [95, 85, 70, 20, 60], 'AMBITION': [85, 75, 60, 25, 55]}}),
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
  q(42, 'interests', 'Quelles activités aimerais-tu partager avec ton/ta partenaire ? (5 max)', [
    'Restaurants / sorties', 'Voyage', 'Sport', 'Cinéma / séries',
    'Jeux vidéo', 'Musique / concerts', 'Plage / nature', 'Cuisine',
    'Shopping', 'Activités culturelles', 'Soirées entre amis',
    'Activités à la maison',
  ], {maxChoices: 5}),
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
  q(45, 'interests', 'Quelle place les animaux occupent-ils dans ta vie ?', [
    "Je les adore et j'aimerais en avoir",
    "Je les aime, mais ce n'est pas indispensable chez moi",
    "J'aime les voir chez les autres, pas chez moi",
    "Je suis plutôt indifférent(e)",
    "Je préfère éviter les animaux",
    "Impossible pour moi d'en avoir à la maison",
  ], {axes: {
    'ACTIVITY': [95, 85, 60, 45, 25, 5],
    'FLEX': [40, 50, 75, 80, 65, 10],
  }}),
  q(46, 'interests', 'Quel type de soirée te correspond le mieux ?', [
    'Dîner au restaurant puis sortir',
    'Soirée entre amis',
    'Cinéma / activité tranquille',
    'Soirée romantique à deux',
    'Rester à la maison avec un film ou une série',
    'Ça dépend de mon humeur',
  ], {axes: {
    'SOCIAL': [80, 100, 60, 40, 20, 50],
    'CLOSE': [60, 45, 70, 100, 70, 55],
  }}),
  q(47, 'couple', 'Lesquelles de ces situations seraient rédhibitoires pour toi ? (facultatif)', [
    'Mensonge fréquent', 'Infidélité', 'Manque de respect',
    'Jalousie excessive', 'Manque d\'ambition', 'Manque d\'indépendance',
    'Consommation excessive d\'alcool', 'Tabac', 'Refus d\'avoir des enfants',
    'Refus du mariage', 'Manque de communication', 'Autre',
  ], {maxChoices: 12, key: 'dealbreakers'}),
  q(48, 'family', 'Ton/ta partenaire ne partage pas tes principales valeurs personnelles. Pour toi…', [
    "C'est rédhibitoire, je ne continue pas",
    "Très difficile : j'aurais du mal à rester",
    "Acceptable si on se respecte",
    "Une richesse : j'aime découvrir d'autres façons de voir",
    "Ça dépend des valeurs concernées",
  ], {axes: {
    'FLEX': [15, 30, 70, 90, 95],
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
  q(50, 'family', 'Que doit absolument partager ton/ta futur(e) partenaire avec toi ? (3 max)', [
    'Vision du couple', 'Valeurs', 'Projet familial', 'Désir d\'avoir des enfants',
    'Communication', 'Mode de vie', 'Ambition', 'Fidélité', 'Sens de l\'humour',
    'Centres d\'intérêt', 'Attraction', 'Spiritualité / religion', 'Vision financière',
  ], {maxChoices: 3, heavy: [0, 1, 2, 3, 4, 7], key: 'must'}),
];
export const RETIRED_IDS = [4, 11, 13, 18, 25, 29, 41, 43, 44, 49];
export const activeQuestions = questions.filter((q) => !RETIRED_IDS.includes(q.id));
