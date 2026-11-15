# QG · Carnets de culture générale

Des fiches en français d’environ 190 mots, consultables sur mobile et imprimables au format A5 depuis le navigateur.

## Publication

Dans **Settings → Pages → Build and deployment**, sélectionner **GitHub Actions** comme source. Le workflow **Carnets QG** publie le site à chaque modification de `main` et programme une nouvelle fiche à 8 h 17 (heure de Paris) chaque jour. GitHub peut décaler le démarrage. Consulter l’onglet **Actions** pour suivre la génération et le déploiement.

Pour publier à la demande, y compris depuis Safari sur iPhone, ouvrir **Actions → Carnets QG → Run workflow** sur `main`. Le champ facultatif accepte le titre exact d’un article de Wikipédia en français. Un lancement sans sujet utilise un article labellisé et conserve une seule publication automatique par jour. Un sujet saisi permet une fiche supplémentaire si l’article n’a jamais été publié.

## Travail local

Avec Node.js 24, sans installation de dépendances :

```sh
node scripts/qg.mjs
python3 -m http.server 8000
```

Ouvrir <http://localhost:8000>. Pour produire une fiche via Wikipédia, utiliser `node scripts/qg.mjs --daily` ou `node scripts/qg.mjs --subject 'La Nuit étoilée (Van Gogh)'`. Les données éditoriales sont dans `contenu/`. Le script génère `index.html` et les pages `fiches/*.html`.

La génération sélectionne des phrases entières de l’introduction de l’article, avec une longueur cible de 180 à 205 mots. Elle accepte des extraits d’au moins 135 mots pour s’arrêter sur une phrase complète. Chaque fiche attribue l’extrait, indique qu’il est abrégé et renvoie vers la version de l’article et sa licence.
