# Plan B : faire tourner NEXA sur ton ordinateur et le partager avec tes amis (gratuit)

Idéal pour un test entre amis : pas d'hébergeur, pas de carte bancaire. L'ordinateur doit rester allumé et connecté pendant le test.

## 1. Installer Node.js (une seule fois)
Va sur https://nodejs.org, télécharge la version **LTS** (22 ou plus) et installe-la (Suivant, Suivant…).

## 2. Démarrer NEXA
1. Décompresse **NEXA_en_ligne.zip** (clic droit → Extraire tout) et ouvre le dossier `nexa-server`.
2. Double-clique sur **demarrer-nexa.bat**. Une fenêtre noire s'ouvre et affiche « NEXA démarre sur http://localhost:3000 ».
   **Ne la ferme pas.** Note le « jeton administrateur » affiché : c'est ton mot de passe pour la page de modération (`/admin`).
3. Ouvre http://localhost:3000 dans ton navigateur : tu dois voir NEXA.
   (Pour vérifier l'installation : dans le dossier, ouvre une invite de commandes et tape `npm run check`.)

## 3. Donner un lien public à tes amis (sans compte)
1. Va sur https://github.com/cloudflare/cloudflared/releases/latest et télécharge **cloudflared-windows-amd64.exe**.
2. Dans le dossier où tu l'as téléchargé, ouvre une invite de commandes (clique dans la barre d'adresse de l'Explorateur, tape `cmd`, Entrée) et lance :
   `cloudflared-windows-amd64.exe tunnel --url http://localhost:3000`
3. Après quelques secondes, il affiche une adresse du type `https://mots-au-hasard.trycloudflare.com`. **C'est le lien à envoyer à tes amis.**
   (Je n'ai pas pu tester cette étape ici ; c'est un service gratuit de Cloudflare qui ne demande pas de compte.)

## À savoir
- Le lien change à chaque fois que tu relances cloudflared, et il ne marche que tant que ton ordinateur et les deux fenêtres noires restent ouverts.
- Le code SMS s'affiche à l'écran (mode test), il n'y a pas de vrai SMS.
- Tes amis voient seulement NEXA ; tes autres fichiers ne sont pas accessibles.
- Pour l'APK : dans GitHub Actions, utilise ce lien `https://…trycloudflare.com` comme adresse du serveur. Il faudra refabriquer l'APK si le lien change.
