# Trivial Maison

Trivial Maison est une adaptation légère d'un jeu de plateau de culture générale. Tout fonctionne avec des standards Web
classiques (HTML, CSS, JavaScript) pour que l'application soit lisible aussi bien sur ordinateur que sur mobile – aucun
framework ou dépendance externe n'est nécessaire.

## Structure du projet

```
Trivial-Maison/
├── assets/                # Packs de questions (JSON) et ressources statiques
│   └── questions.json     # Exemple prêt à être enrichi
├── scripts/               # Scripts Node pour servir et préparer le projet
│   ├── build.mjs          # Copie les fichiers dans dist/
│   └── dev-server.mjs     # Petit serveur HTTP pour le développement
├── src/
│   ├── game/              # Règles du jeu et helpers de chargement des questions
│   │   ├── engine.js      # Transitions d'état (lancer de dé, score, manches…)
│   │   ├── questions.js   # Chargement + normalisation du JSON de questions
│   │   └── __tests__/     # Tests automatisés (Node test runner)
│   ├── main.js            # Point d'entrée de l'application et rendu DOM
│   └── styles.css         # Styles responsives pour écran tactile / souris
├── index.html             # Page principale (charge src/main.js)
├── package.json           # Scripts npm (sans dépendances externes)
└── README.md
```

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou version plus récente (npm est fourni avec Node)

Aucune étape `npm install` n'est requise : toutes les dépendances sont natives.

## Lancer le serveur de développement

```bash
npm run dev
```

Le serveur ouvre par défaut [http://localhost:5173](http://localhost:5173). Ouvrez l'adresse dans votre navigateur
(ordinateur, tablette ou téléphone). La mise en page s'adapte automatiquement aux écrans tactiles ou à la souris.

## Construire une version statique

```bash
npm run build
```

Le dossier `dist/` contiendra `index.html`, `assets/` et `src/`. Copiez ce répertoire sur n'importe quel hébergeur de
fichiers statiques pour servir le jeu tel quel.

## Lancer les tests

```bash
npm test
```

La suite utilise le runner intégré de Node (`node --test`) pour vérifier le tirage des questions, la rotation des joueurs et
le calcul des scores/secteurs.

## Jouer

1. Ajoutez de 2 à 6 joueurs depuis l'écran d'accueil et cliquez sur « Lancer la partie ».
2. Au début de chaque tour, utilisez « Lancer le dé » pour déplacer le pion actif et piocher une question.
3. Répondez en appuyant sur la bonne option. Sur une case « camembert », une bonne réponse ajoute le secteur à votre collection.
4. Passez au joueur suivant via « Tour suivant » après la phase de feedback.
5. Le premier joueur qui collecte tous les secteurs gagne; démarrez immédiatement un nouveau tour avec « Recommencer ».

## Ajouter ou modifier des questions

- Les données sont centralisées dans [`assets/questions.json`](assets/questions.json).
- Chaque catégorie contient un identifiant (`id`), un nom (`name`), une couleur (`color`) et une liste de questions.
- Une question possède : `id`, `prompt`, `options` (tableau de réponses) et `answerIndex` (index de la bonne réponse, base 0).

Pour enrichir le jeu :

1. Dupliquez un bloc de catégorie ou ajoutez de nouvelles entrées dans `questions`.
2. Vérifiez que `answerIndex` correspond toujours à la bonne option.
3. Sauvegardez puis rechargez la page (ou redémarrez le serveur) pour que les nouvelles cartes soient prises en compte.

## Personnaliser

- Les règles de progression et de score se trouvent dans [`src/game/engine.js`](src/game/engine.js).
- Le plateau et la normalisation des questions sont décrits dans [`src/game/questions.js`](src/game/questions.js).
- Ajustez le rendu ou les styles responsives dans [`src/main.js`](src/main.js) et [`src/styles.css`](src/styles.css).

Amusez-vous bien lors de vos soirées quiz !
