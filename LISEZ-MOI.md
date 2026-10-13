# NEXA — version en ligne pour tes amis (gratuit)

## 1. Mettre le dossier sur GitHub
1. Crée un compte sur github.com (gratuit), puis clique **New repository** → nom `nexa` → **Create repository**.
2. Sur la page du dépôt, clique **uploading an existing file**.
3. Glisse **tout le contenu de ce dossier** (src, public, test, package.json, render.yaml…) puis **Commit changes**.

## 2. Le mettre en ligne sur Render
1. Crée un compte sur render.com (gratuit) en te connectant avec GitHub.
2. **New +** → **Blueprint** → choisis ton dépôt `nexa` → **Apply**.
3. Attends 2-3 minutes. Render te donne une adresse du type `https://nexa-xxxx.onrender.com`.
4. Envoie cette adresse à tes amis : chacun crée son compte, répond aux 50 questions, et vous vous voyez entre vous.

## À savoir
- Gratuit = le serveur s'endort après ~15 min sans visite (premier chargement : environ 1 minute).
- Gratuit = les comptes peuvent être effacés quand Render redémarre le serveur. C'est suffisant pour un test, pas pour un vrai lancement.
- Les hommes matchent avec les femmes (et inversement), selon « Je suis / Je cherche ».
- Réglage de test : le seuil de match est abaissé à 60 %. Pour un vrai lancement (75 %), supprime `NEXA_THRESHOLD` dans Render → Environment.
- Premium est un bouton de test (sans paiement). Pas de vérification SMS ni de photos pour l'instant.

## Sécurité des comptes (nouveau)
- Chaque compte doit vérifier son numéro avec un code SMS à 6 chiffres (valable 10 min, 5 essais, 5 envois par heure).
- En test, le code s'affiche à l'écran (`NEXA_DEV_CODES=1`). Pour de vrais SMS : retirer cette variable et définir `NEXA_SMS=twilio`, `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` (envoi Twilio non testé ici).
- Protections : 8 inscriptions max par heure et par connexion internet, compte verrouillé 15 min après 5 mots de passe faux, 20 messages/minute, 15 demandes de connexion/jour, mots de passe trop simples refusés, numéros normalisés (+216) pour éviter les doublons.

## Contrôle de la qualité du matching
`node tools/calibrate.js` simule 300 profils de 6 types et affiche : symétrie des scores, scores entre types, effet des seuils, profil « indécis », stabilité. À relancer après tout changement des questions ou du calcul.

## Photos (nouveau)
- 3 photos maximum par personne, JPEG/PNG/WebP, 1 Mo maximum chacune. Le serveur vérifie le vrai format du fichier (pas seulement l'extension).
- La page web réduit et ré-encode chaque photo avant l'envoi (900 px max), ce qui supprime aussi les données cachées (position GPS, etc.).
- Une photo n'est visible que par son propriétaire, par les personnes qui ont ce profil parmi leurs compatibilités visibles, ou par une personne en contact avec lui/elle. Elle n'est jamais publique.
- Option `NEXA_REQUIRE_PHOTO=1` : les profils sans photo n'apparaissent pas dans les matchs (recommandé au lancement).
- Les photos sont stockées dans la base : sur l'hébergement gratuit, elles disparaissent si la base est effacée. Aucune modération automatique du contenu des images pour l'instant.

## Modération (nouveau)
- **Signaler :** 6 catégories (faux profil, harcèlement, contenu inapproprié, arnaque, mineur, autre). On ne peut signaler qu'un profil qu'on a vu dans NEXA.
- **Suspension automatique :** 3 personnes DIFFÉRENTES qui signalent le même profil le suspendent ; 2 suffisent pour « arnaque » ou « mineur ». Un seul compte ne peut jamais suspendre quelqu'un. Une photo signalée par 2 personnes est masquée aux autres.
- **Compte suspendu :** invisible des autres, accès bloqué, avec un écran qui permet d'envoyer un recours.
- **Anti-arnaque :** les liens (http, www, noms de domaine) sont refusés dans les 5 premiers messages d'une conversation.
- **Blocage :** on peut bloquer et débloquer (liste dans `GET /blocks`).
- **Page d'administration :** définis la variable `NEXA_ADMIN_TOKEN` (16 caractères minimum, secret !) dans Render → Environment, puis ouvre `https://ton-adresse/admin`. Tu y vois les profils signalés avec leurs photos, tu peux suspendre, réactiver, classer sans suite, masquer ou supprimer une photo, et traiter les recours. Sans cette variable, la page n'existe pas.
- **À faire par un humain :** aucune détection automatique d'images ou de textes inappropriés. Il faut consulter la page `/admin` régulièrement.

## Données solides (nouveau)
- **Sauvegardes automatiques** : au démarrage puis toutes les 6 h (une par jour au maximum), avec vérification d'intégrité, rotation (7 conservées, réglable avec `NEXA_BACKUP_KEEP`). Dossier `backups/` à côté de la base (ou `NEXA_BACKUP_DIR`).
- **Copie sur TON ordinateur** : sur `/admin`, bouton « Télécharger une copie de la base ». Fais-le chaque semaine : sur un hébergement gratuit, c'est ta seule vraie protection (les fichiers du serveur sont effacés à chaque redémarrage).
- **Restaurer** : arrête le serveur puis `NEXA_DB=chemin/nexa.db npm run restore -- fichier-de-sauvegarde.db`. L'ancienne base est gardée à côté (« …avant-restauration-… »). Une sauvegarde abîmée est refusée.
- **Base abîmée** : le serveur refuse de démarrer (au lieu d'aggraver le problème) et indique comment restaurer.
- **Évolutions futures** : chaque changement de la base est une migration numérotée, jouée une seule fois et testée sur d'anciennes bases. Tes données existantes sont conservées lors des mises à jour.
- **Entretien automatique** : codes SMS expirés et vieilles notifications lues supprimés.
- **Droit d'accès** : chaque utilisateur peut télécharger ses données (Profil → « Télécharger mes données », max 3 fois par jour) ; la suppression de compte efface profil, réponses, photos et messages.
- **Persistance sur Render** : le plan gratuit n'a pas de disque durable. Pour garder les données, passe au plan payant avec disque (lignes à décommenter dans `render.yaml`).
- **PostgreSQL ?** Pas nécessaire pour démarrer : SQLite avec disque durable suffit largement pour quelques milliers d'utilisateurs. Il deviendra utile quand tu auras besoin de plusieurs serveurs en parallèle ou d'un hébergeur de base managé. Je ne l'ai pas ajouté faute de pouvoir le tester ici, et un changement non testé de la base est le meilleur moyen de perdre des données.
- **Cadre légal :** la collecte de données personnelles (dont des réponses intimes) peut demander une déclaration ou une autorisation auprès de l'autorité tunisienne de protection des données (INPDP). À vérifier avec un juriste avant le lancement.

## Test plus court et pauses fun (nouveau)
- Le test passe de 50 à **40 questions** (les 10 plus redondantes sont retirées mais gardent leur numéro, donc les anciennes réponses restent valides) + **8 mini-quiz fun** entre les thèmes : ville de rêve, couleur, énigme (avec indice), saison, gros lot, super-pouvoir, soirée parfaite, dîner idéal.
- Les mini-quiz ne comptent pas dans le score principal : chaque **goût en commun** ajoute 1 point (4 maximum, jamais de malus) et apparaît dans « Ce que vous avez en commun ». Chacun donne un profil ludique (« Ton profil fun »), clairement présenté comme un jeu, pas comme un test psychologique.
- Sur l'appli Flutter, les mini-quiz ne sont pas encore disponibles (seules les 40 questions le sont) ; la version web les a.
- L'échelle des scores a été recalibrée pour 40 questions (`node tools/calibrate.js` : aléatoire ≈ 49 %, même profil ≥ 75 % dans 68 % des cas).
