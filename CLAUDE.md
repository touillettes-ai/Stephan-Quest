# Bonne retraite ! — jeu de plateforme 2D (cadeau de départ à la retraite)

## But du projet
Jeu de plateforme 2D en HTML5 Canvas offert à un collègue qui part à la retraite.
Il raconte ses **15 derniers jours au bureau** : chaque mission = un niveau, entre deux
niveaux des **cinématiques jouées avec le moteur du jeu** (mêmes décors, mêmes personnages).
Le joueur incarne le collègue qui part (`CHARS.hero`).

Ambiances : open space (bureau), train (voyages), restaurant japonais, Charlie's (entrecôtes),
restaurant gastro, bar (fête de départ). Les décors sont réutilisables d'un niveau à l'autre.

Contraintes voulues : **simple**, jouable en double-clic hors ligne (un seul .html),
**aucune image/son externe** (tout est dessiné/synthétisé en code), personnages créés par simple configuration.

## Préférences de l'utilisateur
- Répondre en **français**.
- Il est incident manager (Enedis), ex-développeur web/iOS 10 ans : on peut parler technique.
- Après chaque tâche, **récapituler succinctement** ce qui a été fait.
- Il aime qu'on **propose des idées** sans attendre.
- Les objectifs de chaque niveau sont définis **au moment de les créer**, avec lui.

## Commandes
```
node build.js        # assemble index.html + js/*.js -> dist/bonne-retraite.html (fichier unique à livrer)
node test/run.js     # tests sans navigateur (voir plus bas) — À LANCER après toute modif
```
Pour développer : ouvrir `index.html` (charge js/*.js) ; pour livrer : `dist/bonne-retraite.html`.
Captures d'écran (si Chrome dispo) : `test/shot.html` rend UNE image d'une scène, ex.
`google-chrome --headless=new --no-sandbox --window-size=960,544 --virtual-time-budget=3000 --screenshot=x.png "file:///.../test/shot.html#level/logigramme/700"`
Formes du hash : `#title`, `#select/2`, `#credits`, `#level/NOM/xPixels`, `#cut/NOM/secondes`.

## Architecture (ordre de chargement = ordre de concaténation dans build.js)
| Fichier | Rôle |
|---|---|
| `js/util.js` | Constantes (`W=960, H=544, TILE=32, FLOOR_Y=480`), `Input` (clavier/tactile), `Sfx` (sons WebAudio synthétisés) |
| `js/draw.js` | Tout le dessin : `drawCharacter`, `drawPortrait`, `drawItem`, `drawHazard`, `drawProp`, `drawTile`, décors `BG.*`, `THEMES` |
| `js/engine.js` | `Game` (scène + fondus), `LevelScene` (plateforme), `CutScene` (cinématiques), `TitleScene`, `ChapterSelect`, `ChapterCard`, `CreditsScene`, `runStep` (enchaînement de l'histoire) |
| `js/content.js` | **Tout le contenu propre à l'histoire** : `CONFIG`, `CHARS`, `LEVELS`, `CUTS`, `STORY`. C'est le fichier à modifier 90 % du temps |
| `js/main.js` | Démarrage + boutons tactiles |
| `test/run.js`, `test/shot.html` | Tests automatiques / captures |

Pas de dépendances, pas de bundler. Les fichiers sont en `'use strict'` et partagent le scope global (concaténés).

## Contenu actuel (content.js)
`STORY` = tableau de chapitres `{day, title, steps:[cinématique | niveau, ...]}` :
J-15 En route vers le GTAR (train, Stephan seul, valise ouverte : slips/tee-shirts/pantalons) · J-14 Le logigramme (open space, 13 morceaux, le Chef = perso `chef` grand et chauve, Coline/Bastien/Olivier en cinématique) · J-9 Déjeuner japonais (vote Hoki Sushi / Charlie's / Cantine) · J-7 La crise (open space piraté, cyber à trouver, salle Mozart) · J-5 Charlie's · J-4 Dernier PI (carottes, chocolats, Matthieu-lapin qui fuit) · J-3 Le backlog (carte mère, Bastien suit Stephan, puis arène « coup de balai » contre les tickets HDR de Franck) · J-0 La fête de départ (collègues qui disent des gentillesses, Matthieu cowboy sur cheval gonflable à rattraper, porte, toast, puis jeu de danse DDR de 45 s sur « Dancing Queen »). Le dîner gastronomique a été supprimé.
⚠️ **Noms, dialogues et objectifs sont des PLACEHOLDERS** (héros = Stephan ; les alias sophie/karim/nadia/julien pointent vers de vrais collègues, tous les persos de l'équipe sont dans CHARS). À remplacer par les vrais (demander à l'utilisateur).

## Créer un niveau
Dans `LEVELS`, un objet :
```js
LEVELS.monNiveau = {
  type:'level', theme:'bar',            // theme = clé de BG et THEMES (décor + couleurs du sol)
  title:'…', objective:'…', exitLabel:'PISTE DE DANSE',
  items:['biere','cadeau'],             // item n°1, n°2… (chiffres 1..9 dans la carte)
  hazards:['chair','mail'],             // [0]=marcheur ('e'/'E'), un volant 'f' pris dans la liste (fly:true)
  map: buildMap(100, m => { m.ground(0,99); m.pit(52,54); m.set(2,14,'S'); … }),
};
```
Légende de la carte (17 lignes exactement) : `#` bloc · `=` plateforme traversable par le bas · `S` départ · `X` sortie ·
`C` café/checkpoint · `^` ressort · `1`–`9` objets (tous obligatoires, sauf `need:{1:3}`) · `e`/`E` ennemi marcheur · `f` ennemi volant.
`buildMap` : `ground(x1,x2)`, `pit(x1,x2)`, `pl(x1,x2,ligne)`, `bl(x1,x2,l1,l2)`, `set(x,ligne,car)`, `items(chiffre,[[x,ligne],…])`.

**Règles de géométrie (à respecter, sinon niveau infaisable)** :
- Sol = lignes 15-16 ; le joueur marche sur la **ligne 14** (pieds à y=480).
- Saut max ≈ **3 cases** en hauteur (113 px) et ≈ 4 cases en longueur. Hauteur d'une plateforme à la ligne p au-dessus du sol = `(15-p)*32` px → ligne 12 = 3 cases (OK), ligne 11 = 4 cases (**trop haut** sans marche intermédiaire).
- Un objet à la ligne `p-1` ou `p-2` au-dessus d'une plateforme de ligne p se ramasse en marchant dessus.
- Fossé max conseillé : 3 cases. Ne pas poser un ennemi volant sur la case d'un objet.
- Les ennemis marcheurs « retombent » sur le premier sol sous leur case de départ.

Physique (`PHYS` dans engine.js) : vitesse 230, saut 640, gravité 1800, ressort 960. Pas de game over : chute/ennemi → retour au dernier café, compteur « Chutes » affiché en fin de niveau.
Écraser un ennemi par-dessus = il disparaît ; contact latéral = aïe.

**Dialogues pendant un niveau** : un objet peut déclencher une scène. Dans le niveau : `items:['papier','npc:lionel',…]` (`npc:clé` = un personnage de `CHARS` à trouver, posé sur une plateforme à la ligne p-1 ou sur le sol ligne 14) et
`talks:{ 3:[['hero','texte'],['lionel','texte'],[null,'narration']] }` (clé = numéro de l'objet, la scène se joue au ramassage).

**Poursuite** : `chase:{key,k,trigger,path:[[tx,ligneDeSol],…]}` + un `M` dans la carte = un perso qui bondit de plateforme en plateforme quand on s'approche ; une fois touché il suit le héros (voir `LEVELS.pi`). `follower:'clé'` = un compagnon qui suit le héros.
**Arènes** (`ARENAS`, `type:'broom'`, classe `BroomScene`) : tickets lancés à balayer (Entrée/E), 4 touches = on recommence. Test visuel : `test/shot.html#broom/balai/9`.

**Jeu de danse** (`ARENAS.danse`, `type:'dance'`, classe `DanceScene`) : flèches ←↓↑→ (ou QZSD) synchronisées avec `MUSIC.dancing` (js/music.js, **généré** depuis un fichier MIDI par un script : extrait de 45 s, notes jouées par un petit synthé WebAudio, flèches = notes de la mélodie). Réglages dans `DANCE` (engine.js) : 1 point par flèche, +10 toutes les 10 flèches réussies. Test visuel : `test/shot.html#dance/danse/14`.

## Créer une cinématique
Dans `CUTS`, un script générateur ; `c` = API :
```js
CUTS.x = { type:'cutscene', bg:'japonais', worldW:960 /* optionnel */, script:function*(c){
  c.add('hero', CHARS.hero, 100, {face:1, state:'idle'});
  yield c.walk('hero', 400, 120);
  yield c.say('hero', 'Texte…');       // Entrée/Espace pour avancer ; say(null,'…') = narration
  yield [c.walk('a',300), c.walk('b',500)];   // parallèle
}};
```
API : `add, remove, walk, face, pose(idle|walk|wave|cheer|sit|hurt|jump), teleport, emote(clé,'!',secondes), jump, change, say, narrate, caption(texte,s), card(gros,petit,s), cam(x,s), follow(clé), fade(0|1,s), shake(s), sfx(nom), confetti(n), rain(n), bg(nom), prop(kind,x,y,opts), unprop, wait(s)`.
Props : `desk, chair, dchair, table{color,check,plates,candle}, whiteboard{pieces}, banner{text,w}, cake, stool, counter, door, seat`, ou n'importe quel item (`maki`, `sushi`…).
Les helpers `seat()` (bureau) et `diner()` (restaurant) dans content.js posent un personnage assis.
La boîte de dialogue est **en haut** de l'écran pour ne pas cacher les personnages (qui sont au sol, y=480). Échap passe la cinématique.

## Personnages
`{ name, skin, hair, hairStyle, top, bottom, shoe, tie, vest, collar, glasses, glassColor, mustache, beard, cap, scale }`
hairStyle : `short | bald | long | bun | curly | cap | helmet` (helmet = casque de chantier jaune).
**Couleurs en hexadécimal à 6 chiffres** (`shade()` ne gère pas `#fff`).
Personnage de profil uniquement (regarde à droite, miroir via `facing`).

## Ajouter un élément
- **Nouvel environnement** : ajouter `BG.nom = (ctx, camX, t) => {…}` (utiliser `par(cx, facteurParallaxe, période, fn)`) + une entrée dans `THEMES` (+ motif de sol dans `drawTile`). Sol de référence à y=480.
- **Nouvel objet** : un `case` dans `drawItem` + le nom dans `ITEM_KINDS`.
- **Nouvel ennemi** : une entrée dans `HAZARDS` (w, h, speed, fly) + un `case` dans `drawHazard`.
- **Nouveau chapitre** : une entrée dans `STORY`.
- Les skills `add-enemy`, `add-weapon`, `add-implant` du compte concernent un AUTRE jeu (NEON ASCENT) : ne pas les utiliser ici.

## Tests (`node test/run.js`)
1. Chaque niveau : 17 lignes, départ/sortie/objets/ennemis présents, **accessibilité par BFS** (sauts ≤3 haut, ≤4 large) de tous les objets, cafés et de la sortie, bot qui court 25 s sans exception, ramassage total + fin de niveau.
2. Chaque cinématique se termine sans exception (Entrée auto).
3. Parcours complet de l'histoire via `Game` jusqu'au générique.
4. Tous les décors/personnages/objets/ennemis/props se dessinent (contexte canvas simulé).
Ces tests ne jugent PAS le rendu : utiliser `test/shot.html` + Chrome pour le vérifier visuellement.
Les tests ne remplacent pas un essai à la main : la difficulté est à régler en jouant.

## Pièges connus
- Touches par position physique (`KeyA`/`KeyD`/`KeyW` = ZQSD sur AZERTY).
- Les émotions (`c.emote`) s'éteignent seules (pas besoin de `yield`).
- Un fichier modifié dans `js/` n'apparaît dans `dist/` qu'après `node build.js`.
- Écran logique fixe 960×544, mis à l'échelle en CSS.

## Pistes d'évolution (idées proposées à l'utilisateur, non faites)
Musique chiptune par ambiance · boss de fin de niveau (le Chef et ses dossiers) · objets secrets/souvenirs par niveau · livre d'or final (message de chaque collègue) · personnalisation fidèle des vrais visages (cheveux, lunettes, tenues signature) · gags récurrents tirés d'anecdotes réelles · agrandir les personnages si projection sur grand écran.
