'use strict';
/* ============================================================
   content.js : TOUT ce qui est propre à votre histoire
   ✏️  Les noms, dialogues et objectifs ci-dessous sont des PLACEHOLDERS
       à remplacer. Le moteur (engine.js / draw.js) n'a pas à être modifié.
   ============================================================ */

const CONFIG = {
  title: 'BONNE RETRAITE',                      // ✏️
  subtitle: 'Les 15 derniers jours de Michel',  // ✏️
  hero: 'Michel',                               // ✏️ prénom du collègue qui part
  banner: 'BONNE RETRAITE MICHEL !',            // ✏️ banderole du bar
  credits: [                                    // ✏️ (une ligne commençant par ★ s'affiche en gros)
    '★ BONNE RETRAITE ★', '', 'Un jeu offert avec plein d\'amour', 'par toute l\'équipe', '',
    'Avec :', 'Michel dans son propre rôle', 'Sophie, Karim, Nadia', 'et le Chef (qui a fini par sourire)', '',
    'Aucune chaise de bureau n\'a été blessée', 'pendant le tournage.', '', '★ MERCI POUR TOUT ★',
  ],
};

/* ---------- Personnages ----------
   hairStyle : short | bald | long | bun | curly | cap | helmet
   options   : glasses, mustache, beard, tie, vest, scale                */
const CHARS = {
  hero:   { name: CONFIG.hero, skin: '#f0c8a0', hair: '#aeb4ba', hairStyle: 'short', top: '#2f6db5', bottom: '#2c3440', glasses: true, mustache: true },
  chef:   { name: 'Le Chef', skin: '#e3b088', hair: '#555555', hairStyle: 'bald', top: '#1f2a44', bottom: '#1f2a44', tie: '#b3261e', glasses: true, glassColor: '#555555' },
  sophie: { name: 'Sophie', skin: '#f2c9a5', hair: '#6b3a22', hairStyle: 'long', top: '#e8843c', bottom: '#3a3a52' },
  karim:  { name: 'Karim', skin: '#c68e63', hair: '#1c1410', hairStyle: 'curly', top: '#3d9a5b', bottom: '#2c3440', beard: true },
  nadia:  { name: 'Nadia', skin: '#d9a77e', hair: '#2a1a14', hairStyle: 'bun', top: '#8a5bd0', bottom: '#2c3440', glasses: true, glassColor: '#c0392b' },
  julien: { name: 'Julien', skin: '#f2cfae', hair: '#d9b45a', hairStyle: 'cap', cap: '#2f7fd1', top: '#d6d6d6', bottom: '#3a4660' },
};

/* ---------- Outils pour construire un niveau ----------
   Le niveau fait 17 lignes de haut : le sol est aux lignes 15-16,
   le joueur marche donc sur la ligne 14. Un saut atteint ~3 cases en hauteur.
   Légende de la carte :  #=bloc  ==plateforme  S=départ  X=sortie  C=café(checkpoint)
   ^=ressort  1..9=objets  e/E=ennemi qui marche  f=ennemi volant                 */
function buildMap(cols, fn) {
  const R = 17, g = Array.from({ length: R }, () => Array(cols).fill('.'));
  const api = {
    set(x, y, ch) { if (x >= 0 && x < cols && y >= 0 && y < R) g[y][x] = ch; },
    ground(x1, x2) { for (let x = x1; x <= x2; x++) { g[15][x] = '#'; g[16][x] = '#'; } },
    pit(x1, x2) { for (let x = x1; x <= x2; x++) { g[15][x] = '.'; g[16][x] = '.'; } },
    pl(x1, x2, y) { for (let x = x1; x <= x2; x++) g[y][x] = '='; },
    bl(x1, x2, y1, y2) { for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) g[y][x] = '#'; },
    items(ch, list) { for (const [x, y] of list) g[y][x] = ch; },
  };
  fn(api);
  return g.map(r => r.join(''));
}

/* ============================================================
   NIVEAUX
   ============================================================ */
const LEVELS = {};

LEVELS.logigramme = {
  type: 'level', theme: 'openspace', title: 'Le logigramme',
  objective: 'Récupère tous les morceaux du logigramme et file au bureau du Chef !',
  exitLabel: 'BUREAU DU CHEF',
  items: ['logi'], hazards: ['chair', 'mail'],
  map: buildMap(110, m => {
    m.ground(0, 109); m.pit(36, 38); m.pit(70, 72);
    m.set(2, 14, 'S'); m.set(106, 14, 'X'); m.set(62, 14, 'C');
    m.set(14, 14, 'e'); m.set(27, 14, 'e'); m.set(48, 14, 'e'); m.set(88, 14, 'e'); m.set(95, 14, 'e');
    m.set(54, 8, 'f'); m.set(100, 8, 'f'); m.set(31, 9, 'f');
    m.pl(16, 19, 13); m.pl(21, 24, 11); m.pl(26, 29, 13);
    m.pl(44, 47, 12); m.pl(50, 53, 10); m.pl(56, 59, 12);
    m.pl(76, 78, 13); m.pl(80, 82, 11); m.pl(84, 86, 13); m.pl(98, 102, 12);
    m.set(78, 14, '^');
    m.items('1', [[22, 10], [37, 11], [51, 9], [81, 10], [92, 13], [100, 11]]);
  }),
};

LEVELS.train = {
  type: 'level', theme: 'train', title: 'Le train de 8h12',
  objective: 'Une rafale a emporté les billets de toute l\'équipe : retrouve-les avant le terminus !',
  exitLabel: 'WAGON-BAR',
  items: ['ticket'], hazards: ['valise', 'mail'],
  map: buildMap(100, m => {
    m.ground(0, 99); m.pit(32, 33); m.pit(66, 67);
    m.set(2, 14, 'S'); m.set(96, 14, 'X'); m.set(37, 14, 'C');
    m.set(12, 14, 'e'); m.set(24, 14, 'e'); m.set(42, 14, 'e'); m.set(54, 14, 'e'); m.set(80, 14, 'e'); m.set(92, 14, 'e');
    m.set(58, 9, 'f'); m.set(20, 9, 'f');
    m.pl(8, 10, 13); m.pl(14, 18, 12); m.pl(22, 25, 13);
    m.pl(38, 41, 13); m.pl(44, 47, 11); m.pl(50, 53, 12);
    m.set(72, 14, '^'); m.pl(76, 79, 12); m.pl(82, 85, 10); m.pl(88, 91, 12);
    m.items('1', [[16, 11], [23, 12], [45, 10], [51, 11], [83, 9], [90, 11]]);
  }),
};

LEVELS.japonais = {
  type: 'level', theme: 'japonais', title: 'Les commandes du déjeuner',
  objective: 'Attrape makis, sushis et brochettes pour compléter le menu de chacun !',
  exitLabel: 'NOTRE TABLE',
  items: ['maki', 'sushi', 'brochette'], hazards: ['waiter'],
  map: buildMap(100, m => {
    m.ground(0, 99);
    m.set(2, 14, 'S'); m.set(96, 14, 'X'); m.set(28, 14, 'C');
    m.set(14, 14, 'e'); m.set(34, 14, 'e'); m.set(58, 14, 'e'); m.set(82, 14, 'e');
    m.pl(6, 9, 13); m.pl(12, 15, 12); m.pl(18, 21, 13); m.pl(23, 26, 12);
    m.pl(32, 35, 13); m.pl(38, 41, 11); m.pl(44, 47, 13);
    m.pl(52, 55, 13); m.pl(57, 60, 11); m.pl(62, 65, 9);
    m.pl(70, 72, 13); m.pl(73, 75, 11); m.pl(76, 80, 9); m.pl(84, 87, 12);
    m.items('1', [[7, 12], [33, 12], [63, 8]]);
    m.items('2', [[13, 11], [39, 10], [85, 11]]);
    m.items('3', [[24, 11], [45, 12], [78, 8]]);
  }),
};

LEVELS.charlies = {
  type: 'level', theme: 'charlies', title: 'L\'entrecôte du départ',
  objective: 'Récupère les entrecôtes et les frites pour la table du dernier jour !',
  exitLabel: 'TABLE 12',
  items: ['entrecote', 'frites'], hazards: ['waiter'],
  map: buildMap(92, m => {
    m.ground(0, 91);
    m.set(2, 14, 'S'); m.set(88, 14, 'X'); m.set(36, 14, 'C');
    m.set(10, 14, 'e'); m.set(22, 14, 'e'); m.set(48, 14, 'e'); m.set(74, 14, 'e');
    m.pl(5, 8, 13); m.pl(11, 14, 12); m.pl(17, 20, 13);
    m.bl(26, 28, 13, 14); m.bl(29, 31, 12, 14);
    m.pl(38, 41, 13); m.pl(44, 47, 11); m.pl(50, 53, 13);
    m.bl(58, 60, 13, 14); m.pl(62, 65, 12); m.pl(67, 70, 10);
    m.items('1', [[6, 12], [18, 12], [27, 12], [45, 10], [68, 9]]);
    m.items('2', [[12, 11], [30, 11], [39, 12], [63, 11], [80, 13]]);
  }),
};

LEVELS.gastro = {
  type: 'level', theme: 'gastro', title: 'Le grand menu',
  objective: 'Réunis les plats du chef avant que le service ne se termine !',
  exitLabel: 'SALON PRIVÉ',
  items: ['plat'], hazards: ['waiter', 'mail'],
  map: buildMap(96, m => {
    m.ground(0, 95); m.pit(40, 42);
    m.set(2, 14, 'S'); m.set(92, 14, 'X'); m.set(30, 14, 'C');
    m.set(12, 14, 'e'); m.set(24, 14, 'e'); m.set(60, 14, 'e'); m.set(80, 14, 'e');
    m.set(56, 8, 'f'); m.set(76, 6, 'f');
    m.pl(8, 11, 13); m.pl(14, 17, 11); m.pl(20, 23, 13);
    m.pl(36, 39, 12); m.pl(43, 46, 12); m.pl(48, 52, 10);
    m.pl(56, 59, 13); m.pl(62, 65, 11); m.pl(67, 71, 9); m.pl(74, 77, 11); m.pl(82, 86, 13);
    m.items('1', [[9, 12], [15, 10], [37, 11], [50, 9], [69, 8], [84, 12]]);
  }),
};

LEVELS.bar = {
  type: 'level', theme: 'bar', title: 'La fête de départ',
  objective: 'Ramène les bières et les cadeaux jusqu\'à la piste de danse !',
  exitLabel: 'PISTE DE DANSE',
  items: ['biere', 'cadeau'], hazards: ['chair', 'mail'],
  map: buildMap(100, m => {
    m.ground(0, 99); m.pit(52, 54);
    m.set(2, 14, 'S'); m.set(96, 14, 'X'); m.set(30, 14, 'C');
    m.set(12, 14, 'e'); m.set(24, 14, 'e'); m.set(44, 14, 'e'); m.set(68, 14, 'e'); m.set(84, 14, 'e');
    m.set(36, 8, 'f'); m.set(78, 8, 'f');
    m.set(8, 14, '^');
    m.pl(14, 17, 13); m.pl(19, 22, 11); m.pl(24, 27, 13);
    m.pl(34, 37, 12); m.pl(39, 42, 10); m.pl(46, 49, 12);
    m.pl(56, 59, 13); m.pl(61, 64, 11); m.pl(66, 69, 9); m.pl(72, 75, 11); m.pl(78, 82, 13); m.pl(86, 90, 12);
    m.items('1', [[15, 12], [35, 11], [47, 11], [62, 10], [88, 11]]);
    m.items('2', [[20, 10], [67, 8], [80, 12]]);
  }),
};

/* ============================================================
   CINÉMATIQUES
   Commandes disponibles dans un script (c = l'API) :
     c.add(clé, perso, x, {face, state, y})   ajoute un personnage
     yield c.walk(clé, x, vitesse)            le fait marcher
     yield c.say(clé, 'texte')                dialogue (Entrée pour passer)
     yield c.narrate('texte')                 narration sans portrait
     yield c.caption('texte', secondes)       bandeau en haut
     yield c.card('J-15', 'Titre', secondes)  carton plein écran
     yield c.wait(s) / c.cam(x, s) / c.fade(0|1, s) / c.jump(clé)
     c.pose(clé, 'wave'|'cheer'|'sit'|'idle')   c.face(clé, 1|-1|autreClé)
     c.emote(clé, '!')   c.prop('desk'|'table'|'whiteboard'|'cake'|…, x, y, {options})
     c.confetti(n)   c.shake(s)   c.follow(clé)   c.sfx('coin')
     yield [c.walk('a', 300), c.walk('b', 500)]   → actions en parallèle
   ============================================================ */
function seat(c, key, ch, x, face, withDesk) {
  c.prop('chair', x - face * 4, FLOOR_Y, { z: -1 });
  const a = c.add(key, ch, x, { face, state: 'sit', z: 1 });
  if (withDesk) c.prop('desk', x + face * 36, FLOOR_Y, { front: true });
  return a;
}
function diner(c, key, ch, x, face) {
  c.prop('dchair', x - face * 12, FLOOR_Y);
  return c.add(key, ch, x, { face, state: 'sit', z: 1 });
}

const CUTS = {};

CUTS.j15_intro = {
  type: 'cutscene', bg: 'openspace',
  script: function* (c) {
    seat(c, 'sophie', CHARS.sophie, 250, 1, true);
    seat(c, 'karim', CHARS.karim, 560, 1, true);
    c.add('hero', CHARS.hero, -60, { state: 'walk' });
    yield c.caption('Lundi, 8h42. Open space.', 2.4);
    yield c.walk('hero', 130, 120);
    c.pose('hero', 'wave');
    yield c.say('hero', 'Bonjour tout le monde ! Dernière ligne droite, plus que quelques jours…');
    c.pose('hero', 'idle');
    yield c.say('sophie', 'Quelques jours ? ' + CONFIG.hero + ', il t\'en reste exactement quinze.');
    c.add('chef', CHARS.chef, 1020, { face: -1, state: 'walk' });
    yield c.walk('chef', 700, 110);
    c.face('hero', 1);
    yield c.say('chef', 'Justement. Avant de partir, j\'ai besoin du logigramme de la procédure. Complet.');
    yield c.say('hero', 'Le logigramme ? Il est éparpillé aux quatre coins de l\'open space…');
    c.emote('karim', '!', 1.2);
    yield c.say('karim', 'Attention aux chaises de bureau. Elles ont pris la confiance.');
    yield c.say('chef', 'Et aux mails urgents. Bonne chance.');
    yield c.say(null, 'Mission du jour : retrouver tous les morceaux du logigramme.');
  },
};

CUTS.j15_outro = {
  type: 'cutscene', bg: 'openspace',
  script: function* (c) {
    c.add('hero', CHARS.hero, 300, { state: 'idle' });
    c.add('chef', CHARS.chef, 640, { face: -1 });
    const wb = c.prop('whiteboard', 530, 230, { pieces: 0 });
    yield c.say('hero', 'Voilà, Chef. Mon chef-d\'œuvre. Un logigramme complet, en un seul morceau.');
    for (let i = 1; i <= 6; i++) { wb.pieces = i; c.sfx('coin'); yield c.wait(0.45); }
    yield c.wait(0.6);
    c.emote('chef', '…', 1.5);
    yield c.say('chef', 'C\'est… correct. Je dirais même : irréprochable.');
    c.pose('hero', 'cheer'); c.sfx('win');
    yield c.say('hero', 'Il vient de me complimenter. Notez la date, c\'est historique.');
    c.pose('hero', 'idle');
  },
};

CUTS.j12_train = {
  type: 'cutscene', bg: 'train',
  script: function* (c) {
    yield c.caption('Jeudi. En route pour le déplacement.', 2.4);
    c.prop('table', 480, FLOOR_Y, { color: '#e8edf5', plates: [-26, 26], front: true });
    c.prop('seat', 374, FLOOR_Y); c.prop('seat', 586, FLOOR_Y);
    c.add('hero', CHARS.hero, 380, { state: 'sit', z: 1 });
    c.add('karim', CHARS.karim, 580, { face: -1, state: 'sit', z: 1 });
    yield c.say('karim', 'Dis donc ' + CONFIG.hero + ', ça fait combien de trajets en train, ta carrière ?');
    yield c.say('hero', 'Assez pour connaître chaque retard par cœur. Et chaque annonce aussi.');
    yield c.say('karim', 'T\'as bien tous les billets de l\'équipe ?');
    c.emote('hero', '?', 1.2);
    yield c.say('hero', 'Bien sûr, ils sont là, dans mon… ');
    c.shake(0.8); c.sfx('hurt');
    c.prop('ticket', 600, 330, { scale: 1.6 });
    yield c.wait(0.9);
    c.emote('hero', '!', 1.6); c.pose('hero', 'hurt');
    yield c.say('hero', 'La fenêtre ! Les billets se sont envolés dans tous les wagons !');
    c.pose('hero', 'idle');
    yield c.say('karim', 'Cours ! Moi, je garde les places.');
  },
};

CUTS.j9_japonais = {
  type: 'cutscene', bg: 'japonais',
  script: function* (c) {
    yield c.caption('Midi. Restaurant japonais.', 2.4);
    c.prop('table', 480, FLOOR_Y, { color: '#7a4a2a', plates: [-30, 0, 30], front: true });
    diner(c, 'sophie', CHARS.sophie, 380, 1); diner(c, 'hero', CHARS.hero, 330, 1);
    diner(c, 'nadia', CHARS.nadia, 580, -1); diner(c, 'karim', CHARS.karim, 630, -1);
    yield c.say('nadia', 'Alors, tout le monde a choisi ? Moi, ce sera trois makis et des brochettes.');
    yield c.say('karim', 'Moi : sushis. Beaucoup de sushis. Et je ne partage pas.');
    yield c.say('sophie', CONFIG.hero + ', tu prends quoi pour ton avant-dernier déjeuner avec nous ?');
    c.emote('hero', '♥', 1.5);
    yield c.say('hero', 'Un peu de tout. Aujourd\'hui, c\'est moi qui régale !');
    yield c.say(null, 'Mais le tapis roulant déborde… Il faut aller chercher les plats soi-même.');
  },
};

CUTS.j9_outro = {
  type: 'cutscene', bg: 'japonais',
  script: function* (c) {
    c.prop('table', 480, FLOOR_Y, { color: '#7a4a2a', plates: [-30, 0, 30], front: true });
    c.prop('maki', 450, FLOOR_Y - 46, { lift: 0 }); c.prop('sushi', 510, FLOOR_Y - 46, { lift: 0 });
    diner(c, 'sophie', CHARS.sophie, 380, 1); diner(c, 'hero', CHARS.hero, 330, 1);
    diner(c, 'nadia', CHARS.nadia, 580, -1); diner(c, 'karim', CHARS.karim, 630, -1);
    yield c.say('karim', 'Ces sushis sont… (mâche) …légendaires.');
    c.pose('nadia', 'cheer');
    yield c.say('nadia', 'Un toast ! À ' + CONFIG.hero + ' et à son appétit !');
    yield c.say('hero', 'À la vôtre. Et gardez-moi la dernière brochette.');
  },
};

CUTS.j5_charlies = {
  type: 'cutscene', bg: 'charlies',
  script: function* (c) {
    yield c.caption('Vendredi soir. Charlie\'s, le temple de l\'entrecôte.', 2.8);
    c.prop('table', 480, FLOOR_Y, { color: '#f4efe3', check: '#c5362d', plates: [-30, 30], front: true });
    diner(c, 'hero', CHARS.hero, 380, 1); diner(c, 'julien', CHARS.julien, 580, -1);
    yield c.say('julien', 'Une entrecôte, saignante, frites à volonté. Tu connais la maison.');
    yield c.say('hero', 'Depuis tant d\'années… C\'est ici que j\'ai fêté tous mes projets.');
    c.emote('julien', '!', 1.2);
    yield c.say('julien', 'Les serveurs courent partout ce soir. Il faut aller chercher ses assiettes soi-même.');
    yield c.say('hero', 'Alors allons-y. Une entrecôte, ça se mérite.');
  },
};

CUTS.j2_gastro = {
  type: 'cutscene', bg: 'gastro',
  script: function* (c) {
    yield c.caption('Mardi. Le restaurant gastronomique.', 2.6);
    c.prop('table', 480, FLOOR_Y, { color: '#f7f4ec', candle: true, plates: [-34, 34], front: true });
    diner(c, 'chef', CHARS.chef, 380, 1); diner(c, 'hero', CHARS.hero, 580, -1);
    yield c.say('chef', 'Le dîner est pour moi. Ce n\'est pas tous les jours qu\'on voit partir un collègue comme toi.');
    c.emote('hero', '♥', 1.6);
    yield c.say('hero', 'Chef… vous êtes en train de vous attendrir ?');
    yield c.say('chef', 'Jamais. Mange avant que ça refroidisse.');
    yield c.say(null, 'Six plats. Tous à retrouver dans le restaurant, avant la fin du service.');
  },
};

CUTS.j0_bar = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    c.prop('banner', 480, 40, { w: 560 });
    yield c.caption('Jour J. Le bar.', 2.2);
    c.add('sophie', CHARS.sophie, 200, { face: 1 }); c.add('karim', CHARS.karim, 280, { face: 1 });
    c.add('nadia', CHARS.nadia, 700, { face: -1 }); c.add('julien', CHARS.julien, 780, { face: -1 });
    c.add('hero', CHARS.hero, 480, { state: 'idle' });
    c.pose('sophie', 'cheer'); c.pose('nadia', 'cheer');
    yield c.say('sophie', 'Le voilààà ! Mesdames et messieurs, le retraité du jour !');
    c.confetti(70);
    yield c.say('hero', 'Vous n\'auriez pas dû… Si, en fait, vous auriez dû.');
    yield c.say('karim', 'Les bières sont pas encore servies, et les cadeaux sont éparpillés dans le bar.');
    yield c.say('hero', 'Pas de souci : c\'est mon dernier niveau, et j\'ai de l\'expérience.');
  },
};

CUTS.j0_fin = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    c.prop('banner', 480, 40, { w: 560 });
    c.prop('cake', 480, FLOOR_Y);
    c.add('sophie', CHARS.sophie, 200, { face: 1, state: 'cheer' }); c.add('karim', CHARS.karim, 290, { face: 1, state: 'cheer' });
    c.add('nadia', CHARS.nadia, 690, { face: -1, state: 'cheer' }); c.add('julien', CHARS.julien, 780, { face: -1, state: 'cheer' });
    c.add('chef', CHARS.chef, 780 + 70, { face: -1 });
    c.add('hero', CHARS.hero, 400, { face: 1 });
    c.confetti(80);
    yield c.say('chef', 'Quinze jours, quinze ans, quinze mille chaises… ' + CONFIG.hero + ', merci pour tout.');
    c.pose('hero', 'wave');
    yield c.say('hero', 'C\'est moi qui vous remercie. Vous allez me manquer. Sauf les mails urgents.');
    c.pose('hero', 'cheer'); c.confetti(100); c.rain(120);
    yield c.say('sophie', 'Bonne retraite !!!');
    yield c.wait(1);
    yield c.fade(1, 1.2);
    yield c.card('FIN', 'Bonne retraite, ' + CONFIG.hero + ' !', 3.2);
  },
};

/* ============================================================
   HISTOIRE : l'ordre des chapitres, cinématiques et niveaux
   ============================================================ */
const STORY = [
  { day: 'J-15', title: 'Le logigramme',      steps: [CUTS.j15_intro, LEVELS.logigramme, CUTS.j15_outro] },
  { day: 'J-12', title: 'En route !',         steps: [CUTS.j12_train, LEVELS.train] },
  { day: 'J-9',  title: 'Déjeuner japonais',  steps: [CUTS.j9_japonais, LEVELS.japonais, CUTS.j9_outro] },
  { day: 'J-5',  title: 'Charlie\'s',         steps: [CUTS.j5_charlies, LEVELS.charlies] },
  { day: 'J-2',  title: 'Dîner gastronomique', steps: [CUTS.j2_gastro, LEVELS.gastro] },
  { day: 'J-0',  title: 'La fête de départ',  steps: [CUTS.j0_bar, LEVELS.bar, CUTS.j0_fin] },
];
