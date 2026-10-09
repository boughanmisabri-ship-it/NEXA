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
- Réglage de test : le seuil de match est abaissé à 60 %. Pour un vrai lancement (80 %), supprime `NEXA_THRESHOLD` dans Render → Environment.
- Premium est un bouton de test (sans paiement). Pas de vérification SMS ni de photos pour l'instant.
