# Plan B sans rien installer : faire tourner NEXA dans ton navigateur avec GitHub Codespaces

Pour un ordinateur de travail restreint (ou un téléphone) : tout se passe sur le site de GitHub, rien à installer.
Gratuit pour un compte personnel (quota mensuel d'environ 60 heures), sans carte bancaire en principe.
Je n'ai pas pu tester Codespaces ici : si une étape ne ressemble pas à ce que tu vois, envoie-moi une capture.

## 1. Mettre les fichiers à jour sur GitHub
Dans ton dépôt (celui où tu as déjà envoyé NEXA, ou un nouveau) : **Add file → Upload files**, glisse tout le contenu du
dossier `nexa-server` (dézippé) → **Commit changes**. Les fichiers du même nom sont remplacés.

## 2. Ouvrir un Codespace
1. Sur la page du dépôt, clique sur le bouton vert **Code**, onglet **Codespaces**, puis **Create codespace on main**.
2. Attends 1 à 2 minutes : un éditeur (VS Code) s'ouvre dans le navigateur, avec un **Terminal** en bas.

## 3. Démarrer NEXA
Dans le terminal, tape ces commandes (une par une, Entrée après chacune) :
```
nvm install 22
npm run check
NEXA_DEV_CODES=1 NEXA_THRESHOLD=60 NEXA_ADMIN_TOKEN=choisis-un-long-mot-de-passe-123 npm start
```
(`npm run check` doit afficher 5 ✅. Remplace le mot de passe : il sert pour la page `/admin`.)
Le terminal affiche « NEXA backend prêt ». **Laisse cet onglet ouvert.**

## 4. Rendre le lien public
1. En bas, ouvre l'onglet **Ports** : une ligne « 3000 » apparaît.
2. Clic droit sur la ligne → **Port Visibility** → **Public**.
3. Copie l'adresse de la colonne « Forwarded Address » (elle ressemble à `https://xxxx-3000.app.github.dev`) : **c'est le lien à envoyer à tes amis.**

## À savoir
- La première fois, GitHub affiche une page d'avertissement « development port » : il suffit de cliquer sur **Continue**.
- Le Codespace s'arrête après 30 minutes sans activité : si le lien ne répond plus, rouvre-le depuis github.com/codespaces et relance l'étape 3 (tes données sont conservées).
- Pour l'APK, cette page d'avertissement peut bloquer l'appli mobile : pour l'APK, il vaudra mieux un vrai hébergement.
- Code SMS affiché à l'écran (mode test) et seuil de match à 60 % : réglages de test.
