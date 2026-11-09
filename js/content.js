'use strict';
/* ============================================================
   content.js : TOUT ce qui est propre à votre histoire
   ✏️  Les noms, dialogues et objectifs ci-dessous sont des PLACEHOLDERS
       à remplacer. Le moteur (engine.js / draw.js) n'a pas à être modifié.
   ============================================================ */

const CONFIG = {
  title: '15 JOURS\nET C\'EST LA QUILLE',       // ✏️ (\n = retour à la ligne)
  subtitle: 'Les derniers jours de Stephan',  // ✏️
  hero: 'Stephan',                              // ✏️ prénom du collègue qui part
  banner: 'BONNE RETRAITE STEPHAN !',            // ✏️ banderole du bar
  credits: [                                    // ✏️ (une ligne commençant par ★ s'affiche en gros)
    '★ BONNE RETRAITE ★', '', 'Un jeu offert avec plein d\'amour', 'par toute l\'équipe', '',
    'Avec :', 'Stephan dans son propre rôle', 'Coline, Amélie, Sheryna, Youssef, Imen', 'Cécile, Franck, Danila, Hakim, Matthieu',
    'Arno, Justine, Sandie, Bastien, Olivier', 'le Chef', '',
    'Aucune chaise de bureau n\'a été blessée', 'pendant le tournage.', '', '★ MERCI POUR TOUT ★',
  ],

};

/* ---------- Personnages ----------
   hairStyle : short | bald | long | bun | curly | cap | helmet
   options   : glasses, mustache, beard, tie, vest, scale                */
const CHARS = {
  // ---- Le héros ----
  hero:     { name: CONFIG.hero, skin: '#efb896', hair: '#e8e8e8', hairStyle: 'swept', brow: '#aeaeae', grin: true, wrinkles: true, jowls: true, ruddy: true, top: '#f4f4f4', stripes: '#2f6db5', collar: '#2f6db5', bottom: '#2c3440', badge: '#d6402f' },
  // ---- Le Chef (grand, chauve, chemise) ----
  chef:     { name: 'Le Chef', skin: '#e8b890', hair: '#6b5a4a', hairStyle: 'bald', top: '#bcd4ea', collar: '#ffffff', bottom: '#2c3440', scale: 1.15, pocket: true, badge: '#2f7fd1' },
  // ---- Delivery Team (nom, métier) ----
  coline:   { name: 'Coline',   skin: '#f0c8a8', hair: '#5a3020', hairStyle: 'long',  top: '#2f3a4f', bottom: '#2c3440', badge: '#2f7fd1', lips: '#c0392b', lashes: true, earring: '#e0b030' },                       // Manager Delivery
  amelie:   { name: 'Amélie',   skin: '#f6d2b4', hair: '#f08a2a', hairStyle: 'long',  top: '#f2e6d8', bottom: '#3a3a52', badge: '#d6402f', lips: '#e05a6a', lashes: true, earring: '#f2f2f2' },                       // Appui Management
  sheryna:  { name: 'Sheryna',  skin: '#e8bc98', hair: '#3a2418', hairStyle: 'long',  top: '#3d8f6a', bottom: '#2c3440', badge: '#d6402f', lips: '#b03a48', lashes: true, earring: '#e0b030' },                       // Coordinatrice CAC
  youssef:  { name: 'Youssef',  skin: '#d9a77e', hair: '#1c1410', hairStyle: 'short', top: '#6a4aa0', bottom: '#2c3440', beard: true, badge: '#d6402f' },          // Configuration Manager
  imen:     { name: 'Imen',     skin: '#efc4a4', hair: '#9a5a38', hairStyle: 'bun',   top: '#b84a4a', bottom: '#3a3a52', badge: '#d6402f', lips: '#c0392b', lashes: true, earring: '#e0b030' },                       // PMO
  cecile:   { name: 'Cécile',   skin: '#f2cfae', hair: '#b88a58', hairStyle: 'long',  top: '#262626', bottom: '#3a3a52', badge: '#2f7fd1', lips: '#d0505a', lashes: true },                       // Delivery Manager
  franck:   { name: 'Franck',   skin: '#f0c8a0', hair: '#8a8f94', hairStyle: 'short', top: '#3aa0b0', bottom: '#2c3440', glasses: true, badge: '#d6402f' },         // Delivery Manager
  danila:   { name: 'Danila',   skin: '#8a5a3c', hair: '#1c1410', hairStyle: 'curly', top: '#a8323a', bottom: '#2c3440', badge: '#d6402f', lips: '#8a2b3a', lashes: true, earring: '#d4af37', hoop: true },                       // Responsable Qualité
  hakim:    { name: 'Hakim',    skin: '#d2a07a', hair: '#1c1410', hairStyle: 'short', top: '#1f1f26', bottom: '#2c3440', beard: true, badge: '#d6402f' },          // Expert IA
  matthieu: { name: 'Matthieu', skin: '#e8bc98', hair: '#1c1410', hairStyle: 'short', top: '#4a78b0', bottom: '#2c3440', beard: true, badge: '#d6402f' },          // Release Train Engineer
  arno:     { name: 'Arno',     skin: '#e8bc98', hair: '#8a8f94', hairStyle: 'short', top: '#7a7f86', bottom: '#2c3440', glasses: true, beard: true, badge: '#d6402f', glassShape: 'rect', glassColor: '#b5651d' }, // Chef de projet Agile
  justine:  { name: 'Justine',  skin: '#efc4a4', hair: '#c49a58', hairStyle: 'curly', top: '#c9a24a', bottom: '#2c3440', badge: '#d6402f', lips: '#c0392b', lashes: true, earring: '#e0b030', spots: '#5a3a1a' },                       // Appui RTE
  sandie:   { name: 'Sandie',   skin: '#f0c8a8', hair: '#5a3a28', hairStyle: 'long',  top: '#b8a8b0', bottom: '#3a3a52', badge: '#d6402f', lips: '#c0505a', lashes: true },                       // Change Manager
  bastien:  { name: 'Bastien',  skin: '#e8bc98', hair: '#e8bc98', hairStyle: 'bald',  top: '#3a4660', bottom: '#2c3440', beard: true, badge: '#2f7fd1', headset: true },          // Incident Manager
  olivier:  { name: 'Olivier',  skin: '#f0c8a0', hair: '#c4682a', hairStyle: 'bun',   top: '#4b7a9a', bottom: '#2c3440', beard: true, badge: '#d6402f' },          // Référent SPICE
};
// ---- La cyber (à trouver pendant la crise) ----
CHARS.lionel  = { name: 'Lionel Bateau',  skin: '#f0c8a0', hair: '#f2f2f2', hairStyle: 'short', top: '#7a8fa6', bottom: '#3a3a46', badge: '#d6402f' };                         // MOA Cyber
CHARS.vincent = { name: 'Vincent Trauma', skin: '#f2cfae', hair: '#4a2e1a', hairStyle: 'short', top: '#4a6f8a', bottom: '#2c3440', glasses: true, badge: '#d6402f' };   // Cyber, process COSUR
CHARS.damien  = { name: 'Damien Croix', skin: '#e8bfa0', hair: '#ffffff', hairStyle: 'short', top: '#a9794a', bottom: '#5a5a6a', socks: '#8a3fb8', badge: '#d6402f' };   // Cyber, tournoi de belote
// ---- Matthieu déguisé en lapin (Dernier PI) ----
CHARS.lapin = { name: 'Matthieu', skin: '#e8bc98', hair: '#1c1410', hairStyle: 'short', top: '#f6f6f6', bottom: '#f6f6f6', shoe: '#f4a6b8', beard: true, bunny: '#ffffff', badge: '#d6402f' };
// ---- Matthieu en cowboy (fête de départ) ----
CHARS.cowboy = { name: 'Matthieu', skin: '#e8bc98', hair: '#1c1410', hairStyle: 'cowboy', top: '#a0522d', vest: '#6b3a1e', collar: '#d6402f', bottom: '#3a4a7a', shoe: '#5a3a1e', beard: true, badge: '#d6402f' };
// ---- Les chefs de la cellule de crise (salle Mozart) ----
CHARS.boss1 = { name: 'Chef', skin: '#e3b088', hair: '#555555', hairStyle: 'bald', top: '#1f2a44', bottom: '#1f2a44', tie: '#b3261e', glasses: true, scale: 1.05, badge: '#2f7fd1' };
CHARS.boss2 = { name: 'Chef', skin: '#f0c8a0', hair: '#9aa0a6', hairStyle: 'short', top: '#e8e8ef', bottom: '#2c3440', tie: '#2f6db5', mustache: true, badge: '#2f7fd1' };
CHARS.boss3 = { name: 'Chef', skin: '#d9a77e', hair: '#1c1410', hairStyle: 'short', top: '#3a3f4a', bottom: '#2c3440', tie: '#e0a030', glasses: true, badge: '#2f7fd1' };
CHARS.boss4 = { name: 'Cheffe', skin: '#f2c9a5', hair: '#6b3a22', hairStyle: 'bun', top: '#7a3a5a', bottom: '#2c3440', badge: '#2f7fd1' };
CHARS.boss5 = { name: 'Chef', skin: '#c68e63', hair: '#1c1410', hairStyle: 'curly', top: '#2a5a4a', bottom: '#2c3440', tie: '#ffffff', beard: true, badge: '#2f7fd1' };
CHARS.boss6 = { name: 'Cheffe', skin: '#efc4a4', hair: '#c49a58', hairStyle: 'long', top: '#2f3a4f', bottom: '#2c3440', badge: '#2f7fd1' };
// Anciens rôles de l'histoire -> vrais collègues (à ajuster scène par scène)
CHARS.sophie = CHARS.cecile; CHARS.karim = CHARS.youssef;
CHARS.nadia = CHARS.danila; CHARS.julien = CHARS.bastien;

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
  decor: [{ kind: 'eclats', x: 585, y: FLOOR_Y }],       // éclats de verre sous la fenêtre brisée
  type: 'level', bg: 'openspaceBrisee', theme: 'openspace',          // une fenêtre brisée : clin d'œil à la scène du train
  title: 'Le logigramme',
  objective: 'Récupère tous les morceaux du logigramme (il est immense !) et file au bureau du Chef !',
  exitLabel: 'CHEF',
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
    m.pl(26, 29, 8); m.pl(55, 58, 7); m.pl(84, 87, 8); m.pl(100, 103, 9); m.pl(64, 67, 12); m.pl(14, 17, 10);
    m.items('1', [[22, 10], [37, 11], [51, 9], [81, 10], [92, 13], [100, 11], [27, 6], [56, 5], [85, 6], [101, 7], [65, 10], [8, 13], [15, 8]]);
  }),
};

LEVELS.train = {
  type: 'level', theme: 'train', title: 'En route vers le GTAR',
  objective: 'Ta valise s\'est ouverte : récupère tes slips, tee-shirts et pantalons avant d\'arriver à Paris !',
  exitLabel: 'GTAR',
  items: ['slip', 'tshirt', 'pantalon'], hazards: ['valise', 'mail'],
  map: buildMap(100, m => {
    m.ground(0, 99); m.pit(32, 33); m.pit(66, 67);
    m.set(2, 14, 'S'); m.set(96, 14, 'X'); m.set(37, 14, 'C');
    m.set(12, 14, 'e'); m.set(24, 14, 'e'); m.set(42, 14, 'e'); m.set(54, 14, 'e'); m.set(80, 14, 'e'); m.set(92, 14, 'e');
    m.set(58, 9, 'f'); m.set(20, 5, 'f');
    m.pl(8, 10, 13); m.pl(14, 18, 12); m.pl(22, 25, 13); m.pl(19, 22, 9);
    m.pl(38, 41, 13); m.pl(44, 47, 11); m.pl(50, 53, 12); m.pl(48, 51, 8); m.pl(54, 57, 9);
    m.set(72, 14, '^'); m.pl(76, 79, 12); m.pl(82, 85, 10); m.pl(88, 91, 12); m.pl(86, 89, 7);
    m.items('1', [[16, 11], [45, 10], [83, 9], [21, 7]]);
    m.items('2', [[23, 12], [51, 11], [55, 7], [9, 11]]);
    m.items('3', [[90, 11], [49, 6], [87, 5], [60, 13]]);
  }),
};

LEVELS.crise = {
  type: 'level', theme: 'crise', title: 'La crise cyber',
  objective: 'Mobilise la cyber, trouve la mallette de crise et les documents, retrouve Bastien puis rendez vous en salle Mozart pour gérer la crise!',
  exitLabel: 'SALLE MOZART',
  items: ['papier', 'malette', 'npc:lionel', 'npc:vincent', 'npc:damien', 'bureau'], hazards: ['chair', 'virus'],
  talks: {
    3: [['hero', 'Lionel ! On ouvre une crise, on a besoin de la cyber en salle Mozart !'], ['lionel', 'Ah non, désolé, j\'ai pas le temps. Je suis la MOA Cyber.']],
    4: [['hero', 'Vincent ! C\'est la crise, on a besoin de toi !'], ['vincent', 'Non, désolé. Je vous fais un process pour prioriser vos vulnérabilités pour le COSUR.']],
    5: [['hero', 'Damien ! Les serveurs sont compromis, viens vite !'], ['damien', 'Je peux pas venir, je vais à mon tournoi de belote.']],
    6: [['hero', 'Bastien ? … Bastien ?! Mais il est où, le padawan, encore ?'], [null, 'Pas de Bastien. Direction la salle Mozart.']],
  },
  map: buildMap(120, m => {
    m.ground(0, 119); m.pit(46, 48); m.pit(76, 78);
    m.set(2, 14, 'S'); m.set(116, 14, 'X'); m.set(40, 14, 'C'); m.set(85, 14, 'C');
    m.set(16, 14, 'e'); m.set(31, 14, 'e'); m.set(56, 14, 'e'); m.set(70, 14, 'e'); m.set(88, 14, 'e'); m.set(104, 14, 'e');
    m.set(44, 8, 'f'); m.set(72, 5, 'f'); m.set(103, 9, 'f');
    m.pl(6, 9, 13); m.pl(12, 15, 12); m.pl(18, 21, 9); m.pl(24, 28, 12);
    m.pl(32, 35, 13); m.pl(36, 39, 10);
    m.pl(56, 59, 12); m.pl(60, 63, 9); m.pl(64, 67, 6);
    m.pl(82, 86, 12); m.pl(90, 93, 13); m.pl(94, 97, 10); m.pl(98, 101, 7);
    m.items('1', [[7, 11], [14, 10], [19, 7], [37, 8], [62, 7], [95, 8], [99, 5]]);
    m.items('2', [[66, 4]]);
    m.items('3', [[26, 11]]);
    m.items('4', [[52, 14]]);
    m.items('5', [[84, 11]]);
    m.items('6', [[108, 14]]);
  }),
};

LEVELS.pi = {
  type: 'level', theme: 'openspace', title: 'Dernier PI',
  objective: 'Carottes, chocolats… et attrape Matthieu déguisé en lapin !',
  exitLabel: 'SALLE PI',
  items: ['carotte', 'chocolat', 'npc:lapin'], hazards: ['chair', 'mail'],
  chase: { key: 'lapin', k: 3, trigger: 300, path: [[86, 12], [91, 9], [97, 12], [103, 9], [109, 12], [116, 12]] },
  talks: { 3: [['lapin', 'Ok, ok, tu m\'as eu ! Mais attention : j\'ai encore des carottes dans les poches.'], ['hero', 'Allez, direction la salle PI. Ça commence sans nous !']] },
  map: buildMap(130, m => {
    m.ground(0, 129); m.pit(44, 46);
    m.set(2, 14, 'S'); m.set(124, 14, 'X'); m.set(41, 14, 'C'); m.set(78, 14, 'C'); m.set(80, 14, 'M');
    m.set(16, 14, 'e'); m.set(30, 14, 'e'); m.set(56, 14, 'e'); m.set(70, 14, 'e'); m.set(118, 14, 'e');
    m.set(46, 9, 'f'); m.set(75, 6, 'f'); m.set(100, 6, 'f');
    m.pl(6, 9, 13); m.pl(12, 15, 12); m.pl(18, 21, 9); m.pl(24, 27, 12);
    m.pl(30, 33, 13); m.pl(34, 37, 10); m.pl(38, 41, 7);
    m.pl(48, 51, 12); m.pl(52, 55, 9); m.pl(58, 61, 13); m.pl(62, 65, 10); m.pl(66, 69, 7);
    m.pl(84, 87, 12); m.pl(90, 93, 9); m.pl(96, 99, 12); m.pl(102, 105, 9); m.pl(108, 111, 12); m.pl(114, 117, 12);
    m.items('1', [[7, 11], [14, 10], [19, 7], [39, 5], [53, 7], [67, 5], [91, 7], [103, 7]]);
    m.items('2', [[25, 10], [35, 8], [49, 10], [63, 8], [86, 10], [97, 10], [109, 10], [116, 10]]);
  }),
};

LEVELS.backlog = {
  type: 'level', theme: 'circuit', title: 'Le backlog',
  objective: 'Avec ton padawan, range les tickets du backlog !',
  exitLabel: 'DONE',
  items: ['ticketbl'], hazards: ['bug', 'virus'], follower: 'bastien',
  map: buildMap(120, m => {
    m.ground(0, 119); m.pit(30, 32); m.pit(62, 64); m.pit(92, 94);
    m.set(2, 14, 'S'); m.set(116, 14, 'X'); m.set(24, 14, 'C'); m.set(70, 14, 'C');
    m.set(14, 14, 'e'); m.set(40, 14, 'e'); m.set(54, 14, 'e'); m.set(80, 14, 'e'); m.set(100, 14, 'e');
    m.set(34, 5, 'f'); m.set(82, 4, 'f'); m.set(112, 3, 'f');
    m.pl(6, 9, 13); m.pl(12, 15, 12); m.pl(18, 21, 9); m.pl(24, 27, 12);
    m.pl(34, 37, 13); m.pl(38, 41, 10); m.pl(42, 45, 7); m.pl(46, 49, 10);
    m.pl(52, 55, 13); m.pl(56, 59, 12);
    m.pl(66, 69, 13); m.pl(70, 73, 10); m.pl(74, 77, 7); m.pl(78, 81, 10);
    m.pl(84, 87, 13); m.pl(88, 91, 12); m.pl(96, 99, 12); m.pl(100, 103, 9); m.pl(104, 107, 6); m.pl(108, 111, 9);
    m.items('1', [[7, 11], [14, 10], [19, 7], [25, 10], [35, 11], [39, 8], [43, 5], [47, 8], [57, 10], [67, 11], [71, 8], [75, 5], [79, 8], [89, 10], [101, 7], [105, 4], [109, 7]]);
  }),
};

LEVELS.japonais = {
  type: 'level', theme: 'japonais', title: 'Les commandes du déjeuner',
  objective: 'Complète le menu de chacun !',
  exitLabel: 'TABLE 12',
  items: ['maki', 'sushi', 'brochette'], hazards: ['waiter'],
  map: buildMap(100, m => {
    m.ground(0, 99);
    m.set(2, 14, 'S'); m.set(96, 14, 'X'); m.set(28, 14, 'C');
    m.set(14, 14, 'e'); m.set(34, 14, 'e'); m.set(58, 14, 'e'); m.set(82, 14, 'e');
    m.pl(6, 9, 13); m.pl(12, 15, 12); m.pl(18, 21, 13); m.pl(23, 26, 12);
    m.pl(32, 35, 13); m.pl(38, 41, 11); m.pl(44, 47, 13);
    m.pl(52, 55, 13); m.pl(57, 60, 11); m.pl(62, 65, 9);
    m.pl(70, 72, 13); m.pl(73, 75, 11); m.pl(76, 80, 9); m.pl(84, 87, 12);
    m.pl(43, 46, 8); m.pl(66, 69, 6); m.pl(82, 85, 6);
    m.items('1', [[7, 12], [33, 12], [63, 8], [67, 4], [19, 12], [58, 10], [74, 10]]);
    m.items('2', [[13, 11], [39, 10], [85, 11], [44, 6], [53, 12], [71, 12], [30, 13]]);
    m.items('3', [[24, 11], [45, 12], [78, 8], [83, 4], [21, 12], [60, 10], [14, 10]]);
  }),
};

LEVELS.charlies = {
  type: 'level', theme: 'charlies', title: 'L\'entrecôte du départ',
  objective: 'Récupère les entrecôtes et les frites pour nourrir tes collègues !',
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
    m.pl(16, 19, 9); m.pl(49, 52, 8); m.pl(72, 75, 7);
    m.items('1', [[6, 12], [18, 12], [27, 12], [45, 10], [68, 9], [73, 5]]);
    m.items('2', [[12, 11], [30, 11], [39, 12], [63, 11], [80, 13], [17, 7], [50, 6]]);
  }),
};

LEVELS.fete = {
  type: 'level', theme: 'bar', title: 'La fête de départ',
  objective: 'retrouve Pintes, prépare des tapas, trouve tes cadeaux… et rattrape Matthieu sur sa Licorne !',
  exitLabel: 'LA FÊTE',
  items: ['biere', 'tapas', 'cadeau', 'npc:cowboy'], hazards: ['waiter', 'mail'],
  chase: { key: 'cowboy', k: 4, mount: 'cheval', trigger: 300, path: [[88, 12], [93, 9], [99, 12], [105, 9], [111, 12], [117, 9], [121, 12]] },
  talks: { 4: [['cowboy', 'Yihaaa… Ok, ok, tu m\'as eu, cow-boy ! Les cadeaux sont à toi.'], ['hero', 'Allez, direction la fête !']] },
  map: buildMap(130, m => {
    m.ground(0, 129); m.pit(40, 42); m.pit(70, 72);
    m.set(2, 14, 'S'); m.set(126, 14, 'X'); m.set(30, 14, 'C'); m.set(66, 14, 'C'); m.set(100, 14, 'C'); m.set(84, 14, 'M');
    m.set(20, 14, 'e'); m.set(36, 14, 'e'); m.set(56, 14, 'e'); m.set(75, 14, 'e'); m.set(94, 14, 'e'); m.set(108, 14, 'e');
    m.set(28, 6, 'f'); m.set(60, 6, 'f'); m.set(101, 3, 'f');
    m.pl(5, 8, 13); m.pl(11, 14, 12); m.pl(17, 20, 9); m.pl(23, 26, 12);
    m.pl(33, 36, 13); m.pl(37, 40, 10); m.pl(44, 47, 12); m.pl(48, 51, 9); m.pl(52, 55, 6);
    m.pl(58, 61, 13); m.pl(62, 65, 10); m.pl(66, 69, 7); m.pl(73, 76, 12); m.pl(77, 80, 9);
    m.pl(86, 89, 12); m.pl(92, 95, 9); m.pl(98, 101, 12); m.pl(104, 107, 9); m.pl(110, 113, 12); m.pl(116, 119, 9); m.pl(120, 123, 12);
    m.items('1', [[6, 11], [12, 10], [18, 7], [34, 11], [38, 8], [45, 10], [49, 7], [53, 4], [63, 8]]);
    m.items('2', [[24, 10], [59, 11], [67, 5], [74, 10], [78, 7], [89, 10], [93, 7], [99, 10]]);
    m.items('3', [[28, 13], [96, 13], [105, 7], [111, 10], [117, 7], [121, 10]]);
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

/* ---------- Arènes « coup de balai » (pas des niveaux de plateforme : voir BroomScene) ---------- */
const ARENAS = {};
ARENAS.balai = {
  type: 'broom', bg: 'circuit', theme: 'circuit', thrower: 'franck', goal: 24,
  title: 'Les tickets HDR', objective: 'Balaie les tickets lancés par Franck ! 4 touches = on recommence.',
};

ARENAS.danse = { type: 'dance', song: 'dancing', bg: 'bar', theme: 'bar', title: 'Dancing King', objective: 'Appuie sur la bonne flèche au bon moment !' };

/* ---------- Mini-jeux (menu principal) : def = une arène jouable hors histoire ---------- */
ARENAS.danseFull = { type: 'dance', free: true, song: 'full', bg: 'bar', theme: 'bar', title: 'Danse', objective: 'Toute la chanson : appuie sur la bonne flèche au bon moment !' };
ARENAS.aura = { type: 'aura', mode: 'cpu', songs: ['dre', 'gangsta'], title: 'Battle d\'aura', objective: 'Stephan contre Arno' };
ARENAS.lapin = { type: 'bunny', title: 'Lapin Sport', objective: 'Envoie Matthieu le plus loin possible' };
ARENAS.pong = { type: 'pong', title: 'Pong Deve', objective: 'Premier à 7 points contre l\'ordinateur' };
ARENAS.pac = { type: 'pac', title: 'Stephan Man', objective: 'Mange tous les points' };
ARENAS.invader = { type: 'invader', title: 'Deve Invader', objective: 'Repousse les collègues envahisseurs' };
const MINIGAMES = [
  { id: 'danse', title: 'Danse', desc: 'Toute la chanson (3 min 58) · bonus toutes les 10 flèches', best: 'dance.full', def: ARENAS.danseFull },
  { id: 'aura', title: 'Battle d\'aura', desc: 'Stephan contre Arno (ordinateur) · sur Dr. Dre et Coolio · 3 manches', best: 'aura.cpu', bestLabel: 'Victoires', icon: 'duel', def: ARENAS.aura },
  { id: 'lapin', title: 'Lapin Sport', desc: 'Envoie Matthieu le plus loin avec ta batte · 3 lancers', best: 'lapin.best', bestUnit: ' m', icon: 'bunny', def: ARENAS.lapin },
  { id: 'pong', title: 'Pong Deve', desc: 'Le Pong d\'origine, mais la balle est la tête de Stephan · premier à 7', best: 'pong.wins', bestLabel: 'Victoires', icon: 'pong', def: ARENAS.pong },
  { id: 'pac', title: 'Stephan Man', desc: 'Mange tous les points, évite les collègues fantômes · 3 vies', best: 'stephanman.best', icon: 'pac', def: ARENAS.pac },
  { id: 'invader', title: 'Deve Invader', desc: 'Space Invaders : tire sur les têtes des collègues · 3 vies, vagues sans fin', best: 'invader.best', icon: 'invader', def: ARENAS.invader },
];

function* juggle(c, ball, n) { for (let i = 0; i < n; i++) for (let k = 0; k <= 10; k++) { ball.y = FLOOR_Y - 70 - Math.sin(k / 10 * Math.PI) * 50; yield c.wait(0.045); } }
function* kick(c, ball, x1, y1) {
  const x0 = ball.x, y0 = ball.y;
  for (let k = 1; k <= 18; k++) { const u = k / 18; ball.x = x0 + (x1 - x0) * u; ball.y = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 70; yield c.wait(0.03); }
}

const CUTS = {};

CUTS.j15_train = {
  type: 'cutscene', bg: 'train',
  script: function* (c) {
    yield c.caption('Lundi matin. Dans le train, direction Paris.', 2.6);
    c.prop('seat', 440, FLOOR_Y);
    c.add('hero', CHARS.hero, 446, { state: 'sit', z: 1 });
    yield c.say('hero', 'Un train à l\'heure, un siège à la fenêtre… Quinze jours avant la retraite, la vie est belle.');
    c.shake(0.8); c.sfx('hurt');
    c.prop('slip', 560, 300, { scale: 1.8 }); c.prop('tshirt', 640, 340, { scale: 1.8 }); c.prop('pantalon', 720, 290, { scale: 1.8 });
    yield c.wait(0.9);
    c.emote('hero', '!', 1.6); c.pose('hero', 'hurt');
    yield c.say('hero', 'B**d*l ma valise ! Elle s\'est ouverte : mes slips, mes tee-shirts, mes pantalons… tout s\'envole dans le wagon !', { mood: 'surprised' });
    c.pose('hero', 'idle');
    yield c.say(null, 'Mission : récupérer toute la garde-robe avant d\'arriver a Paris.');
  },
};

CUTS.j15_train_bastien = {
  type: 'cutscene', bg: 'train',
  script: function* (c) {
    const GLASS = ['#d9ecff', '#ffffff', '#9ac8f0', '#bfe0f8'];
    // un bond avec une trajectoire en arc ; rot = inclinaison finale (radians)
    const arc = (k, x2, y2, dur, h, rot) => { const a = c.actors[k], x0 = a.x, y0 = a.y; return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / dur); a.x = lerp(x0, x2, p); a.y = lerp(y0, y2, p) - Math.sin(p * Math.PI) * h; a.rot = (rot || 0) * p; return p >= 1; } }; };
    c.add('bastien', CHARS.bastien, 538, { face: -1, state: 'idle' });
    c.prop('seat', 560, FLOOR_Y, { front: true });                      // le siège cache la moitié de Bastien
    c.add('hero', CHARS.hero, -60, { state: 'walk' });
    yield c.caption('Un peu plus loin juste avant le wagon Bar(re)…', 2.2);
    yield c.walk('hero', 300, 120);
    c.face('hero', 1); c.emote('hero', '?', 1.2);
    yield c.wait(0.9);
    c.emote('hero', '!', 1);
    c.mood('hero', 'angry');
    yield c.say('hero', "Qu'est-ce que tu fous là, Padawan ! Tu vas être en retard pour le Daily, bordel !", { mood: 'angry' });
    c.emote('bastien', 'Chut', 2.4);
    yield c.say('bastien', 'ChuUuUuUut ! Je fais un cache-cache avec Olivier.');
    c.mood('hero', undefined);
    for (const d of [-1, 1, -1, 1, 1]) { c.face('hero', d); c.emote('hero', '?', 0.6); yield c.wait(0.6); }      // Stephan cherche Olivier partout
    c.face('hero', 1);
    yield c.wait(0.5);
    // Olivier traverse la vitre en volant
    c.sfx('hurt'); c.sfx('stomp'); c.shake(0.6);
    c.prop('vitrecassee', 510, 160);
    c.burst(510, 160, 60, GLASS, 420);
    c.add('olivier', CHARS.olivier, 510, { y: 175, face: -1, state: 'jump' });
    const hop = (() => { const a = c.actors.hero, x0 = a.x; return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / 0.5); a.x = lerp(x0, x0 - 75, p); a.y = FLOOR_Y - Math.sin(p * Math.PI) * 46; a.state = p < 1 ? 'jump' : 'idle'; if (p >= 1) { a.y = FLOOR_Y; return true; } return false; } }; })();
    c.emote('hero', '!!', 1.4); c.mood('hero', 'surprised');
    yield [arc('olivier', 410, FLOOR_Y, 0.85, 30, -6.2832), hop];
    c.actors.olivier.rot = 0; c.actors.olivier.state = 'idle'; c.sfx('stomp'); c.burst(410, FLOOR_Y, 10, ['#e8e2d4'], 160);
    yield c.wait(0.5);
    c.face('olivier', -1); c.face('hero', 1);
    yield c.say('olivier', 'Salut Papi ! ', { mood: 'laugh' });
    c.mood('hero', undefined);
    // Olivier rejoint Bastien et l'attrape
    yield c.walk('olivier', 492, 200);
    c.face('olivier', 1);
    c.pose('olivier', 'cheer'); c.sfx('win');
    yield c.say('olivier', 'TROUVÉÉÉÉÉ !', { mood: 'laugh' });
    c.pose('olivier', 'idle'); c.emote('bastien', '!!', 1.4); c.mood('bastien', 'surprised');
    yield c.walk('bastien', 524, 60);
    c.face('bastien', 1);
    yield c.say('olivier', 'Je vais te livrer au Delivery toi tu vas voir !', { mood: 'angry' });
    // ils s'envolent tous les deux
    c.pose('olivier', 'jump'); c.pose('bastien', 'jump'); c.mood('bastien', 'laugh'); c.mood('olivier', 'laugh');
    yield c.say('olivier', "VERS L'INFINI ET AU DELIVERY !", { name: 'Olivier et Bastien', mood: 'laugh' });
    c.sfx('jump');
    yield [arc('olivier', 850, 175, 1.0, 30, -0.7), arc('bastien', 862, 195, 1.0, 30, -0.7)];          // ils filent droit sur la fenêtre de droite…
    c.sfx('hurt'); c.sfx('stomp'); c.shake(0.6); c.prop('vitrecassee', 850, 170); c.burst(850, 170, 60, GLASS, 460);   // …et la brisent
    yield [arc('olivier', 1160, -150, 0.7, 0, -1.05), arc('bastien', 1190, -130, 0.7, 0, -1.05)];
    c.remove('olivier'); c.remove('bastien');
    c.pose('hero', 'idle'); c.face('hero', 1); c.emote('hero', '…', 1.6);
    yield c.wait(1.6);
    yield c.say('hero', 'Quinze jours avant la retraite… Ils vont me manquer, ces cons.', { mood: 'sad' });
    // ---- le train ralentit et entre en gare ----
    c.mood('hero', undefined);
    const hero = c.actors.hero;
    yield c.wait(0.6);
    c.sfx('blip'); c.caption('Le train ralentit… Prochain arrêt : Paris.', 3.2);
    c.sfx('spring');
    yield { t: 0, update(dt) { this.t += dt; const u = Math.min(1, this.t / 6); TRAIN.speed = 1 - ease(u); TRAIN.st = ease(Math.max(0, (u - 0.3) / 0.7)); hero.rot = Math.sin(Math.min(1, u * 1.25) * Math.PI) * 0.09; return u >= 1; } };
    hero.rot = 0; TRAIN.speed = 0; TRAIN.st = 1; c.sfx('stomp'); c.shake(0.35);
    yield c.wait(0.8);
    c.sfx('door'); c.sfx('blip');
    yield c.caption('Paris. Terminus, tout le monde descend !', 2.6);
    yield c.fade(1, 0.8);
  },
};

CUTS.j14_bureau = {
  type: 'cutscene', bg: 'openspaceBrisee', theme: 'openspace',
  script: function* (c) {
    c.prop('eclats', 585, FLOOR_Y);
    seat(c, 'coline', CHARS.coline, 200, 1, true);
    // Bastien et Olivier, chacun à un bout de la pièce (au fond), se lancent des avions en papier
    const BY = FLOOR_Y - 24, hand = k => ({ x: c.actors[k].x + c.actors[k].facing * 16, y: c.actors[k].y - 52 });
    c.add('bastien', CHARS.bastien, 80, { y: BY, face: 1, z: -1 });
    c.emote('bastien', ':D', 1.4);
    c.add('olivier', CHARS.olivier, 880, { y: BY, face: -1, z: -1 });
    c.add('hero', CHARS.hero, -60, { state: 'walk' });
    const all = ws => ({ update(dt) { ws = ws.filter(w => !w.update(dt)); return ws.length === 0; } });
    const run = g => { let w = null; return { update(dt) { for (let n = 0; n < 50; n++) { if (!w) { const r = g.next(); if (r.done) return true; w = r.value; } if (!w.update(dt)) return false; w = null; dt = 0; } return false; } }; };
    const flight = (p, x2, y2, dur, h, upTo) => { const x0 = p.x, y0 = p.y, end = upTo || dur; return { t: 0, update(dt) { this.t = Math.min(end, this.t + dt); const k = this.t / dur; p.x = lerp(x0, x2, k); p.y = lerp(y0, y2, k) - Math.sin(k * Math.PI) * h + Math.sin(k * 14) * 3; p.rot = Math.cos(k * 14) * 0.18; return this.t >= end; } }; };
    const hopTo = (k, x2, dur, hops, h, carry) => { const a = c.actors[k], x0 = a.x; a.facing = x2 > x0 ? 1 : -1; return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / dur); a.x = lerp(x0, x2, p); a.y = FLOOR_Y - Math.abs(Math.sin(p * hops * Math.PI)) * h; a.state = a.y < FLOOR_Y - 2 ? 'jump' : 'idle'; if (carry) { carry.x = a.x + a.facing * 15; carry.y = a.y - 54; carry.dir = a.facing; carry.rot = 0.3; } if (p >= 1) { a.y = FLOOR_Y; a.state = 'idle'; return true; } return false; } }; };
    const travel = (k, x2, y2, speed) => { const a = c.actors[k], x0 = a.x, y0 = a.y, dur = Math.abs(x2 - x0) / speed; a.facing = x2 > x0 ? 1 : -1; a.state = 'walk'; return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / dur); a.x = lerp(x0, x2, p); a.y = lerp(y0, y2, p); if (p >= 1) { a.state = 'idle'; return true; } return false; } }; };
    const toss = function* (from, to, dur) {
      c.pose(from, 'wave'); const h = hand(from), p = c.prop('avion', h.x, h.y, { front: true, dir: c.actors[from].facing }); c.sfx('blip');
      yield c.wait(0.25); c.pose(from, 'idle');
      const e = hand(to); yield flight(p, e.x, e.y, dur, 55); c.unprop(p);
    };
    const rally = function* () { yield* toss('bastien', 'olivier', 1.5); yield* toss('olivier', 'bastien', 1.5); };
    yield [c.caption('Le lendemain. Open space.', 2.4), c.walk('hero', 380, 120), run(rally())];
    // un troisième avion… Arno arrive en sautant et l'attrape au vol
    c.face('hero', 1); c.emote('hero', '?', 1.4);
    c.pose('bastien', 'wave'); const h3 = hand('bastien'), p3 = c.prop('avion', h3.x, h3.y, { front: true, dir: 1 }); c.sfx('blip');
    c.add('arno', CHARS.arno, 1040, { face: -1 });
    yield all([flight(p3, 865, 300, 2.2, 55, 1.6), hopTo('arno', 640, 1.6, 3, 40)]);
    c.pose('bastien', 'idle');
    p3.x = c.actors.arno.x - 15; p3.y = c.actors.arno.y - 54; p3.dir = -1; p3.rot = 0.3; c.emote('arno', '!', 1.2);
    yield c.say('arno', "Je l'ai !", { mood: 'laugh' });
    yield all([hopTo('arno', 1130, 1.8, 4, 36, p3)]);
    c.remove('arno'); c.unprop(p3);
    // Bastien rejoint Olivier
    c.emote('bastien', '!', 1);
    yield all([travel('bastien', 700, FLOOR_Y, 230), travel('olivier', 780, FLOOR_Y, 130)]);
    c.actors.bastien.z = 0; c.actors.olivier.z = 0; c.face('bastien', -1); c.face('olivier', -1);
    c.pose('hero', 'wave');
    yield c.say('hero', 'Bonjour tout le monde ! Ma valise et moi sommes enfin arrivés.');
    c.pose('hero', 'idle');
    c.add('chef', CHARS.chef, 1020, { face: -1, state: 'walk' });
    yield c.walk('chef', 540, 110);
    c.face('hero', 1);
    yield c.say('chef', 'Stephan. Avant de partir, j\'ai besoin du logigramme de la procédure de la procédure de crise. Complet.');
    yield c.say('hero', 'Complet ? Il est tellement grand qu\'il est en morceaux dans tout l\'open space…');
    yield c.say('chef', 'Alors il y a beaucoup de morceaux à retrouver. Bonne chance.');
    c.face('hero', -1);
    yield c.say('coline', 'Bon courage, Stephan !');
    // l'avion d'Arno revient en sens inverse… et se plante dans la tête du Chef
    yield c.wait(0.6);
    const pf = c.prop('avion', 1020, FLOOR_Y - 84, { front: true, dir: -1 }); c.sfx('blip');
    yield flight(pf, 574, FLOOR_Y - 78, 1.1, 0);
    pf.rot = 0.12; c.sfx('hurt'); c.shake(0.35); c.burst(560, FLOOR_Y - 80, 12, ['#fff', '#d9e2ee'], 200);
    c.pose('chef', 'hurt'); c.mood('chef', 'surprised'); c.emote('chef', '!!', 1.6);
    // tout le monde est choqué, puis se tourne vers l'endroit d'où il vient
    for (const k of ['hero', 'coline', 'bastien', 'olivier']) c.emote(k, '!', 1.4);
    c.mood('hero', 'surprised'); c.mood('coline', 'surprised');
    yield c.wait(1.1);
    for (const k of ['hero', 'coline', 'bastien', 'olivier', 'chef']) c.face(k, 1);
    c.pose('chef', 'idle'); c.mood('chef', 'angry'); pf.dir = 1; pf.x = 505;          // le Chef s'est retourné : l'avion reste planté à l'arrière de sa tête
    yield c.wait(0.9);
    // une fois retournés, Bastien et Olivier ne peuvent plus se retenir : fou rire
    c.mood('hero', undefined); c.mood('coline', undefined);
    c.pose('bastien', 'cheer'); c.pose('olivier', 'cheer'); c.mood('bastien', 'laugh'); c.mood('olivier', 'laugh'); c.emote('bastien', 'HA', 3); c.emote('olivier', 'HA', 3);
    const rire = (ks, dur) => ({ t: 0, update(dt) { this.t += dt; for (const k of ks) { const a = c.actors[k]; a.y = FLOOR_Y - Math.abs(Math.sin(this.t * 22 + (k === 'olivier' ? 1.3 : 0))) * 4; } if (this.t >= dur) { for (const k of ks) c.actors[k].y = FLOOR_Y; return true; } return false; } });
    yield all([rire(['bastien', 'olivier'], 1.8), run((function* () { for (let i = 0; i < 5; i++) { c.sfx('blip'); yield c.wait(0.36); } })())]);
    yield c.say('bastien', 'Hihi… un logigramme géant… et un avion dans la tête du Chef… hahaha !', { mood: 'laugh' });
    yield c.say('olivier', 'Il va falloir courir ! haha !', { mood: 'laugh' });
    c.mood('chef', undefined);
    c.pose('bastien', 'idle'); c.pose('olivier', 'idle');
    // juste avant la fin : Sheryna passe au-dessus d'eux sur un grand avion en papier
    const SH = Object.assign({}, CHARS.sheryna, { scale: 0.7 });
    const big = c.prop('avion', 1200, 250, { dir: -1, s: 5.2 });
    const sh = c.add('sheryna', SH, 1200, { y: 250, face: -1, state: 'sit', z: 4 }); sh.rideOn = big; sh.rideDx = 6; sh.rideDy = -7;
    c.sfx('jump'); sh.waving = true;
    yield flight(big, 560, 250, 2.4, 0);
    big.hover = 4;
    yield c.say('sheryna', "Coucou, vous êtes trop Mim's vu d'en haut !", { mood: 'laugh' });
    c.actors.coline.waving = true; c.face('coline', 1);
    yield c.say('coline', "Coucou Sheryna ! N'oublie pas l'accompagnement des Frontaux dans 5 minutes.");
    c.actors.coline.waving = false;
    yield c.say('sheryna', 'Avec Air Sheryna, aucun retard !', { mood: 'laugh' });
    big.hover = 0; sh.waving = false; c.sfx('win'); c.burst(big.x + 60, big.y, 16, ['#fff', '#d9e2ee'], 220); big.rot = -0.12;
    yield flight(big, -420, 200, 0.7, 0);
    c.remove('sheryna'); c.unprop(big);
    yield c.say(null, 'Mission du jour : retrouver tous les morceaux du logigramme.');
  },
};

CUTS.j15_outro = {
  type: 'cutscene', bg: 'openspaceBrisee', theme: 'openspace',
  script: function* (c) {
    c.prop('eclats', 585, FLOOR_Y);
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

CUTS.j9_choix = {
  type: 'cutscene', bg: 'openspace',
  script: function* (c) {
    const frame1 = () => ({ n: 0, update() { return this.n++ >= 1; } });
    const tween = (dur, fn) => ({ t: 0, update(dt) { this.t += dt; const u = Math.min(1, this.t / dur); fn(u); return u >= 1; } });
    const arc = (k, x2, y2, dur, h) => { const a = c.actors[k], x0 = a.x, y0 = a.y; return tween(dur, u => { a.x = lerp(x0, x2, u); a.y = lerp(y0, y2, u) - Math.sin(u * Math.PI) * h; }); };
    const beat = sec => ({ t: 0, update(dt) { this.t += dt; return this.t >= sec || Input.confirm(); } });          // pause qu'on peut passer avec Entrée
    const exit = (k, x, sp) => c.spawn((function* () { yield c.walk(k, x, sp || 200); c.remove(k); })());
    // ---- décor : le bureau de Stephan à gauche, un autre bureau au fond à droite ----
    c.prop('chair', 66, FLOOR_Y, { z: -1 }); c.prop('desk', 106, FLOOR_Y, { front: true });
    c.prop('desk', 860, FLOOR_Y, {});
    // ---- Arno, Sandie, Bastien et Olivier jouent à 1, 2, 3 soleil (Olivier compte, face au mur) ----
    const X0 = { arno: 300, sandie: 350, bastien: 400 }, LIM = 845;
    for (const k in X0) c.add(k, CHARS[k], X0[k], { face: 1 });
    c.add('olivier', CHARS.olivier, 925, { face: 1 });
    const gm = { finish: false, done: false, out: {}, stop: {} };
    c.spawn((function* () {
      for (let round = 0; !gm.done; round++) {
        c.face('olivier', 1); c.emote('olivier', 'Un, deux, trois…', 1.7);
        const act = Object.keys(X0).filter(k => !gm.out[k] && !gm.stop[k]);
        for (const k of act) { c.face(k, 1); c.pose(k, 'walk'); }
        for (let i = 0; i < 40 && !gm.finish; i++) { for (const k of act) { const a = c.actors[k]; if (a.x < LIM - (k === 'bastien' ? 40 : k === 'sandie' ? 20 : 0)) a.x += 1.04; } yield c.wait(0.04); }
        c.face('olivier', -1); c.emote('olivier', 'SOLEIL !', 1.2);
        if (round === 0) {                               // Arno ne s'arrête pas à temps : il perd
          yield c.wait(0.35); c.emote('arno', '!', 1.2);
          for (const k of act) if (k !== 'arno') c.pose(k, 'idle');
          yield c.wait(0.3); c.pose('arno', 'idle'); c.emote('olivier', 'Arno a bougé !', 1.6); c.emote('arno', 'Zut !', 1.6); gm.out.arno = true;
          yield c.wait(1.2); c.face('arno', -1); yield c.walk('arno', X0.arno - 30, 90); c.face('arno', 1); c.pose('arno', 'idle');
        } else if (gm.finish) {                          // juste avant la victoire de Sandie, Bastien se fait repérer
          for (const k of act) if (k !== 'bastien') c.pose(k, 'idle');
          yield c.wait(0.4); c.emote('bastien', '!', 1.2); yield c.wait(0.35); c.pose('bastien', 'idle');
          c.emote('olivier', 'Bastien a bougé !', 1.8); c.emote('bastien', 'Zut !', 1.8); gm.out.bastien = true; yield c.wait(1.5);
          gm.done = true;
        } else { for (const k of act) c.pose(k, 'idle'); yield c.wait(1.3); }
      }
      for (const k of ['sandie', 'bastien']) c.pose(k, 'idle');
    })());
    yield c.caption('Midi. Open space.', 2.2);
    yield c.wait(4.2);
    // ---- Stephan arrive ----
    c.add('hero', CHARS.hero, -60, { face: 1, state: 'walk' });
    yield c.walk('hero', 200, 130);
    c.emote('hero', '?', 1.2);
    yield c.say('hero', 'Vous faites quoi encore ?');
    yield c.say('arno', 'Un, deux, trois, soleil ! Ça se voit pas ?', { name: 'Tout le monde', mood: 'laugh' });
    yield c.say('bastien', 'Tu veux participer, Stephan ?');
    c.pose('hero', 'idle');
    yield c.say('hero', "Non merci, j'ai des choses plus importantes à faire.");
    // ---- Stephan s'assoit à son PC et tape ----
    c.face('hero', -1); yield c.walk('hero', 70, 150);
    const hero = c.actors.hero; c.face('hero', 1); hero.z = 1; c.pose('hero', 'sit'); hero.typing = true;
    yield c.wait(0.8);
    // ---- la fenêtre Teams apparaît ----
    const teams = c.prop('teams', 400, 455, { front: true, open: 0, w: 470, h: 340, msgs: [], up: 0, down: 0, typing: null });
    yield tween(0.6, u => { teams.open = ease(u); });
    const post = function* (key, name, text, o) {
      o = o || {}; teams.typing = name; yield beat(o.typing || 1.0); teams.typing = null;
      const m = { key, name, text, t0: c.time(), h: o.h || 28, gif: o.gif, emoji: o.emoji, up: 0, down: 0 }; teams.msgs.push(m); c.sfx('blip'); yield beat(o.wait || 1.7); return m;
    };
    const react = (target, seq) => c.spawn((function* () { for (const [kind, w] of seq) { yield c.wait(w); target[kind]++; c.sfx('coin'); } })());
    yield* post('hero', 'Stephan', 'Qui pour Hoki Sushi ce midi ?', { h: 46, typing: 1.3 });
    react(teams, [['up', 0.5], ['up', 0.5], ['down', 0.8], ['up', 0.6], ['down', 0.9], ['up', 0.8], ['down', 0.9], ['up', 0.9]]);     // 5 pouces levés, 3 baissés sur le message de Stephan
    const im = yield* post('imen', 'Imen', 'Cantoche ce midi', { h: 46 });
    react(im, [['up', 0.4], ['up', 0.4], ['up', 0.5], ['up', 0.5]]);
    yield* post('amelie', 'Amélie', '', { gif: 'bebe', h: 62, typing: 0.8 });
    yield* post('danila', 'Danila', 'Oki pour Hoki lol');
    yield* post('justine', 'Justine', '', { emoji: true, h: 40, typing: 0.7 });
    yield* post('sheryna', 'Sheryna', 'Je vais manger un grec avec le M. À tout');
    yield* post('hero', 'Stephan', 'Hoki Sushi réservé, on décolle à 11h57 !', { typing: 1.2, wait: 1.2 });
    hero.typing = false; c.sfx('win');
    yield tween(0.5, u => { teams.open = 1 - ease(u); });
    c.unprop(teams);
    // ---- Sandie gagne la partie ----
    gm.finish = true; while (!gm.done) yield frame1();
    yield c.wait(0.3);
    c.face('olivier', -1);
    yield c.walk('sandie', 892, 230);
    c.pose('sandie', 'cheer'); c.sfx('win'); c.confetti(40);
    const cup = c.prop('coupe', 900, FLOOR_Y - 84, { scale: 1.2, front: true });
    yield c.say('sandie', "Pour une fois que c'est moi qui gagne à un 1, 2, 3 soleil ! Vivement que je gagne une partie de chat !", { mood: 'laugh' });
    c.pose('sandie', 'idle');
    // ---- Stephan soupire et sort en touchant Arno ----
    c.emote('hero', 'Pfff…', 1.8); hero.state = 'idle'; yield c.wait(1.6);
    yield c.walk('hero', c.actors.arno.x - 28, 150);
    c.emote('arno', '!', 1); c.sfx('blip');
    yield c.say('hero', "C'est toi le chat !");
    exit('hero', -100, 170);                              // Stephan repart dans l'autre sens (vers la gauche)
    // Sandie lance sa coupe vers Arno… elle passe largement au-dessus, puis Sandie file dans l'autre sens
    c.face('sandie', -1); c.pose('sandie', 'cheer'); yield c.wait(0.5);
    const cx0 = cup.x, cy0 = cup.y; c.sfx('jump'); c.pose('sandie', 'idle');
    yield tween(1.5, u => { cup.x = lerp(cx0, -90, u); cup.y = lerp(cy0, FLOOR_Y - 150, u) - Math.sin(u * Math.PI) * 210; cup.rot = u * 22; });
    c.unprop(cup); c.emote('sandie', 'Oups !', 1.4); c.emote('arno', 'Raté !', 1.4); yield c.wait(1.0);
    c.face('sandie', 1); exit('sandie', 1100, 240);
    c.face('arno', 1); c.pose('arno', 'idle');
    // ---- la chasse : Bastien et Olivier ----
    yield c.walk('arno', Math.max(c.actors.arno.x + 40, c.actors.bastien.x - 70), 210);
    c.pose('bastien', 'idle'); const bx = c.actors.bastien.x;
    c.sfx('jump'); yield arc('bastien', c.actors.arno.x - 60, FLOOR_Y, 0.6, 90);
    c.pose('bastien', 'cheer'); exit('bastien', -100, 240);
    yield c.say('bastien', "Tu m'auras pas !", { mood: 'laugh' });
    c.face('arno', -1);
    c.sfx('jump'); yield arc('olivier', 860, FLOOR_Y - 34, 0.6, 70);
    c.pose('olivier', 'cheer'); c.face('olivier', -1);
    yield c.say('olivier', "Je suis perché, tu peux pas me toucher !", { mood: 'laugh' });
    c.pose('olivier', 'idle');
    // ---- Coline arrive, choquée ----
    c.add('coline', CHARS.coline, -60, { face: 1, state: 'walk' });
    yield c.walk('coline', 400, 150);
    c.face('coline', 1); c.mood('coline', 'surprised'); c.emote('coline', '?!', 2.4);
    yield c.wait(1.2);
    c.face('arno', -1);
    yield c.walk('arno', 440, 330);
    c.sfx('blip'); c.emote('coline', '!', 1);
    c.mood('coline', undefined);
    yield c.say('arno', "C'est toi le chat !", { mood: 'laugh' });
    // tout le monde file dans une direction ; Olivier descend tranquillement en sifflotant
    c.face('arno', 1); exit('arno', 1100, 300);
    c.face('coline', 1); c.sfx('spring'); exit('coline', 1100, 260);
    yield c.wait(1.6);
    yield arc('olivier', 880, FLOOR_Y, 0.7, 14);
    c.emote('olivier', 'fiu fiu~', 4); c.face('olivier', 1);
    yield c.walk('olivier', 1100, 70);
    // ---- à peine sorti, Olivier revient en courant, poursuivi par Coline et Arno ----
    c.face('olivier', -1); c.pose('olivier', 'walk'); c.emote('olivier', 'AAAH !', 3.5); c.sfx('spring');
    c.add('coline', CHARS.coline, 1200, { face: -1, state: 'walk' }); c.add('arno', CHARS.arno, 1290, { face: -1, state: 'walk' });
    c.spawn((function* () { yield c.walk('olivier', -160, 320); c.remove('olivier'); })());
    c.spawn((function* () { yield c.walk('coline', -160, 308); c.remove('coline'); })());
    c.spawn((function* () { yield c.walk('arno', -160, 300); c.remove('arno'); })());
    yield c.wait(1.5);
    yield c.say('arno', "Reviens ici, on va t'avoir !", { name: 'Coline et Arno', mood: 'angry' });
    while (c.actors.arno) yield frame1();
    yield c.wait(0.4);
    yield c.fade(1, 0.6);
  },
};

function okiTable(c, withSandie) {
  c.prop('table', 480, FLOOR_Y, { color: '#7a4a2a', plates: [-30, 0, 30], front: true });
  diner(c, 'hero', CHARS.hero, 290, 1); if (withSandie !== false) diner(c, 'sandie', CHARS.sandie, 340, 1); diner(c, 'sheryna', CHARS.sheryna, 390, 1);
  diner(c, 'danila', CHARS.danila, 570, -1); diner(c, 'amelie', CHARS.amelie, 620, -1);
}

CUTS.j9_japonais = {
  type: 'cutscene', bg: 'japonais',
  script: function* (c) {
    // les serveurs : Bastien et Olivier en tenue de service (chemise blanche, nœud papillon)
    const SERV = k => Object.assign({}, CHARS[k], { top: '#f6f6f6', bottom: '#1c2230', tie: '#c0392b' });
    const all = ws => ({ update(dt) { ws = ws.filter(w => !w.update(dt)); return ws.length === 0; } });
    const lob = (p, x2, y2, dur, h) => { const x0 = p.x, y0 = p.y; return { t: 0, update(dt) { this.t += dt; const k = Math.min(1, this.t / dur); p.x = lerp(x0, x2, k); p.y = lerp(y0, y2, k) - Math.sin(k * Math.PI) * h; return k >= 1; } }; };
    // marche en portant un objet à la main
    const walkCarry = (k, x2, speed, p) => { const a = c.actors[k]; return { update(dt) { const dx = x2 - a.x, st = speed * dt; if (Math.abs(dx) <= st) { a.x = x2; a.state = 'idle'; } else { a.facing = dx > 0 ? 1 : -1; a.state = 'walk'; a.x += Math.sign(dx) * st; } if (p) { p.x = a.x + a.facing * 14; p.y = a.y - 38; } return Math.abs(x2 - a.x) < 0.5; } }; };
    // roue / saut périlleux : x avance, y décrit un arc, le personnage tourne sur lui-même
    const tumble = (k, x2, dur, turns, h) => { const a = c.actors[k], x0 = a.x; a.state = 'jump'; a.facing = x2 > x0 ? 1 : -1; return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / dur); a.x = lerp(x0, x2, p); a.y = FLOOR_Y - Math.abs(Math.sin(p * Math.PI * turns)) * h; a.rot = p * turns * 6.2832 * a.facing; if (p >= 1) { a.y = FLOOR_Y; a.rot = 0; return true; } return false; } }; };
    const cri = (ks, on) => { for (const k of ks) { c.actors[k].talking = on; c.actors[k].waving = on; } };
    yield c.caption('Hoki Sushi.', 2.2);
    okiTable(c);
    yield c.say('hero', "Alors, tout le monde a choisi ce qu'il veut manger ?");
    const groupe = ['sandie', 'sheryna', 'danila', 'amelie'];
    cri(groupe, true);
    yield c.say('danila', 'OUIIIIIIIII !', { name: 'Tout le monde', mood: 'laugh' });
    cri(groupe, false);
    // Stephan appelle le serveur… et c'est Bastien qui arrive
    c.actors.hero.waving = true;
    yield c.say('hero', "S'il vous plaît ! Serveur !");
    c.add('bastien', SERV('bastien'), 1020, { face: -1, state: 'walk' });
    yield c.walk('bastien', 700, 140);
    c.actors.hero.waving = false;
    yield c.say('bastien', 'Je peux prendre votre commande ?');
    c.emote('hero', '!!', 1.6); c.mood('hero', 'surprised');
    yield c.say('hero', "Bastien ?! Mais qu'est-ce que tu fais là ?!", { mood: 'surprised' });
    c.mood('hero', undefined);
    yield c.say('bastien', "Je bosse ici le mardi midi pour payer un panier et un ballon de basket pour l'équipe.");
    yield c.say('hero', 'Ok…');
    yield c.say('bastien', 'Alors, vous mangez quoi ?');
    yield c.say('danila', 'Un menu B4 et une paire de brochettes Bœuf Fromage.');
    yield c.say('amelie', 'Un menu C4 et deux paires de brochettes Poulet.');
    yield c.say('sheryna', "Je vais vous prendre le Menu Trop Mims avec un maki Saumon, un Figatellu et le jouet, s'il vous plaît.");
    // Bastien avait oublié Stephan…
    yield c.say('hero', "Moi, je prends le Menu Deve 4, comme d'hab.");
    // Sandie doit filer : debout, roue, puis saut périlleux
    yield c.say('sandie', "Changement de programme : j'ai des ECAB à valider, je dois vous laisser en urgence !", { mood: 'surprised' });
    const sa = c.actors.sandie; sa.z = 3; c.pose('sandie', 'idle'); c.face('sandie', -1); c.sfx('jump');
    yield tumble('sandie', 190, 1.1, 2, 46);
    c.sfx('jump'); c.sfx('win');
    yield tumble('sandie', -150, 1.0, 1, 130);
    c.remove('sandie');
    yield c.say('hero', 'Wahou, elle est balèze la Didie !', { mood: 'surprised' });
    yield c.say('bastien', "C'est tout bon, merci.");
    // Olivier arrive avec la pinte de Danila
    const pinte = c.prop('biere', 1020, FLOOR_Y - 38, { lift: 0, scale: 1.15, front: true });
    c.add('olivier', SERV('olivier'), 1020, { face: -1, state: 'walk' });
    yield walkCarry('olivier', 655, 150, pinte);
    c.face('olivier', -1);
    yield c.say('olivier', "Danila, tu as oublié de commander tes pintes ! Mais je te la ramène direct.");
    c.pose('olivier', 'wave'); c.sfx('blip');
    yield lob(pinte, 549, FLOOR_Y - 30, 0.7, 40);          // la pinte atterrit dans la main de Danila (assise), pas sur sa tête
    c.pose('olivier', 'idle'); c.pose('danila', 'cheer'); c.sfx('coin');
    yield c.wait(0.8);
    c.pose('danila', 'sit');
    // les deux serveurs repartent
    yield all([c.walk('bastien', 1130, 140), c.walk('olivier', 1170, 140)]);
    c.remove('bastien'); c.remove('olivier');
    c.face('hero', 1); c.mood('hero', 'sad');
    yield c.say('hero', "Avec les deux gugus, on n'est pas près d'être servis… Je vais nous chercher nos commandes !");
    c.mood('hero', undefined);
    yield c.say(null, "La commande est passée, mais vu les deux zigotos qui sont au service, il faut aller chercher les commandes dans le restaurant.");
  },
};

CUTS.j9_outro = {
  type: 'cutscene', bg: 'japonais',
  script: function* (c) {
    okiTable(c, false);          // Sandie est partie valider ses ECAB
    c.prop('maki', 450, FLOOR_Y - 46, { lift: 0 }); c.prop('sushi', 510, FLOOR_Y - 46, { lift: 0 });
    yield c.say('amelie', 'Ces sushis sont… (mâche) …légendaires.');
    c.pose('danila', 'cheer');
    yield c.say('danila', 'Un toast ! À Stephan et à son appétit !');
    yield c.say('hero', 'À la vôtre. Et gardez-moi la dernière brochette.');
  },
};

CUTS.j7_crise = {
  type: 'cutscene', bg: 'crise',
  script: function* (c) {
    c.add('hero', CHARS.hero, 300, { state: 'idle' });
    c.add('coline', CHARS.coline, 120, { face: 1, state: 'idle' });
    yield c.caption('Mercredi, 10h12. Open space.', 2.4);
    c.sfx('hurt'); c.shake(0.6);
    yield c.say(null, 'Soudain, tous les écrans affichent une tête de mort. Les gyrophares s\'allument.');
    c.add('chef', CHARS.chef, 1020, { face: -1, state: 'walk' });
    c.emote('hero', '!', 1.4);
    yield c.walk('chef', 560, 330);
    c.face('hero', 1); c.emote('chef', '!!', 2);
    yield c.say('chef', 'STEPHAN ! C\'est l\'heure d\'ouvrir une crise !', { mood: 'surprised' });
    // Cécile, Sandie et Olivier traversent la scène
    const carry = (k, x2, speed, p) => { const a = c.actors[k]; return { update(dt) { const dx = x2 - a.x, st = speed * dt; if (Math.abs(dx) <= st) { a.x = x2; a.state = 'idle'; } else { a.facing = dx > 0 ? 1 : -1; a.state = 'walk'; a.x += Math.sign(dx) * st; } if (p) { p.x = a.x + a.facing * 14; p.y = a.y - 40; } return Math.abs(x2 - a.x) < 0.5; } }; };
    const all = ws => ({ update(dt) { ws = ws.filter(w => !w.update(dt)); return ws.length === 0; } });
    const logi = c.prop('logi', 1040, FLOOR_Y - 40, { lift: 0, scale: 1.3, front: true });
    c.add('cecile', CHARS.cecile, 1040, { face: -1, state: 'walk' });
    yield carry('cecile', 760, 130, logi);
    c.face('cecile', -1);
    yield c.say('cecile', "Je vais relire le logigramme de crise, maintenant qu'il est en un seul bout.");
    c.add('sandie', CHARS.sandie, -60, { face: 1, state: 'walk' }); c.mood('sandie', 'sad');
    yield all([carry('cecile', 1130, 130, logi), carry('sandie', 440, 270)]);          // Cécile repart, Sandie arrive en courant, l'air triste
    c.unprop(logi); c.remove('cecile');
    c.face('sandie', 1);
    yield c.say('sandie', "Encore une pluie d'ECAB à gérer…", { mood: 'sad' });
    c.add('olivier', CHARS.olivier, 1040, { face: -1, state: 'walk' });
    yield c.walk('olivier', 660, 150);
    c.face('olivier', -1);
    yield c.say('olivier', "J'ai pas encore les ECAB dans le nouveau Workflow… Il va falloir faire à l'ancienne.");
    // Olivier rigole, Sandie pleure
    c.pose('olivier', 'cheer'); c.mood('olivier', 'laugh'); c.emote('olivier', 'HA', 2.2); c.emote('sandie', 'T_T', 2.2);
    const pleure = dur => ({ t: 0, tt: 0, update(dt) {
      this.t += dt; this.tt += dt; const o = c.actors.olivier, sa = c.actors.sandie;
      o.y = FLOOR_Y - Math.abs(Math.sin(this.t * 18)) * 3; sa.y = FLOOR_Y - Math.abs(Math.sin(this.t * 9)) * 1.5;
      if (this.tt > 0.16) { this.tt = 0; c.burst(sa.x + 6, sa.y - 62, 3, ['#7ad0ff', '#d6efff'], 80); c.sfx('blip'); }
      if (this.t >= dur) { o.y = FLOOR_Y; sa.y = FLOOR_Y; return true; } return false; } });
    yield pleure(2.2);
    c.pose('olivier', 'idle'); c.mood('olivier', undefined);
    // chacun repart de son côté, et la scène continue
    c.face('sandie', -1);
    yield all([carry('sandie', -120, 210), carry('olivier', 1130, 150)]);
    c.remove('sandie'); c.remove('olivier');
    c.face('chef', -1);
    yield c.say('chef', 'Nos serveurs sont tous compromis à cause de la CVE-2026-3569-8569 !', { mood: 'surprised' });
    yield c.say('hero', 'Une crise cyber… à quelques jours de ma retraite. Évidemment.');
    yield c.say('chef', 'Va chercher les membres de la cyber, la mallette de crise et Bastien, puis rejoins-moi en salle Mozart !');
    c.pose('hero', 'wave');
    yield c.say('hero', 'Je m\'en occupe, Chef. Respirez.');
    c.pose('hero', 'idle');
    yield c.say(null, 'Mission : retrouver la cyber, remplir la mallette de crise de papiers, trouver Bastien. Puis salle Mozart.');
  },
};

CUTS.j7_mozart = {
  type: 'cutscene', bg: 'mozart', theme: 'mozart',
  script: function* (c) {
    CRISIS.calm = 0;                                   // graphiques en alerte rouge au début…
    const left = [['boss1', 250], ['boss2', 330], ['boss3', 410]], right = [['boss4', 550], ['boss5', 630], ['boss6', 710]];
    for (const [k, x] of left) seat(c, k, CHARS[k], x, 1, false);
    for (const [k, x] of right) seat(c, k, CHARS[k], x, -1, false);
    c.prop('longtable', 480, FLOOR_Y, { w: 560, front: true });
    c.add('bastien', CHARS.bastien, 480, { y: FLOOR_Y - 42, state: 'cheer' });
    c.add('hero', CHARS.hero, -60, { state: 'walk' });
    yield c.caption('Salle Mozart.', 2);
    yield c.walk('hero', 130, 140);
    c.emote('hero', '?', 1.6);
    yield c.say('hero', 'Bastien ?! Mais qu\'est-ce que tu fais debout sur la table ?');
    yield c.say(null, 'Bastien danse pour résoudre la crise.');
    for (let i = 0; i < 12; i++) { c.face('bastien', i % 2 ? 1 : -1); c.sfx('coin'); for (let q = 1; q <= 4; q++) { CRISIS.calm = (i + q / 4) / 12; yield c.wait(0.085); } }      // …plus Bastien danse, plus les barres descendent et passent au vert
    for (const [k] of left.concat(right)) { c.pose(k, 'idle'); }
    yield c.say('boss1', 'Merci, c\'est tout bon ! On repart travailler.', { name: 'Les chefs' });
    yield [c.walk('boss1', -80, 190), c.walk('boss2', -80, 190), c.walk('boss3', -80, 190), c.walk('boss4', 1040, 190), c.walk('boss5', 1040, 190), c.walk('boss6', 1040, 190)];
    c.actors.bastien.y = FLOOR_Y; c.pose('bastien', 'idle'); c.face('bastien', -1);
    yield c.walk('hero', 330, 140); c.face('hero', 1);
    yield c.say('hero', 'Bastien… comment t\'as géré ça ?');
    yield c.say('bastien', 'J\'applique le nouveau Process présenté au Codir.');
    c.add('hakim', CHARS.hakim, 1020, { face: -1, state: 'walk' });
    yield c.walk('hakim', 700, 200);
    c.face('bastien', 1);
    yield c.say('hakim', 'C\'est bon, j\'ai tout patché avec Génedis !');
    for (const k of ['hero', 'bastien', 'hakim']) c.pose(k, 'cheer');
    c.sfx('win'); c.confetti(90);
    yield c.say('hero', 'VICTOIRE !');
    yield c.say('bastien', 'VICTOIRE !!');
    yield c.say('hakim', 'VICTOIRE !!!');
    c.confetti(80);
    yield c.wait(0.8);
  },
};

CUTS.j5_choix = {
  type: 'cutscene', bg: 'openspace',
  script: function* (c) {
    const lob = (p, x2, y2, dur, h) => { const x0 = p.x, y0 = p.y; return { t: 0, update(dt) { this.t += dt; const k = Math.min(1, this.t / dur); p.x = lerp(x0, x2, k); p.y = lerp(y0, y2, k) - Math.sin(k * Math.PI) * h; return k >= 1; } }; };
    const beat = sec => ({ t: 0, update(dt) { this.t += dt; return this.t >= sec || Input.confirm(); } });          // pause qu'on peut passer avec Entrée
    // à gauche : Coline et Stephan, chacun à son bureau, ils tapent sur leur clavier
    seat(c, 'coline', CHARS.coline, 70, 1, true); seat(c, 'hero', CHARS.hero, 200, 1, true);
    c.actors.coline.typing = true; c.actors.hero.typing = true;
    // à droite : Bastien et Olivier font une partie de pétanque
    c.prop('gravier', 850, FLOOR_Y, { w: 120 }); c.prop('cochonnet', 928, FLOOR_Y - 6, { lift: 0, scale: 1 });
    c.add('bastien', CHARS.bastien, 775, { face: 1 }); c.add('olivier', CHARS.olivier, 845, { face: 1 });
    yield c.caption('Vendredi matin. Open space.', 2.4);
    yield c.say('bastien', 'Tu tires ou tu pointes ?', { name: 'Bastien' });
    const boules = [];
    c.spawn((function* () {                                              // ils lancent leurs boules chacun leur tour, pendant toute la scène
      for (let i = 0; ; i++) {
        const k = i % 2 ? 'olivier' : 'bastien', a = c.actors[k]; c.pose(k, 'wave'); yield c.wait(0.35); c.pose(k, 'idle');
        const b = c.prop('boule', a.x + 14, a.y - 40, { lift: 0, scale: 1.25 }); boules.push(b);
        yield lob(b, 905 + rnd(-32, 26), FLOOR_Y - 8, 0.75, 75); c.sfx('blip');
        if (boules.length > 7) c.unprop(boules.shift());
        yield c.wait(1.0 + Math.random() * 0.9);
      }
    })());
    yield c.wait(1.2);
    // un écran Teams s'affiche en grand au milieu de la scène
    const teams = c.prop('teams', 500, 455, { front: true, open: 0, w: 510, h: 290, msgs: [], up: 0, down: 0, typing: null });
    yield { t: 0, update(dt) { this.t += dt; teams.open = ease(Math.min(1, this.t / 0.6)); return this.t >= 0.6; } };
    const post = function* (key, name, text, o) {
      o = o || {}; teams.typing = name; yield beat(o.typing || 1.0); teams.typing = null;
      teams.msgs.push({ key, name, text, t0: c.time(), h: o.h || 28, gif: o.gif }); c.sfx('blip'); yield beat(o.wait || 1.7);
    };
    yield* post('hero', 'Stephan', "Charlie's ce midi ? Un pouce si vous êtes disponible", { h: 50, typing: 1.4 });
    c.spawn((function* () {                                              // les pouces arrivent au fur et à mesure : 6 vers le haut, 4 vers le bas
      for (const [kind, wait] of [['up', 0.5], ['up', 0.5], ['down', 0.9], ['up', 0.6], ['down', 1.0], ['up', 0.8], ['down', 1.1], ['up', 0.9], ['down', 0.8], ['up', 0.9]]) {
        yield c.wait(wait); teams[kind]++; c.sfx('coin');
      }
    })());
    yield* post('imen', 'Imen', 'Il est 9h Stephan');
    yield* post('cecile', 'Cécile', '', { gif: true, h: 60, typing: 0.8 });
    yield* post('sheryna', 'Sheryna', 'Je vais courir ce midi ! Profitez bien');
    yield* post('danila', 'Danila', "J'ai déjà mangé 2 entrecôtes ce matin, je passe mon tour");
    yield* post('franck', 'Franck', 'On va rollback prepav2 à 12h26, je passe mon tour');
    // Stephan conclut
    yield* post('hero', 'Stephan', 'Ok, je réserve pour 6, départ à 11h55 !', { typing: 1.2, wait: 0.9 });
    c.pose('hero', 'cheer'); c.actors.hero.typing = false; c.sfx('win');
    yield c.say('hero', 'Ok, je réserve pour 6, départ à 11h55 !');
    yield { t: 0, update(dt) { this.t += dt; teams.open = 1 - ease(Math.min(1, this.t / 0.5)); return this.t >= 0.5; } };
    c.unprop(teams); c.pose('hero', 'sit');
    yield c.say(null, "Direction Charlie's, le temple de l'entrecôte.");
    yield c.fade(1, 0.6);
  },
};

function charliesTable(c) {
  c.prop('table', 480, FLOOR_Y, { color: '#f4efe3', check: '#c5362d', plates: [-30, 0, 30], front: true });
  diner(c, 'hero', CHARS.hero, 290, 1); diner(c, 'sandie', CHARS.sandie, 340, 1); diner(c, 'bastien', CHARS.bastien, 390, 1);
  diner(c, 'matthieu', CHARS.matthieu, 570, -1); diner(c, 'olivier', CHARS.olivier, 620, -1); diner(c, 'arno', CHARS.arno, 670, -1);
}

CUTS.backlog_intro = {
  type: 'cutscene', bg: 'openspace',
  script: function* (c) {
    c.prop('ecran', 110, FLOOR_Y);
    c.add('hero', CHARS.hero, 260, { state: 'idle' });
    c.add('bastien', CHARS.bastien, 760, { face: 1 }); c.add('olivier', CHARS.olivier, 890, { face: -1 });
    const ball = c.prop('ballon', 760, FLOOR_Y - 70, { lift: 0, scale: 1.6 });
    // ---- outils de la scène ----
    const frame1 = () => ({ n: 0, update() { return this.n++ >= 1; } });
    const tween = (dur, fn) => ({ t: 0, update(dt) { this.t += dt; const u = Math.min(1, this.t / dur); fn(u); return u >= 1; } });
    const arc = (k, x2, y2, dur, h, rot) => { const a = c.actors[k], x0 = a.x, y0 = a.y; return tween(dur, u => { a.x = lerp(x0, x2, u); a.y = lerp(y0, y2, u) - Math.sin(u * Math.PI) * h; a.rot = (rot || 0) * u; }); };
    const exit = (k, x) => c.spawn((function* () { yield c.walk(k, x, 95); c.remove(k); })());
    // ---- Bastien jongle de la tête en continu dès le début, Olivier compte à voix haute ----
    const jug = { on: true, n: 0 };
    c.spawn((function* () {
      while (jug.on) {
        jug.n++; c.emote('olivier', String(jug.n)); c.sfx('blip');
        for (let k = 0; k <= 12 && jug.on; k++) { ball.x = c.actors.bastien.x + 5; ball.y = FLOOR_Y - 104 - Math.sin(k / 12 * Math.PI) * 58; yield c.wait(0.04); }
      }
    })());
    yield c.caption('Un matin comme les autres. Open space.', 2.4);
    c.add('chef', CHARS.chef, 1020, { face: -1, state: 'walk' });
    yield c.walk('chef', 430, 300);
    c.face('hero', 1); c.emote('chef', '!!', 2);
    yield c.say('chef', 'Stephan ! C\'est le bazar dans le backlog ! Il faut absolument le nettoyer avant ton départ !', { mood: 'surprised' });
    yield c.say('hero', 'Le backlog… C\'est un puit sans fond ! Il va me falloir de l\'aide.');
    yield c.say('chef', 'Va chercher Bastien. Il est derrière, je sais pas ce qu\'il nous a encore inventé celui là.');
    yield c.walk('hero', 620, 170);
    yield c.say('hero', 'Bastien ! Qu\'est-ce que tu fais ?');
    yield c.say('bastien', 'Du sport collectif ! Olivier compte mes jongles, je tente de battre mon record', { mood: 'laugh' });
    yield c.wait(2.2);
    yield c.say('bastien', 'Olivier, attrape !', { mood: 'laugh' });
    jug.on = false; yield c.wait(0.05);
    c.emote('olivier', null);
    yield* kick(c, ball, 890, FLOOR_Y - 70);
    // Olivier encaisse le ballon en pleine tête : il est sonné et s'écroule
    const oli = c.actors.olivier;
    c.pose('olivier', 'hurt'); c.sfx('hurt'); c.shake(0.2); c.emote('olivier', '@@');
    yield tween(0.4, u => { ball.x = lerp(890, 850, u); ball.y = lerp(FLOOR_Y - 70, FLOOR_Y - 18, u * u) - Math.sin(u * Math.PI) * 30; });
    yield c.wait(0.5);
    c.sfx('stomp'); yield tween(0.35, u => { oli.rot = -1.5708 * u; oli.y = FLOOR_Y + 19 * u; });
    c.burst(900, FLOOR_Y, 10, ['#e8e2d4'], 150);
    yield c.say('hero', 'Le backlog a besoin de nous. Viens vite Padawan!');
    c.emote('bastien', '!', 1.2);
    yield c.say('bastien', 'Quoi ? Maintenant ? Mais je dois battre mon record…', { mood: 'surprised' });
    yield [c.walk('hero', 190, 230), c.walk('bastien', 255, 230)];
    c.sfx('spring'); c.shake(0.5);
    yield [c.walk('hero', 120, 160), c.jump('hero', 90), c.walk('bastien', 130, 160), c.jump('bastien', 90)];
    c.remove('hero'); c.remove('bastien'); c.sfx('door'); c.confetti(60);
    yield c.wait(0.8);
    // ---- Olivier se réveille, encore dans les vapes : il prend le chef pour Bastien ----
    yield tween(0.9, u => { oli.rot = -1.5708 * (1 - u) + Math.sin(u * 18) * 0.12 * (1 - u); oli.y = FLOOR_Y + 19 * (1 - u); });
    oli.rot = 0; oli.y = FLOOR_Y; c.pose('olivier', 'idle'); c.face('olivier', -1); c.emote('olivier', '@@', 3);
    yield c.say('olivier', 'Aïe… ma tête… Où est-il ?', { mood: 'surprised' });
    yield c.walk('olivier', 850, 90);
    const hold = { on: true };
    c.spawn((function* () { while (hold.on) { ball.x = oli.x - 18; ball.y = FLOOR_Y - 20; yield frame1(); } })());
    yield c.walk('olivier', 640, 120);
    c.emote('olivier', '!', 1);
    yield c.say('olivier', 'Bastien ! Cette fois, je vais pas te rater !', { mood: 'angry' });
    hold.on = false; c.pose('olivier', 'cheer');
    yield* kick(c, ball, c.actors.chef.x + 6, FLOOR_Y - 92);
    c.unprop(ball); c.sfx('stomp'); c.shake(0.35); c.pose('olivier', 'idle');
    c.emote('chef', 'AAAH !', 2);
    yield c.wait(0.25); c.sfx('jump');
    yield arc('chef', -260, -200, 1.1, 90, -12.566);
    c.remove('chef');
    yield c.wait(0.8);
    // ---- Coline, Imen et Amélie arrivent ----
    c.face('olivier', -1);
    c.add('coline', CHARS.coline, -60, { face: 1, state: 'walk' }); c.add('imen', CHARS.imen, -140, { face: 1, state: 'walk' }); c.add('amelie', CHARS.amelie, -220, { face: 1, state: 'walk' });
    yield [c.walk('coline', 360, 110), c.walk('imen', 280, 110), c.walk('amelie', 200, 110)];
    c.face('coline', 1);
    yield c.say('coline', 'Il avait l\'air pressé, le chef.');
    c.pose('imen', 'cheer'); c.pose('amelie', 'cheer');
    exit('olivier', 1120); c.emote('olivier', 'fiu fiu~', 4);
    yield c.say('imen', 'Hahaha !', { mood: 'laugh' });
    yield c.say('amelie', 'Même pas un bonjour !', { mood: 'laugh' });
    c.pose('imen', 'idle'); c.pose('amelie', 'idle');
    // ---- Sheryna arrive à dos d'escargot ----
    const snail = c.prop('escargot', -110, FLOOR_Y, {});
    c.add('sheryna', CHARS.sheryna, -110, { face: 1, state: 'idle' });
    const sh = c.actors.sheryna; sh.rideOn = snail; sh.rideDy = -52;
    const sn = { on: true };
    sn.v = 70;
    c.spawn((function* () { while (sn.on) { snail.x += sn.v / 60; if (sn.v === 11 && snail.x > 760) sn.v = 0; if (sn.v === 70 && snail.x >= 55) sn.v = 0; yield frame1(); } })());
    yield c.wait(1.6);
    yield c.say('sheryna', 'Vous m\'avez pas attendue ! Je suis restée coincée dans le tourniquet avec mon nouveau moyen de locomotion…', { mood: 'sad' });
    yield c.say('coline', 'On avance, on a du retard !');
    exit('coline', 1120); exit('imen', 1180); exit('amelie', 1240);
    sn.v = 11;                                    // Sheryna suit les filles dès qu'elles partent (très lentement)
    yield c.wait(6);
    // ---- Franck et Cécile arrivent de l'autre côté (par la gauche) ----
    c.add('franck', CHARS.franck, -60, { face: 1, state: 'walk' }); c.add('cecile', CHARS.cecile, -140, { face: 1, state: 'walk' });
    yield [c.walk('franck', 150, 110), c.walk('cecile', 60, 110)];
    yield c.say('franck', 'Passe devant, Cécile, je te suis.');
    c.spawn((function* () {
      yield c.wait(0.5); c.emote('franck', 'chut', 2); c.face('franck', -1); yield c.wait(0.6);
      c.sfx('spring'); yield [c.walk('franck', 120, 150), c.jump('franck', 90)];
      c.remove('franck'); c.sfx('door');
    })());
    yield c.walk('cecile', 460, 100);
    yield c.wait(1);
    // ---- Cécile se retourne : plus de Franck ----
    c.face('cecile', -1);
    yield c.say('cecile', 'Franck, c\'est le 100ᵉ ou le 1000ᵉ rollback de prépa v2 prévu cet après-midi ?');
    c.emote('cecile', '?', 1.6); yield c.wait(0.8); c.face('cecile', 1); yield c.wait(0.7); c.face('cecile', -1); yield c.wait(0.6);
    yield c.say('cecile', 'Franck ? … Ils ont dû avancer le rollback.');
    // ---- seule dans le bureau : séance de muscu ----
    c.face('cecile', 1);
    const halt = c.prop('haltere', 350, FLOOR_Y - 50, { front: true });
    const ce = c.actors.cecile; let up = false, u = 0;
    const mus = { on: true, reps: 0 };
    c.spawn((function* () {
      while (mus.on) {
        u += 1 / 60; const k = (1 - Math.cos(u * 4)) / 2;
        halt.x = ce.x + 18; halt.y = FLOOR_Y - 40 - k * 56;
        if (k > 0.85 && !up) { up = true; mus.reps++; c.pose('cecile', 'cheer'); c.sfx('blip'); c.emote('cecile', String(mus.reps), 1.2); } else if (k < 0.2 && up) { up = false; c.pose('cecile', 'idle'); }
        yield frame1();
      }
    })());
    while (mus.reps < 6) yield frame1();            // 6 répétitions complètes
    yield c.wait(0.8);
    mus.on = false; c.unprop(halt); c.pose('cecile', 'idle'); c.emote('cecile', null);
    // ---- elle saute sur l'escargot de Sheryna ----
    c.emote('cecile', '!', 1);
    yield c.walk('cecile', Math.max(60, snail.x - 70), 140);
    c.face('cecile', 1); c.sfx('jump');
    yield arc('cecile', snail.x - 20, FLOOR_Y - 40, 0.55, 60, 0);
    ce.rideOn = snail; ce.rideDx = -24; ce.rideDy = -44; sh.rideDx = 12;
    c.sfx('stomp'); c.shake(0.2); c.pose('cecile', 'cheer');
    yield c.say('cecile', 'Allez, au café ! Yihaaa !', { mood: 'laugh' });
    c.sfx('win'); c.confetti(40); sn.v = 110;
    yield c.wait(3.2);
    yield c.fade(1, 0.8);
  },
};

CUTS.backlog_franck = {
  type: 'cutscene', bg: 'circuit', theme: 'circuit',
  script: function* (c) {
    c.add('hero', CHARS.hero, 220, { face: 1, state: 'cheer' }); c.add('bastien', CHARS.bastien, 150, { face: 1, state: 'cheer' });
    yield c.caption('Les tickets sont réunis.', 2);
    c.pose('hero', 'idle'); c.pose('bastien', 'idle');
    c.add('franck', CHARS.franck, 860, { face: -1, y: FLOOR_Y - 36 }); c.prop('scene', 865, FLOOR_Y, { w: 130 });
    c.confetti(30); c.sfx('pop');
    yield c.say('franck', 'Bravo pour le rangement… mais vous croyez que c\'est fini ?');
    yield c.say('franck', 'Voici les tickets HDR ! Attrapez-les si vous pouvez !');
    c.emote('hero', '!', 1.4);
    yield c.say('hero', 'Bastien, les balais !');
    c.prop('balai', 258, FLOOR_Y); c.prop('balai', 188, FLOOR_Y);
    yield c.say('bastien', 'Je préfère le ballon, mais bon…');
    yield c.say(null, 'Balayez les tickets HDR avec Entrée ou E. Si 4 tickets vous touchent, on recommence !');
  },
};

CUTS.backlog_fin = {
  type: 'cutscene', bg: 'openspace',
  script: function* (c) {
    c.add('hero', CHARS.hero, 300, { face: 1 }); c.add('bastien', CHARS.bastien, 230, { face: 1 });
    c.add('chef', CHARS.chef, 640, { face: -1 }); c.add('franck', CHARS.franck, 740, { face: -1 });
    c.confetti(60);
    yield c.say('franck', 'Bon… le backlog est propre. Je rends les armes.');
    yield c.say('chef', 'Enfin un backlog à jour ! Merci Stephan et Bastien.');
    c.pose('bastien', 'cheer');
    yield c.say('bastien', 'Et maintenant, je peux retourner jouer ?');
    c.pose('bastien', 'idle');
    yield c.say('hero', 'Après ça, tu l\'as bien mérité petit Padawan.');
  },
};

CUTS.j5_charlies = {
  type: 'cutscene', bg: 'charlies',
  script: function* (c) {
    yield c.caption('Charlie\'s, le temple de l\'entrecôte.', 2.8);
    charliesTable(c);
    yield c.say('sandie', 'Six entrecôtes, frites à volonté. Je valide le changement de menu : c\'est un changement standard.');
    yield c.say('arno', 'Je propose qu\'on planifie ça en sprint : entrée, plat, dessert. Trois itérations.');
    yield c.say('matthieu', 'Le train de l\'entrecôte part à 12h30. Tout le monde à bord !');
    yield c.say('olivier', 'Je note : aucun écart au référentiel SPICE ce midi. Et aucun écart de cuisson, j\'espère.');
    c.emote('bastien', '!', 1.2);
    yield c.say('bastien', 'Si quelqu\'un ouvre une crise pendant le repas, je ne réponds pas.');
    c.emote('hero', '♥', 1.5);
    yield c.say('hero', 'Mes derniers Charlie\'s avec vous… Ça se fête avec une double entrecôte !');
    yield c.say(null, 'Les serveurs courent partout. Il faut aller chercher les entrecôtes et les frites soi-même !');
  },
};

CUTS.j5_outro = {
  type: 'cutscene', bg: 'charlies',
  script: function* (c) {
    charliesTable(c);
    c.prop('entrecote', 450, FLOOR_Y - 46, { lift: 0 }); c.prop('frites', 510, FLOOR_Y - 46, { lift: 0 });
    yield c.say('bastien', 'Cette entrecôte est… (mâche) …une résolution définitive.');
    yield c.say('arno', 'Sprint review : démo réussie, plus personne n\'a faim.');
    yield c.say('matthieu', 'Terminus, tout le monde descend. Direction la crème brûlée !');
    c.pose('sandie', 'cheer');
    yield c.say('sandie', 'Un toast ! À Stephan !');
    yield c.say('olivier', 'Aucun écart constaté. Je coche.');
    yield c.say('hero', 'À vous tous ! Et gardez-moi les frites.');
  },
};

CUTS.j3_pi_intro = {
  type: 'cutscene', bg: 'openspace',
  script: function* (c) {
    c.prop('desk', 740, FLOOR_Y); c.prop('tascarottes', 740, FLOOR_Y - 34);
    c.prop('panier', 915, FLOOR_Y - 28);
    c.add('coline', CHARS.coline, 420, { face: 1 }); c.add('amelie', CHARS.amelie, 520, { face: -1 });
    c.add('hero', CHARS.hero, -60, { state: 'walk' });
    // dans le fond : Bastien et Olivier jouent au basket (z < 0 et pieds plus haut = plus loin)
    const BY = FLOOR_Y - 28, hand = k => ({ x: c.actors[k].x + c.actors[k].facing * 13, y: BY - 46 });
    c.add('bastien', CHARS.bastien, 650, { y: BY, face: 1, z: -1 }); c.add('olivier', CHARS.olivier, 820, { y: BY, face: -1, z: -1 });
    const ball = c.prop('basket', 663, BY - 46, { front: true, scale: 1.3, lift: 0 });
    const lob = (x2, y2, dur, h) => { const x0 = ball.x, y0 = ball.y; return { t: 0, update(dt) { this.t += dt; const k = Math.min(1, this.t / dur); ball.x = lerp(x0, x2, k); ball.y = lerp(y0, y2, k) - Math.sin(k * Math.PI) * h; ball.rot = (ball.rot || 0) + dt * 9; return k >= 1; } }; };
    const fly = (k, x2, dur) => { const a = c.actors[k], x0 = a.x, y0 = a.y; a.state = 'hurt'; return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / dur); a.x = lerp(x0, x2, p); a.y = y0 - Math.sin(p * Math.PI) * 130; a.rot = p * 11; return p >= 1; } }; };
    const all = ws => ({ update(dt) { ws = ws.filter(w => !w.update(dt)); return ws.length === 0; } });
    const run = g => { let w = null; return { update(dt) { for (let n = 0; n < 50; n++) { if (!w) { const r = g.next(); if (r.done) return true; w = r.value; } if (!w.update(dt)) return false; w = null; dt = 0; } return false; } }; };
    const passes = function* () { for (let i = 0; i < 3; i++) { const to = hand(i % 2 ? 'bastien' : 'olivier'); c.sfx('blip'); yield lob(to.x, to.y, 0.8, 70); } };
    yield [c.caption('De bon matin. Open space.', 2.4), run(passes())];
    // un tir un peu trop haut… le ballon retombe sur la tête d'Amélie
    c.sfx('jump'); yield lob(520, FLOOR_Y - 92, 1.3, 270);
    c.sfx('hurt'); c.shake(0.25); c.pose('amelie', 'hurt'); c.mood('amelie', 'surprised'); c.emote('amelie', '*', 1);
    yield lob(585, FLOOR_Y - 12, 0.55, 60);
    yield c.say('amelie', 'Ouille !', { mood: 'surprised' });
    c.pose('amelie', 'idle'); c.mood('amelie', undefined);
    c.mood('bastien', 'surprised'); c.mood('olivier', 'surprised'); c.actors.olivier.talking = true;
    yield c.say('bastien', 'ALERTE GÉNÉRALE !', { name: 'Bastien et Olivier', mood: 'surprised' });
    c.actors.olivier.talking = false;
    // Amélie ramasse le ballon, hurle, et le renvoie sur les deux joueurs : ils sortent de l'écran
    yield c.walk('amelie', 572, 150); c.face('amelie', 1);
    ball.x = 586; ball.y = FLOOR_Y - 46; c.pose('amelie', 'cheer'); c.mood('amelie', 'angry');
    yield c.say('amelie', 'AAAAAAAAH !!!', { mood: 'angry' });
    c.pose('amelie', 'idle'); c.face('amelie', 1);
    c.sfx('jump'); yield lob(645, BY - 48, 0.5, 20);
    c.sfx('stomp'); c.shake(0.3); c.sfx('hurt');
    const o = hand('olivier');
    yield [fly('bastien', 1130, 1.1), run((function* () { yield lob(o.x - 10, o.y, 0.25, 20); c.sfx('stomp'); yield all([fly('olivier', 1180, 1.1), lob(980, FLOOR_Y - 12, 1.0, 110)]); })())];
    c.remove('bastien'); c.remove('olivier'); c.unprop(ball);
    c.mood('amelie', undefined); c.mood('coline', undefined);
    c.emote('coline', '!!', 6); c.emote('amelie', '!!', 6);
    yield [c.walk('coline', 330, 230), c.walk('amelie', 610, 230)];
    yield [c.walk('coline', 470, 230), c.walk('amelie', 560, 230)];
    yield c.walk('hero', 200, 130);
    c.face('coline', -1); c.face('amelie', -1);
    yield c.say('hero', 'Coline ? Amélie ? Qu\'est-ce qui se passe ?');
    c.face('coline', 1); c.face('amelie', 1);
    yield c.say('coline', 'Stephan ! On a peur pour Matthieu !');
    c.cam(0, 0.1);
    yield c.say('amelie', 'Regarde son bureau… Il y a un tas de carottes !');
    yield c.wait(0.8);
    yield c.say('amelie', 'Il prépare déjà Pâques ! Et il a mis des chocolats partout dans l\'open space.');
    yield c.say('coline', 'Et il a disparu. Le dernier PI commence tout à l\'heure…');
    c.pose('hero', 'wave');
    yield c.say('hero', 'Pas de panique. Je ramasse les carottes, je trouve les chocolats, et je retrouve Matthieu.');
    c.pose('hero', 'idle');
    yield c.say(null, 'Mission : carottes, chocolats, et Matthieu (déguisé en lapin !) à ramener en salle PI.');
  },
};

CUTS.j3_pi_salle = {
  type: 'cutscene', bg: 'pi', theme: 'pi',
  script: function* (c) {
    c.prop('scene', 640, FLOOR_Y, { w: 700 });
    const foule = c.prop('foule', 0, 0, { front: true });
    c.add('coline', CHARS.coline, 120, { face: 1 }); c.add('amelie', CHARS.amelie, 200, { face: 1 });
    c.add('cecile', CHARS.cecile, 520, { y: FLOOR_Y - 30, face: -1 });
    yield c.caption('Salle PI. Le dernier PI.', 2.2);
    c.emote('coline', '>:(', 5); c.emote('amelie', '>:(', 5);
    yield c.say('coline', 'Matthieu n\'est toujours pas là ! Il est censé ouvrir le PI !', { mood: 'angry' });
    yield c.say('amelie', 'Un RTE absent le jour du PI… C\'est inadmissible !', { mood: 'angry' });
    c.pose('cecile', 'wave');
    yield c.say('cecile', 'Bonjour à tous, et bienvenue à ce dernier PI ! Voici les livraisons du trimestre.');
    c.pose('cecile', 'idle');
    yield c.caption('Livraison n°1 : le logigramme géant, enfin en un seul morceau.', 2.6);
    yield c.caption('Livraison n°2 : la crise cyber, résolue avec un déhanché.', 2.6);
    yield c.caption('Livraison n°3 : une valise, enfin refermée.', 2.6);
    // Franck rejoint Cécile sur scène, annonce les rollbacks et salue la foule en délire
    c.add('franck', CHARS.franck, 1040, { y: FLOOR_Y - 30, face: -1, state: 'walk' });
    yield c.walk('franck', 600, 130);
    c.face('franck', -1);
    yield c.say('franck', "Sur ce PI, on prévoit seulement 9 rollbacks de prepa v2.");
    foule.cheer = true; c.sfx('win'); c.pose('franck', 'wave'); c.pose('cecile', 'wave');
    yield c.say('franck', 'Bonne journée à tous !');
    c.pose('franck', 'idle'); c.pose('cecile', 'idle'); foule.cheer = false;
    yield c.walk('franck', 1130, 150);
    c.remove('franck');
    c.add('hero', CHARS.hero, -60, { state: 'walk' }); c.add('lapin', CHARS.lapin, -140, { state: 'walk' });
    yield [c.walk('hero', 300, 170), c.walk('lapin', 230, 170)];
    yield c.say('hero', 'Voilà, on l\'a ramené !');
    c.actors.lapin.y = FLOOR_Y - 30; c.actors.lapin.x = 400; c.sfx('jump'); c.face('lapin', 1);
    yield c.walk('lapin', 650, 120);
    c.face('cecile', 1); c.face('lapin', -1);
    yield c.say('lapin', 'Désolé pour mon retard…');
    c.prop('carotte', 678, FLOOR_Y - 62, { scale: 1.5, lift: 0 });
    c.sfx('pop'); c.emote('lapin', '*CROC*', 1.6);
    yield c.wait(1.2);
    foule.cheer = true; c.sfx('win'); c.confetti(80);
    yield c.say('lapin', 'Le PI est dorénavant ouvert !');
    c.pose('coline', 'cheer'); c.pose('amelie', 'cheer'); c.pose('cecile', 'cheer'); c.pose('hero', 'cheer');
    c.confetti(100); c.rain(100);
    yield c.wait(1.2);
    // ---- le totem d'honneur ----
    const SY = FLOOR_Y - 30;                                              // hauteur de la scène
    const frame1 = () => ({ n: 0, update() { return this.n++ >= 1; } });
    const arc = (k, x2, y2, dur, h, rot) => { const a = c.actors[k], x0 = a.x, y0 = a.y; return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / dur); a.x = lerp(x0, x2, p); a.y = lerp(y0, y2, p) - Math.sin(p * Math.PI) * h; a.rot = (rot || 0) * p; return p >= 1; } }; };
    const lobP = (p, x2, y2, dur, h) => { const x0 = p.x, y0 = p.y; return { t: 0, update(dt) { this.t += dt; const k = Math.min(1, this.t / dur); p.x = lerp(x0, x2, k); p.y = lerp(y0, y2, k) - Math.sin(k * Math.PI) * h; return k >= 1; } }; };
    const all = ws => ({ update(dt) { ws = ws.filter(w => !w.update(dt)); return ws.length === 0; } });
    const follow = (p, k, dx, dy) => { const h = { on: true }; c.spawn((function* () { while (h.on) { const a = c.actors[k]; p.x = a.x + dx; p.y = a.y + dy; yield frame1(); } })()); return h; };
    for (const k of ['coline', 'amelie', 'cecile', 'hero', 'lapin']) c.pose(k, 'idle');
    // Coline monte sur scène
    yield c.walk('coline', 255, 150);
    c.sfx('jump'); yield arc('coline', 330, SY, 0.55, 40, 0);
    yield c.walk('coline', 470, 130); c.face('coline', -1);
    yield c.say('coline', "Et c'est le dernier PI avec Stephan ! Pour l'occasion, je vais lui remettre un Totem d'honneur.");
    // Stephan monte sur scène en faisant un salto
    c.face('hero', 1); c.sfx('jump');
    yield arc('hero', 380, SY, 0.95, 100, -6.2832 * 1);
    c.actors.hero.rot = 0; c.actors.hero.state = 'idle'; c.sfx('stomp'); c.shake(0.2); c.face('hero', 1);
    const totem = c.prop('totem', 462, SY - 46, { lift: 0, scale: 1.25, front: true });
    c.face('coline', -1);
    const hc = follow(totem, 'coline', -14, -46);
    yield c.say('coline', "Stephan, voici le totem de l'incident manager en chef !");
    hc.on = false; c.sfx('blip');
    yield lobP(totem, 394, SY - 48, 0.5, 30);
    const ht = follow(totem, 'hero', 14, -46);
    // Stephan lève fièrement le totem
    c.pose('hero', 'cheer'); c.sfx('win'); c.confetti(40);
    ht.on = false; const hup = follow(totem, 'hero', 6, -128);
    yield c.wait(1.2);
    // Bastien arrive d'un côté, Olivier de l'autre
    c.add('bastien', CHARS.bastien, -60, { face: 1, state: 'walk' });
    c.add('olivier', CHARS.olivier, 1040, { y: SY, face: -1, state: 'walk' });
    yield all([c.walk('bastien', 255, 300), c.walk('olivier', 440, 300)]);
    c.sfx('jump'); yield arc('bastien', 345, SY, 0.5, 40, 0);
    yield c.walk('olivier', 410, 140); c.face('bastien', 1); c.face('olivier', -1); c.actors.hero.z = 3;
    yield c.say('bastien', 'Steph ! Steph ! Steph !', { name: 'Bastien et Olivier', mood: 'laugh' });
    // ils le portent en triomphe : on le monte, on le descend, en boucle
    const BASE = SY - 52;
    c.pose('bastien', 'cheer'); c.pose('olivier', 'cheer');
    const hero = c.actors.hero, bas = c.actors.bastien, oli = c.actors.olivier;
    hero.y = BASE; hero.x = 378; bas.x = 352; oli.x = 408; hup.on = false; const hu2 = follow(totem, 'hero', 6, -128);
    const lift = (dur, from, to, sb) => ({ t: 0, update(dt) { this.t += dt; const k = ease(Math.min(1, this.t / dur)); hero.y = BASE - lerp(from, to, k); bas.y = oli.y = SY - sb * Math.sin(k * Math.PI) * 6; return this.t >= dur; } });
    for (let i = 0; i < 4; i++) {
      c.sfx('jump'); c.emote('bastien', 'STEPH !', 0.8); c.emote('olivier', 'STEPH !', 0.8);
      yield lift(0.42 - i * 0.03, 0, 40, 1);
      yield lift(0.42 - i * 0.03, 40, 0, 1);
    }
    // … et soudain, ils le jettent en l'air : Stephan s'écrase dans l'écran du fond
    c.sfx('jump'); hu2.on = false; const hu3 = follow(totem, 'hero', 6, -128);
    yield arc('hero', 480, 200, 0.85, 50, 12.566);
    hu3.on = false; c.shake(0.5); c.sfx('hurt'); c.sfx('stomp');
    c.prop('vitrecassee', 480, 150, { r: 52 });
    c.burst(480, 150, 40, ['#d9ecff', '#ffffff', '#8fa6ff'], 380);
    hero.rot = 0.22; hero.state = 'hurt'; c.mood('hero', 'surprised'); hero.talking = false;
    yield lobP(totem, 438, SY - 14, 0.7, 25);
    yield c.wait(0.6);
    // Bastien et Olivier : oups, puis ils s'envolent
    c.pose('bastien', 'idle'); c.pose('olivier', 'idle'); c.face('bastien', -1); c.face('olivier', -1);
    c.emote('bastien', '!', 1.2); c.emote('olivier', '!', 1.2);
    yield c.say('bastien', 'Oups !', { name: 'Bastien et Olivier', mood: 'surprised' });
    c.pose('bastien', 'jump'); c.pose('olivier', 'jump');
    yield c.say('bastien', 'À plus tard tout le monde !', { name: 'Bastien et Olivier', mood: 'laugh' });
    c.sfx('jump');
    yield all([arc('bastien', -220, -170, 1.3, 40, -0.7), arc('olivier', 1180, -170, 1.3, 40, 0.7)]);
    c.remove('bastien'); c.remove('olivier');
    // Coline, morte de honte… et Stephan retombe de l'écran
    c.mood('coline', 'sad'); c.emote('coline', '...', 2.4);
    yield c.say('coline', 'Bon… continuons.', { mood: 'sad' });
    c.mood('coline', undefined);
    c.sfx('hurt');
    yield arc('hero', 392, SY + 19, 0.55, 0, 0);
    hero.rot = -1.5708; hero.state = 'hurt'; hero.y = SY + 19; c.sfx('stomp'); c.shake(0.3); c.burst(392, SY, 10, ['#e8e2d4'], 150);
    yield c.wait(2.4);
  },
};

function* gallop(c, k, horse, x1, dur) {                       // le cavalier et sa monture filent vers x1
  const a = c.actors[k], x0 = a.x, n = Math.ceil(dur / 0.04);
  for (let i = 1; i <= n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, bob = Math.abs(Math.sin(i * 0.9)) * 8; a.x = x - 6; a.y = FLOOR_Y - 38 - bob; horse.x = x; horse.y = FLOOR_Y - bob; yield c.wait(0.04); }
}
const FETE_GUESTS = [['coline', 40], ['amelie', 95], ['sheryna', 150], ['youssef', 205], ['imen', 260], ['cecile', 315], ['franck', 370], ['danila', 425],
  ['hakim', 535], ['matthieu', 590], ['arno', 645], ['justine', 700], ['sandie', 755], ['bastien', 810], ['olivier', 865], ['chef', 920]];

CUTS.fete_intro = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    c.prop('banner', 480, 40, { w: 560 }); c.prop('wc', 505, FLOOR_Y);
    // ---- outils ----
    const X = {}; for (const [k, x] of FETE_GUESTS) X[k] = x;
    const frame1 = () => ({ n: 0, update() { return this.n++ >= 1; } });
    const tween = (dur, fn) => ({ t: 0, update(dt) { this.t += dt; const u = Math.min(1, this.t / dur); fn(u); return u >= 1; } });
    const arc = (k, x2, y2, dur, h, rot) => { const a = c.actors[k], x0 = a.x, y0 = a.y; return tween(dur, u => { a.x = lerp(x0, x2, u); a.y = lerp(y0, y2, u) - Math.sin(u * Math.PI) * h; a.rot = (rot || 0) * u; }); };
    const enter = (k) => { const l = X[k] < 480; c.add(k, CHARS[k], l ? -70 : 1030, { face: l ? 1 : -1, state: 'walk' }); return c.walk(k, X[k], 150); };
    const arrive = function* (k, text) { yield enter(k); c.face(k, X[k] < 480 ? 1 : -1); if (text) yield c.say(k, text); };
    // ---- Bastien et Olivier jouent aux billes en rigolant ----
    c.prop('billes', 838, FLOOR_Y, {});
    c.add('bastien', CHARS.bastien, 810, { face: 1 }); c.add('olivier', CHARS.olivier, 865, { face: -1 });
    const play = { on: true };
    const bille = c.prop('bille', 822, FLOOR_Y, { r: 6, c: '#e8433a' });
    c.spawn((function* () {
      let from = 'bastien';
      while (play.on) {
        const x0 = from === 'bastien' ? 822 : 856, x1 = from === 'bastien' ? 856 : 822, other = from === 'bastien' ? 'olivier' : 'bastien';
        bille.x = x0; yield tween(0.55, u => { bille.x = lerp(x0, x1, u); bille.ang = u * 14; });
        c.pose(other, 'cheer'); c.emote(other, from === 'bastien' ? 'hihi' : 'hahaha', 1); c.sfx('blip');
        yield c.wait(0.7); c.pose(other, 'idle'); from = other;
      }
    })());
    yield c.caption('Jour J. Le bar.', 2.2);
    yield c.wait(2.4);
    // ---- Stephan arrive ----
    c.add('hero', CHARS.hero, -60, { face: 1, state: 'walk' });
    yield c.walk('hero', 690, 130);
    c.pose('hero', 'wave'); c.face('bastien', -1); c.face('olivier', -1);
    yield c.say('hero', 'Coucou les petits loups !');
    c.pose('hero', 'idle');
    yield c.walk('hero', 765, 120);
    play.on = false; c.unprop(bille);
    const bat = c.prop('batte', 779, FLOOR_Y - 40, { front: true, rot: -0.5 }); c.sfx('pop');
    yield c.say('hero', 'Je peux jouer avec vous ?');
    c.emote('bastien', '?', 1.4); c.emote('olivier', '?', 1.4);
    yield c.wait(0.9);
    yield tween(0.45, u => { bat.rot = -0.5 - u * 0.5; });
    c.sfx('jump'); yield tween(0.18, u => { bat.rot = -1 + u * 3; });
    c.sfx('stomp'); c.shake(0.5); c.burst(815, FLOOR_Y - 60, 30, ['#ffd23f', '#ffffff', '#ff8a3f'], 380);
    c.burst(838, FLOOR_Y - 8, 36, ['#e8433a', '#2f7fd1', '#f2c230', '#3aa65a', '#b04ad1'], 320);
    c.pose('hero', 'cheer'); c.pose('bastien', 'hurt'); c.pose('olivier', 'hurt');
    c.emote('bastien', 'OUILLE', 0); c.emote('olivier', 'AÏE', 0); c.sfx('hurt');
    yield [arc('bastien', 1150, -220, 1.2, 60, 9), arc('olivier', 1280, -260, 1.4, 70, -9)];
    c.remove('bastien'); c.remove('olivier'); c.unprop(bat);
    yield c.wait(0.4); c.pose('hero', 'idle');
    yield c.say('hero', 'Hihi… Je crois que j\'ai encore un peu de force !', { mood: 'laugh' });
    // ils reviennent en courant et en rigolant
    c.add('bastien', CHARS.bastien, 1040, { face: -1, state: 'walk' }); c.add('olivier', CHARS.olivier, 1110, { face: -1, state: 'walk' });
    c.emote('bastien', 'OUILLE', 0); c.emote('olivier', 'AÏE', 0);
    yield [c.walk('bastien', 810, 330), c.walk('olivier', 865, 330)];
    c.face('bastien', -1); c.face('olivier', -1); c.pose('bastien', 'cheer'); c.pose('olivier', 'cheer');
    yield c.say('olivier', 'Il a de la force, papi !', { mood: 'laugh' });
    yield c.say('bastien', 'M\'en parle pas…', { mood: 'laugh' });
    c.emote('bastien', null); c.emote('olivier', null); c.pose('hero', 'idle'); c.pose('bastien', 'idle'); c.pose('olivier', 'idle');
    yield c.walk('hero', 480, 150);
    c.confetti(60); c.pose('hero', 'wave');
    // ---- chacun arrive et dit sa phrase gentille ----
    yield* arrive('coline', 'Merci pour ton calme dans les moments difficiles, Stephan.');
    yield* arrive('youssef', 'Avec toi, aucune configuration n\'a jamais été un problème.');
    yield* arrive('cecile', 'Tes conseils valent de l\'or, et ton humour aussi.');
    c.add('danila', CHARS.danila, -70, { face: 1, state: 'walk' });
    c.spawn((function* () { yield c.walk('danila', X.danila, 150); })());
    yield* arrive('franck', 'Un vrai pilier de l\'équipe. Tu vas nous manquer.');
    yield* arrive('hakim', 'Tu m\'as toujours soutenu, même quand l\'IA faisait des siennes.');
    yield* arrive('matthieu', 'Merci d\'avoir toujours gardé le train sur les rails !');
    yield* arrive('arno', 'Tu es la meilleure itération de toute l\'équipe.');
    yield* arrive('justine', 'Tu as toujours été là pour nous, avec bienveillance.');
    // ---- Sheryna arrive du ciel en parachute ----
    c.add('sheryna', CHARS.sheryna, X.sheryna, { face: 1, state: 'idle' });
    const chute = c.prop('parachute', X.sheryna, 230, {});
    const sh = c.actors.sheryna; sh.rideOn = chute; sh.rideDx = 0; sh.rideDy = 0;
    const down = { done: false };
    c.spawn((function* () { yield tween(3.4, u => { chute.y = lerp(230, FLOOR_Y, u); chute.x = X.sheryna + Math.sin(u * 9) * 26 * (1 - u); }); down.done = true; })());
    yield c.say('sheryna', 'J\'arriiiiive !', { mood: 'laugh' });
    while (!down.done) yield frame1();
    sh.rideOn = null; sh.y = FLOOR_Y; sh.x = X.sheryna; c.unprop(chute);
    c.sfx('stomp'); c.burst(X.sheryna, FLOOR_Y, 12, ['#e8e2d4'], 160);
    yield c.say('sheryna', 'Pile à l\'heure !', { mood: 'laugh' });
    yield c.say('sheryna', 'Avec toi, tout finit par s\'arranger. C\'est un super don.');
    // ---- Sandie arrive en Twingo avec Imen et Amélie ----
    const car = c.prop('twingo', -170, FLOOR_Y - 6, { moving: true, front: true, col: '#3aa65a' });
    c.add('sandie', CHARS.sandie, -170, { face: 1, state: 'sit' }); c.add('imen', CHARS.imen, -170, { face: 1, state: 'sit' }); c.add('amelie', CHARS.amelie, -170, { face: 1, state: 'sit' });
    const sit = (k, dx) => { const a = c.actors[k]; a.rideOn = car; a.rideDx = dx; a.rideDy = -12; a.z = 1; };
    sit('sandie', 24); sit('imen', -8); sit('amelie', -38);
    c.sfx('spring'); yield tween(2.2, u => { car.x = lerp(-170, 330, 1 - (1 - u) * (1 - u)); });
    car.moving = false; c.sfx('blip');
    yield c.say('sandie', 'Livraison de futures mamans !', { mood: 'laugh' });
    for (const k of ['imen', 'amelie']) {
      const a = c.actors[k]; a.rideOn = null; a.state = 'idle'; c.sfx('jump');
      yield arc(k, X[k], FLOOR_Y, 0.6, 50); a.y = FLOOR_Y; a.z = 0;
      yield c.say(k, k === 'imen' ? 'Tu as géré chaque projet avec le sourire.' : 'Tu as toujours le mot pour nous remonter le moral.');
    }
    yield c.say('sandie', 'Je vais me garer !');
    car.moving = true; c.sfx('spring'); yield tween(2.4, u => { car.x = lerp(330, 1300, u * u); });
    c.remove('sandie'); c.unprop(car);
    yield c.wait(1.6);
    // ---- elle revient : pause technique aux toilettes ----
    c.add('sandie', CHARS.sandie, 1060, { face: -1, state: 'walk' });
    const sa = c.actors.sandie;
    yield c.walk('sandie', 650, 200);
    c.emote('sandie', '!', 1.4);
    yield c.say('sandie', 'Oups… pause technique !', { mood: 'surprised' });
    yield c.walk('sandie', 508, 230);
    c.sfx('door'); c.remove('sandie');
    yield c.wait(1.8);
    c.add('sandie', CHARS.sandie, 508, { face: 1 }); c.sfx('door');
    yield c.say('sandie', 'Ah, ça fait du bien !', { mood: 'laugh' });
    yield c.walk('sandie', X.sandie, 150); c.face('sandie', -1);
    yield c.say('sandie', 'Tu as changé nos habitudes… en mieux !');
    // ---- puis le chef, Bastien et Olivier ----
    yield* arrive('chef', 'Quinze ans de bons et loyaux services. Tu as été un collègue précieux.');
    c.face('bastien', -1); c.face('olivier', -1);
    yield c.say('bastien', 'Un mentor et un ami, Stephan. Merci pour tout.');
    yield c.say('olivier', 'Avec toi, tout est toujours conforme… à la bonne humeur.');
    c.pose('hero', 'idle'); c.emote('hero', '♥', 2);
    yield c.say('hero', 'Vous allez me faire pleurer…', { mood: 'sad' });
    c.pose('danila', 'wave');
    yield c.say('danila', 'C\'est bien sympa tout ça… mais où sont les pintes et les cadeaux ?');
    c.pose('danila', 'idle');
    c.face('hero', -1); yield c.wait(0.7); c.face('hero', 1); yield c.wait(0.7);
    c.emote('hero', '?', 1.2);
    yield c.say('hero', 'C\'est vrai qu\'il fait soif !');
    c.sfx('pop'); c.shake(0.5); c.confetti(50);
    c.change('matthieu', CHARS.cowboy);
    const horse = c.prop('cheval', 590, FLOOR_Y);
    const m = c.actors.matthieu; m.y = FLOOR_Y - 38; m.state = 'sit'; m.x = 584; m.z = 2;
    yield c.wait(0.6);
    yield c.say('matthieu', 'YIHAAAAAAAAAA ! Vous ne retrouverez jamais les cadeaux !', { mood: 'laugh' });
    c.sfx('spring');
    yield* gallop(c, 'matthieu', horse, 1100, 1.4);
    c.remove('matthieu'); c.unprop(horse);
    yield c.wait(0.4);
    yield [c.walk('danila', 360, 150), c.walk('sheryna', 280, 150)];
    c.face('danila', -1); c.face('sheryna', 1);
    c.pose('danila', 'cheer'); c.pose('sheryna', 'cheer'); c.sfx('win');
    yield c.say('danila', 'C\'est une mission pour les agents Danila et Sheryna !', { name: 'Danila et Sheryna' });
    c.pose('danila', 'idle'); c.pose('sheryna', 'idle');
    yield c.walk('hero', 640, 160);
    c.pose('hero', 'wave');
    yield c.say('hero', 'Je m\'en occupe !');
    c.pose('hero', 'idle');
    yield c.say(null, 'Mission : les pintes pour tout le monde, les tapas, les cadeaux… et rattraper Matthieu sur son cheval gonflable !');
    yield c.fade(1, 0.6);
  },
};

CUTS.fete_arrivee = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    c.prop('banner', 480, 40, { w: 560 }); c.prop('door', 948, FLOOR_Y, { label: 'ENTRÉE' });
    for (const [k, x] of FETE_GUESTS) { const ch = k === 'matthieu' ? CHARS.cowboy : CHARS[k]; c.add(k, ch, x, { face: x < 480 ? 1 : -1 }); c.prop('biere', x + (x < 480 ? 15 : -15), FLOOR_Y - 24, { lift: 0, scale: 0.9 }); }
    c.add('hero', CHARS.hero, 960, { face: -1, state: 'walk' });
    yield c.fade(0, 0.6);
    yield c.walk('hero', 560, 150);
    c.pose('hero', 'wave'); c.sfx('win'); c.confetti(60);
    yield c.say('hero', 'Les pintes, les tapas, les cadeaux… et le cow-boy ! La fête commence !');
    c.pose('hero', 'idle');
    for (const [k] of FETE_GUESTS) c.pose(k, 'cheer');
    c.sfx('win'); c.confetti(90);
    yield c.say('coline', 'Merci Stephan !', { name: 'Tout le monde' });
    for (const [k] of FETE_GUESTS) { c.pose(k, 'idle'); c.emote(k, 'GLOU', 2.4); }
    c.prop('biere', 575, FLOOR_Y - 24, { lift: 0, scale: 0.9 });
    c.sfx('pop'); yield c.wait(2.6);
    c.pose('hero', 'cheer'); c.confetti(60);
    yield c.say('hero', 'Et maintenant… il est l\'heure de danser !');
    yield c.fade(1, 0.6);
  },
};

CUTS.fete_danse = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    c.prop('banner', 480, 40, { w: 560 });
    const g = ['coline', 'amelie', 'sheryna', 'youssef', 'imen', 'cecile', 'franck', 'danila', 'hakim', 'matthieu', 'arno', 'justine', 'sandie', 'bastien', 'olivier', 'chef'];
    g.forEach((k, i) => c.add(k, k === 'matthieu' ? CHARS.cowboy : CHARS[k], 60 + i * 56, { face: i < 8 ? 1 : -1 }));
    c.add('hero', CHARS.hero, 480, { y: FLOOR_Y + 40, face: 1, z: 3 });
    yield c.fade(0, 0.6);
    yield c.caption('La piste de danse.', 2);
    for (const k of g) c.pose(k, 'cheer');
    c.pose('hero', 'wave'); c.sfx('win');
    yield c.say('hero', 'Je suis le Dancing King !');
    c.confetti(70);
    yield c.say(null, 'Appuyez sur les flèches au rythme de la musique : 1 point par flèche, un bonus toutes les 10 flèches !');
    yield c.fade(1, 0.5);
  },
};

CUTS.j0_fin = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    c.prop('banner', 480, 40, { w: 560 }); c.prop('cake', 480, FLOOR_Y);
    for (const [k, x] of FETE_GUESTS) c.add(k, k === 'matthieu' ? CHARS.cowboy : CHARS[k], x, { face: x < 480 ? 1 : -1, state: 'cheer' });
    c.add('hero', CHARS.hero, 380, { face: 1 });
    yield c.fade(0, 0.6);
    c.confetti(80);
    yield c.say('chef', 'Quinze ans, quinze mille chaises… Stephan, merci pour tout.');
    c.pose('hero', 'wave');
    yield c.say('hero', 'C\'est moi qui vous remercie. Vous allez me manquer. Sauf les mails urgents.');
    c.pose('hero', 'idle');
    const frame1 = () => ({ n: 0, update() { return this.n++ >= 1; } });
    const tween = (dur, fn) => ({ t: 0, update(dt) { this.t += dt; const u = Math.min(1, this.t / dur); fn(u); return u >= 1; } });
    const heart = (from, to, delay) => c.spawn((function* () {
      yield c.wait(delay);
      const a = c.actors[from], b = c.actors[to]; if (!a || !b) return;
      const x0 = a.x, y0 = a.y - 90, h = c.prop('coeur', x0, y0, { scale: 1.5, front: true });
      yield tween(1, u => { h.x = lerp(x0, b.x, u); h.y = lerp(y0, b.y - 90, u) - Math.sin(u * Math.PI) * 45; });
      c.unprop(h); c.burst(b.x, b.y - 90, 6, ['#ff5a8a', '#ff9ac0', '#ffffff'], 130);
    })());
    // ---- Bastien et Olivier attrapent Stephan et le jettent en l'air ----
    yield [c.walk('bastien', 335, 240), c.walk('olivier', 425, 240)];
    c.face('bastien', 1); c.face('olivier', -1);
    const hero = c.actors.hero;
    c.pose('bastien', 'cheer'); c.pose('olivier', 'cheer');
    for (let i = 0; i < 3; i++) {
      c.emote('bastien', 'HOP !', 0.8); c.emote('olivier', 'HOP !', 0.8); c.sfx('jump'); c.pose('hero', 'cheer');
      const H = 95 + i * 40;
      yield tween(0.85, u => { hero.y = FLOOR_Y - Math.sin(u * Math.PI) * H; hero.rot = u * 6.2832 * (i === 2 ? 1 : 0); });
      hero.y = FLOOR_Y; hero.rot = 0; c.sfx('stomp'); c.shake(0.12);
      yield c.wait(0.25);
    }
    c.pose('bastien', 'idle'); c.pose('olivier', 'idle'); c.pose('hero', 'idle');
    c.pose('bastien', 'cheer');
    yield c.say('bastien', 'CÂLIN COLLECTIF !', { mood: 'laugh' });
    // ---- tout le monde se regroupe autour de Stephan ----
    const order = FETE_GUESTS.map(g => g[0]).filter(k => k !== 'bastien' && k !== 'olivier'), n = order.length;
    const ws = order.map((k, i) => { const left = i < n / 2, r = left ? (n / 2 - i) : (i - n / 2 + 1); return c.walk(k, 380 + (left ? -1 : 1) * (28 + r * 20), 230); });
    yield ws;
    for (const k of order) c.face(k, c.actors[k].x < 380 ? 1 : -1);
    for (const k of [...order, 'bastien', 'olivier', 'hero']) { c.pose(k, 'cheer'); c.emote(k, '♥', 2.4); }
    c.sfx('win'); c.confetti(60);
    yield c.wait(2.2);
    // ---- le mot de la fin ----
    c.pose('hero', 'wave');
    yield c.say('hero', 'C\'était une super aventure ! Merci à tous !');
    c.emote('hero', 'MWAH ♥', 2.2); c.sfx('pop');
    const guests = [...order, 'bastien', 'olivier'];
    guests.slice().sort(() => Math.random() - 0.5).slice(0, 10).forEach((k, i) => heart('hero', k, i * 0.18));
    yield c.wait(2.6);
    c.pose('hero', 'cheer'); c.confetti(100); c.rain(120);
    guests.forEach((k, i) => { heart(k, 'hero', i * 0.12); c.spawn((function* () { yield c.wait(i * 0.12); c.emote(k, 'MWAH', 1.2); })()); });
    yield c.say('coline', 'Bonne retraite Stephan !!!', { name: 'Tout le monde' });
    yield c.wait(1.4);
    yield c.say('sheryna', 'On est trop Mim\'s !', { mood: 'laugh' });
    yield c.wait(0.8);
    yield c.fade(1, 1.2);
    yield c.card('FIN', 'Bonne retraite, ' + CONFIG.hero + ' !', 3.2);
  },
};

/* Épilogue (après le générique, quand tout le monde est parti) : Stephan seul, Bastien adoubé au sabre laser, parking et feu d'artifice.
   Test visuel : test/shot.html#cut/j0_epilogue/6 */
CUTS.j0_epilogue = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    const frame1 = () => ({ n: 0, update() { return this.n++ >= 1; } });
    const tween = (dur, fn) => ({ t: 0, update(dt) { this.t += dt; const u = Math.min(1, this.t / dur); fn(u); return u >= 1; } });
    const FIRE = ['#ff5a5a', '#ffd23f', '#5ad1ff', '#7dff7d', '#ff7ad9', '#ffffff'];
    c.add('hero', CHARS.hero, 434, { face: -1 });
    const hero = c.actors.hero;
    yield c.wait(1.2);
    yield c.say('hero', 'Ils me manquent déjà, mes petits loulous…', { mood: 'sad' });
    // la lumière baisse, Stephan verse une larme
    c.mood('hero', 'sad');
    yield c.dim(0.55, 2.2);
    const tear = c.prop('larme', 426, FLOOR_Y - 70, { a: 0, front: true });
    yield tween(2.2, u => { tear.a = Math.min(1, u * 5) * (1 - Math.max(0, (u - 0.85) * 6.6)); tear.y = lerp(FLOOR_Y - 70, FLOOR_Y - 34, u * u); });
    c.unprop(tear);
    yield c.wait(0.6);
    // Bastien arrive derrière lui et lui met la main dans le dos
    c.add('bastien', CHARS.bastien, 1030, { face: -1, state: 'walk' });
    yield c.walk('bastien', 474, 120);
    c.face('bastien', -1);
    const arm = c.prop('bras', 466, FLOOR_Y - 42, { x2: 446, y2: FLOOR_Y - 44, c: CHARS.bastien.top, skin: CHARS.bastien.skin, front: true });
    let pat = true;
    c.spawn((function* () { let u = 0; while (pat) { u += 1 / 60; arm.y2 = FLOOR_Y - 44 + Math.sin(u * 8) * 3; yield frame1(); } })());
    yield c.say('bastien', 'Allez, ça va aller, Stephan… Suis-moi.');
    c.face('hero', 1); c.mood('hero', undefined);
    yield c.say('hero', 'Non…');
    yield c.say('hero', 'On a un truc à faire tous les deux avant.');
    pat = false; c.unprop(arm); c.face('bastien', -1);
    // le sabre laser : Stephan adoube Bastien
    c.pose('hero', 'idle');
    const sab = c.prop('sabre', 450, FLOOR_Y - 40, { rot: 0.15, len: 0, front: true });
    c.sfx('spring'); yield tween(0.5, u => { sab.len = 74 * u; });
    yield c.dim(0.4, 0.6);
    yield c.say('hero', 'Padawan, tu n\'es plus …');
    yield tween(0.5, u => { sab.rot = lerp(0.15, 1.1, u); });
    c.sfx('spring'); c.burst(500, FLOOR_Y - 80, 12, ['#3fd0ff', '#ffffff'], 140); yield c.wait(0.45);
    yield tween(0.3, u => { sab.rot = lerp(1.1, 1.5, u); });
    c.sfx('spring'); c.burst(485, FLOOR_Y - 60, 12, ['#3fd0ff', '#ffffff'], 140); yield c.wait(0.4);
    yield c.say('hero', '… Chevalier Jedi des incidents tu es devenu !');
    c.sfx('win'); c.confetti(50); c.emote('bastien', '♥', 2.4);
    yield tween(0.4, u => { sab.rot = lerp(1.5, 0.15, u); });
    yield c.say('bastien', 'Merci Stephan ! Je serai digne de ce titre.', { mood: 'happy' });
    c.sfx('spring'); yield tween(0.4, u => { sab.len = 74 * (1 - u); }); c.unprop(sab);
    c.face('bastien', 1);
    yield c.say('bastien', 'Maintenant, suis-moi !');
    yield c.say('hero', 'Allons-y !');
    yield [c.walk('bastien', 1100, 170), c.walk('hero', 1060, 170)];
    c.remove('bastien'); c.remove('hero');
    // ---- le parking, vide à part la voiture de Sandie ----
    yield c.fade(1, 0.9);
    yield c.dim(0, 0.01);
    c.bg('parking'); c.prop('twingo', 760, FLOOR_Y - 6, { col: '#3aa65a', face: -1 });
    yield c.fade(0, 1);
    yield c.caption('Un parking. Vide… ou presque.', 2.4);
    c.add('bastien', CHARS.bastien, -70, { face: 1, state: 'walk' }); c.add('hero', CHARS.hero, -150, { face: 1, state: 'walk' });
    yield [c.walk('bastien', 450, 150), c.walk('hero', 380, 150)];
    c.face('hero', 1); c.face('bastien', -1);
    c.emote('hero', '?', 1.4);
    yield c.say('hero', 'Un parking ? Mais… il n\'y a personne.');
    yield c.say('bastien', 'Tu crois ?', { mood: 'laugh' });
    // tout le monde surgit
    const X = {}; for (const [k, x] of FETE_GUESTS) X[k] = x;
    const ws = [];
    for (const [k, x] of FETE_GUESTS) {
      if (k === 'bastien') continue;
      const tx = k === 'sandie' ? 690 : Math.min(900, Math.max(60, x)), l = tx < 480;
      c.add(k, k === 'matthieu' ? CHARS.cowboy : CHARS[k], l ? -80 : 1040, { face: l ? 1 : -1, state: 'walk' });
      ws.push(c.walk(k, tx, 260));
    }
    c.emote('hero', '!!', 2); c.sfx('win');
    yield ws;
    for (const k of Object.keys(c.actors)) { if (k !== 'hero') c.face(k, c.actors[k].x < 380 ? 1 : -1); c.pose(k, 'cheer'); }
    c.face('hero', 1); c.confetti(60);
    yield c.say('coline', 'Bonne continuation Stephan !', { name: 'Tout le monde', mood: 'laugh' });
    // ---- feu d'artifice ----
    const shoot = (x, y) => c.spawn((function* () {
      for (let k = 0; k < 6; k++) { c.burst(x, lerp(FLOOR_Y - 70, y, k / 5), 3, ['#ffe08a'], 45); yield c.wait(0.06); }
      c.sfx('pop'); c.burst(x, y, 90, FIRE, 680); c.burst(x, y, 30, ['#ffffff'], 300);
    })());
    c.sfx('spring');
    for (let i = 0; i < 12; i++) { shoot(130 + Math.random() * 700, 70 + Math.random() * 150); if (i % 3 === 0) c.sfx('win'); yield c.wait(0.45 + Math.random() * 0.5); }
    for (let i = 0; i < 5; i++) { shoot(100 + i * 190, 80 + (i % 2) * 70); yield c.wait(0.12); }
    yield c.wait(3.2);
    yield c.fade(1, 1.6);
  },
};

/* Casting : tous les personnages alignés (hors histoire, pour vérifier les skins).
   Voir : test/shot.html#cut/casting/2 */
CUTS.casting = {
  type: 'cutscene', bg: 'bar',
  script: function* (c) {
    const keys = Object.keys(CHARS).filter(k => !['sophie', 'karim', 'nadia', 'julien'].includes(k) && !k.startsWith('boss') && k !== 'lapin' && k !== 'cowboy');
    keys.forEach((k, i) => c.add(k, CHARS[k], 40 + i * (880 / (keys.length - 1)), { face: i % 2 ? -1 : 1, state: 'idle' }));
    yield c.say('hero', 'Toute la Delivery Team est là !');
    yield c.wait(1);
  },
};

/* ============================================================
   HISTOIRE : l'ordre des chapitres, cinématiques et niveaux
   ============================================================ */
const STORY = [
  { day: 'J-15', title: 'En route vers le GTAR', steps: [CUTS.j15_train, LEVELS.train, CUTS.j15_train_bastien] },
  { day: 'J-14', title: 'Le logigramme',        steps: [CUTS.j14_bureau, LEVELS.logigramme, CUTS.j15_outro] },
  { day: 'J-9',  title: 'Déjeuner japonais',  steps: [CUTS.j9_choix, CUTS.j9_japonais, LEVELS.japonais, CUTS.j9_outro] },
  { day: 'J-7',  title: 'La crise',              steps: [CUTS.j7_crise, LEVELS.crise, CUTS.j7_mozart] },
  { day: 'J-5',  title: 'Charlie\'s',         steps: [CUTS.j5_choix, CUTS.j5_charlies, LEVELS.charlies, CUTS.j5_outro] },
  { day: 'J-4',  title: 'Dernier PI',            steps: [CUTS.j3_pi_intro, LEVELS.pi, CUTS.j3_pi_salle] },
  { day: 'J-3',  title: 'Le backlog',            steps: [CUTS.backlog_intro, LEVELS.backlog, CUTS.backlog_franck, ARENAS.balai, CUTS.backlog_fin] },
  { day: 'J-0',  title: 'La fête de départ',  steps: [CUTS.fete_intro, LEVELS.fete, CUTS.fete_arrivee, CUTS.fete_danse, ARENAS.danse, CUTS.j0_fin] },
];
