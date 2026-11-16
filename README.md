# QG · Carnets de culture générale

Les [Carnets QG](https://vachetvirginie.github.io/qg/) publient des fiches en français calibrées pour la recopie. Le corps de chaque fiche contient de 185 à 200 mots, référence comprise. Les libellés de sections, le titre et la légende du croquis ne sont pas comptés.

## Proposer des sujets

Ouvre [la liste personnelle sur GitHub](https://github.com/VachetVirginie/qg/edit/main/sujets.txt). Ajoute un sujet par ligne, éventuellement précédé d’un domaine, par exemple `Mythologie | Supplice de Tantale` ou `Droit | La séparation des pouvoirs`. Les puces et lignes numérotées sont acceptées. Enregistre sur `main` via **Commit changes**.

Le tirage quotidien à 8 h, heure de Paris, favorise les sources les moins représentées dans les dix dernières fiches. La liste personnelle et la culture générale ont le même poids. Un événement récent, documenté et pertinent peut entrer dans le tirage avec un poids inférieur. Le tirage exclut les sujets déjà couverts par titre, alias et identifiants Wikipédia ou Wikidata et refuse deux mythes ou légendes successifs. Les sujets restent dans la liste pour conserver les propositions.

## Publication quotidienne

GitHub Pages déploie depuis **Actions → Carnets QG**. Le champ `subject` permet de publier à la demande. Un lancement sans champ applique le tirage du jour et ignore une date déjà publiée.

La rédaction et la recherche d’actualité automatiques s’activent avec le secret GitHub Actions `OPENAI_API_KEY` dans **Settings → Secrets and variables → Actions**. La clé reste côté GitHub Actions. La variable facultative `OPENAI_MODEL` permet de choisir un modèle compatible avec Responses API, recherche web et sorties structurées. Par défaut le workflow utilise `gpt-5.4-mini`. Les sujets, l’historique des titres et les sources nécessaires à la rédaction sont transmis à l’API, dont l’utilisation est facturée sur le compte associé à la clé.

Sans clé, le tirage publie les fiches déjà rédigées et calibrées dans `data/fiches-pretes.json`, parmi les sujets des deux listes. Lorsque la réserve ne contient plus de fiche éligible, le workflow signale l’épuisement. Pour enrichir la réserve, ajouter une fiche validée et son titre ou un alias à la liste correspondante. Les fiches publiées sont conservées dans `contenu/`.

## Lecture et impression

Chaque fiche affiche deux phrases d’accroche, trois points clés, une anecdote, un croquis et une référence. Les boutons permettent de choisir le thème sombre, d’afficher les points tous les 5 mm et d’ouvrir le dialogue natif d’impression au format A5 portrait. Choisis **Enregistrer en PDF** dans le navigateur. Sur iPhone, utilise le partage de l’aperçu pour enregistrer le document dans Fichiers.

Sur une fiche, **Exporter pour Instagram** ouvre un aperçu des trois images verticales de 1080 × 1350 pixels : couverture et accroche, trois points clés, puis anecdote et référence. Les PNG sont téléchargeables à l’unité ou ensemble dans une archive ZIP. Sur les appareils qui prennent en charge le partage natif de fichiers, les trois images peuvent aussi être envoyées ensemble au menu de partage.

## Travail local

Avec Node.js 24 et pnpm 10 :

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
python3 -m http.server 8000
```

Ouvre <http://localhost:8000>. La commande `node scripts/qg.mjs --daily` effectue le tirage si la date n’est pas déjà représentée. `node scripts/qg.mjs --subject 'Montjuïc à Barcelone'` demande un sujet précis. Les liens numérotés d’origine restent valides.
