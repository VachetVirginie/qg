# QG · Carnets de culture générale

Des fiches en français d’environ 190 mots, consultables sur mobile et imprimables au format A5 depuis le navigateur.

## Publication

Dans **Settings → Pages → Build and deployment**, sélectionner **GitHub Actions** comme source. Le workflow **Carnets QG** publie le site à chaque modification de `main` et programme une nouvelle fiche à 8 h 17 (heure de Paris) chaque jour. GitHub peut décaler le démarrage. Consulter l’onglet **Actions** pour suivre la génération et le déploiement.

## Proposer des sujets

Ouvre [le fichier de sujets sur GitHub](https://github.com/VachetVirginie/qg/edit/main/sujets.txt) avec ton compte GitHub. Saisis **un sujet par ligne** dans `sujets.txt`, dans l’ordre souhaité, puis choisis **Commit changes** et enregistre sur `main`. Tu peux coller une liste à puces ou numérotée.

Le workflow donne la priorité aux sujets de la liste et publie un sujet par jour. Il recherche l’article correspondant sur Wikipédia en français, puis retire le sujet de la liste si la fiche est publiée ou existe déjà. Un sujet sans extrait adapté reste visible avec le préfixe `# À préciser :`. Reformule-le et retire le préfixe pour le remettre dans la liste. En l’absence de sujet disponible, le workflow sélectionne un article labellisé.

Pour publier un sujet immédiatement, ouvrir **Actions → Carnets QG → Run workflow** et remplir le champ `subject`. Le laisser vide suit la liste d’attente et publie uniquement si la fiche du jour est encore à créer.

## Travail local

Avec Node.js 24, sans installation de dépendances :

```sh
node scripts/qg.mjs
python3 -m http.server 8000
```

Ouvrir <http://localhost:8000>. Pour produire une fiche via Wikipédia, utiliser `node scripts/qg.mjs --daily` ou `node scripts/qg.mjs --subject 'La Nuit étoilée (Van Gogh)'`. Les données éditoriales sont dans `contenu/`. Le script génère `index.html` et les pages `fiches/*.html`.

La génération sélectionne des phrases entières de l’introduction de l’article, avec une longueur cible de 180 à 205 mots. Elle accepte des extraits d’au moins 135 mots pour s’arrêter sur une phrase complète. Chaque fiche attribue l’extrait, indique qu’il est abrégé et renvoie vers la version de l’article et sa licence.
