// Banc de test sans navigateur : node test/run.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'js');
const src = ['util', 'music', 'draw', 'engine', 'content'].map(f => fs.readFileSync(path.join(dir, f + '.js'), 'utf8')).join('\n');

function mockCtx() {
  const target = { measureText: s => ({ width: String(s).length * 9 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), canvas: { width: 960, height: 544 } };
  return new Proxy(target, { get(t, k) { return k in t ? t[k] : () => {}; }, set(t, k, v) { t[k] = v; return true; } });
}
const G = new Function('window', 'document', 'requestAnimationFrame', src + `
  return { Game, LevelScene, CutScene, TitleScene, ChapterSelect, ChapterCard, CreditsScene, Device, BroomScene, DanceScene, AuraScene, BunnyScene, PongScene, PacScene, MiniGameSelect, MINIGAMES, MUSIC, ARENAS, STORY, LEVELS, CUTS, CHARS, Input, Sfx, W, H, TILE, FLOOR_Y, runStep, BG, THEMES, drawBackground, drawCharacter, drawItem, drawHazard, drawProp, ITEM_KINDS, HAZARDS };`
)({ addEventListener() {} }, {}, () => {});
const { Input } = G;
let failures = 0;
const ok = (c, msg) => { if (!c) { failures++; console.log('  ✗ ' + msg); } };
const fakeGame = { go() {}, ctx: mockCtx() };
const frame = (scene, dt, keys) => { Input.pressed = Object.assign({}, keys || {}); scene.update(dt); Input.endFrame(); };

/* ---------- 1. Niveaux : structure + accessibilité ---------- */
function reach(level) {
  const sc = new G.LevelScene(fakeGame, level, () => {}, () => {}); sc.enter();
  const out = [];
  const solid = (x, y) => { const c = sc.tile(x, y); return c === '#' || c === '='; };
  const free = (x, y) => x >= 0 && x < sc.cols && y >= 0 && y < sc.rows && !solid(x, y);
  const stand = [];
  for (let y = 0; y < sc.rows - 1; y++) for (let x = 0; x < sc.cols; x++) if (free(x, y) && free(x, y - 1) && solid(x, y + 1)) stand.push({ x, y, k: x + ',' + y });
  const springs = new Set(sc.springs.map(s => s.tx + ',' + s.ty));
  const sx = Math.floor(sc.start.x / G.TILE), sy = Math.floor((sc.start.y - 1) / G.TILE);
  const seen = new Map(), q = [];
  const s0 = stand.find(s => s.x === sx && s.y === sy);
  if (!s0) { out.push('départ introuvable sur un sol'); return { out, sc }; }
  seen.set(s0.k, s0); q.push(s0);
  while (q.length) {
    const a = q.shift(), isSpring = springs.has(a.k);
    for (const b of stand) {
      if (seen.has(b.k)) continue;
      const dx = Math.abs(b.x - a.x), up = a.y - b.y;
      let okE = false;
      if (up === 0) okE = dx <= 4;
      else if (up > 0) okE = isSpring ? (up <= 7 && dx <= 4) : (up <= 3 && dx <= (up >= 3 ? 3 : 4));
      else okE = -up <= 14 && dx <= 6;
      if (okE) { seen.set(b.k, b); q.push(b); }
    }
  }
  const near = (x, row, dxMax, upMax) => [...seen.values()].some(a => Math.abs(a.x - x) <= dxMax && row >= a.y - upMax && row <= a.y);
  for (const it of sc.items) { const tx = Math.floor(it.x / G.TILE), ty = Math.floor(it.y / G.TILE); if (!near(tx, ty, 2, 4)) out.push('objet inaccessible en (' + tx + ',' + ty + ')'); }
  if (sc.chase) for (const pt of sc.chase.path) { const px = Math.floor(pt.x / G.TILE), py = Math.floor((pt.y - 1) / G.TILE); if (!seen.has(px + ',' + py)) out.push('poursuite : point inaccessible en ' + px + ',' + py); }
  const ex = Math.floor(sc.exit.x / G.TILE), ey = Math.floor((sc.exit.y - 1) / G.TILE);
  if (!seen.has(ex + ',' + ey)) out.push('sortie inaccessible');
  for (const c of sc.checks) { const cx = Math.floor(c.x / G.TILE), cy = Math.floor((c.y - 1) / G.TILE); if (!seen.has(cx + ',' + cy)) out.push('café inaccessible en ' + cx); }
  return { out, sc };
}
console.log('Niveaux');
for (const [name, lv] of Object.entries(G.LEVELS)) {
  const rows = lv.map.length; ok(rows === 17, name + ' : 17 lignes attendues'); ok(new Set(lv.map.map(r => r.length)).size === 1, name + ' : lignes de longueurs différentes');
  const { out, sc } = reach(lv);
  out.forEach(m => ok(false, name + ' : ' + m));
  ok(sc.exit && sc.items.length > 0 && sc.enemies.length > 0, name + ' : sortie/objets/ennemis manquants');
  // simulation d'un bot qui avance en sautant
  let sim = new G.LevelScene(fakeGame, lv, () => {}, () => {}); sim.enter(); const ctx = mockCtx();
  try {
    for (let i = 0; i < 60 * 25; i++) { Input.down = { ArrowRight: true, Space: i % 40 < 14 }; frame(sim, 1 / 60, i % 40 === 0 ? { Space: true } : {}); if (i % 30 === 0) sim.draw(ctx); }
  } catch (e) { ok(false, name + ' : exception pendant la simulation → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  Input.down = {};
  ok(sim.p.x > 200, name + ' : le bot n\'a pas avancé (x=' + Math.round(sim.p.x) + ')');
  // ramassage de tous les objets puis sortie
  const t = new G.LevelScene(fakeGame, lv, () => {}, () => {}); let finished = false; t.onDone = () => { finished = true; }; t.enter();
  t.p.inv = 999;   // invulnérable : on teste le ramassage, pas les ennemis
  for (const it of t.items) { t.p.x = it.x; t.p.y = it.y + 25; t.entities(0.016); }
  if (t.chase) { t.p.x = t.chase.x; t.p.y = t.chase.y; t.entities(0.016); }
  ok(t.allDone(), name + ' : tous les objets ne sont pas ramassables'); ok(t.exit.open, name + ' : la sortie ne s\'ouvre pas');
  t.p.x = t.exit.x; t.p.y = t.exit.y; t.entities(0.016); ok(t.done, name + ' : le niveau ne se termine pas');
  for (let i = 0; i < 80; i++) frame(t, 1 / 60, i === 70 ? { Enter: true } : {}); ok(finished, name + ' : onDone non appelé');
  t.draw(ctx);
  console.log('  ' + name.padEnd(12) + (out.length ? '✗' : '✓') + ' ' + sc.cols + ' colonnes, ' + sc.items.length + ' objets, ' + sc.enemies.length + ' ennemis');
}

/* ---------- 2. Cinématiques ---------- */
console.log('Cinématiques');
for (const [name, cut] of Object.entries(G.CUTS)) {
  let done = false; const sc = new G.CutScene(fakeGame, cut, () => { done = true; }); sc.enter(); const ctx = mockCtx();
  try {
    for (let i = 0; i < 60 * 120 && !done; i++) { frame(sc, 1 / 60, i % 12 === 0 ? { Enter: true } : {}); if (i % 20 === 0) sc.draw(ctx); }
  } catch (e) { ok(false, name + ' : exception → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  ok(done && !sc.error, name + ' : ne se termine pas' + (sc.error ? ' (' + sc.error.message + ')' : ''));
  console.log('  ' + name.padEnd(14) + (done && !sc.error ? '✓' : '✗') + ' ' + Math.round(sc.t) + ' s simulées');
}

/* ---------- 3. Parcours complet de l'histoire via Game ---------- */
console.log('Parcours complet');
{
  const canvas = { getContext: () => mockCtx(), width: 0, height: 0 };
  const game = new G.Game(canvas); game.go(new G.TitleScene(game));
  const seen = new Set(); let steps = 0;
  try {
    for (let i = 0; i < 30 * 60 * 20; i++) {
      const s = game.scene; seen.add(s.constructor.name);
      let keys = i % 8 === 0 ? { Enter: true } : {};
      if (s instanceof G.TitleScene && i === 20) keys = { Enter: true };
      if (s instanceof G.CreditsScene && s.t > 0.3) break;
      if (s instanceof G.BroomScene && !s.done && s.t > 1) s.complete();
      if (s instanceof G.DanceScene && !s.done && s.t > 1) s.finish();
      if (s instanceof G.LevelScene && !s.done && s.t > 1) { s.p.inv = 999; for (const it of s.items) { s.p.x = it.x; s.p.y = it.y + 25; s.entities(0.016); } if (s.chase) { s.p.x = s.chase.x; s.p.y = s.chase.y; s.entities(0.016); } s.p.x = s.exit.x; s.p.y = s.exit.y; s.entities(0.016); }
      Input.pressed = keys; game.update(1 / 30); game.draw(); Input.endFrame(); steps++;
    }
  } catch (e) { ok(false, 'parcours : exception → ' + e.stack.split('\n').slice(0, 4).join(' | ')); }
  ok(seen.has('CreditsScene'), 'parcours : le générique n\'est pas atteint (dernière scène : ' + game.scene.constructor.name + ')');
  ok(game.scene instanceof G.CreditsScene, 'parcours : arrêt hors du générique');
  console.log('  scènes vues :', [...seen].join(', '));
}

/* ---------- 3b. Arènes « coup de balai » ---------- */
console.log('Arènes');
for (const [name, ar] of Object.entries(G.ARENAS)) {
  if (ar.type === 'pong') {
    const ctx = mockCtx(); let wins = 0;
    for (let m = 0; m < 3; m++) {                                                  // un joueur qui suit la balle et la renvoie avec le bord de la raquette (pour créer des angles)
      const sp = new G.PongScene(fakeGame, ar, () => {}, () => {}); sp.enter();
      try {
        for (let i = 0; i < 60 * 900 && sp.phase !== 'over'; i++) {
          const b = sp.ball, ty = b.y + (b.vx < 0 ? (b.y < 272 ? 32 : -32) : 0), keys = {};
          if (ty < sp.py - 6) keys.ArrowUp = true; else if (ty > sp.py + 6) keys.ArrowDown = true;
          Input.down = keys; frame(sp, 1 / 60, {}); if (i % 120 === 0) sp.draw(ctx);
        }
      } catch (e) { ok(false, name + ' : exception → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
      Input.down = {}; ok(sp.phase === 'over' && (sp.score[0] === 7 || sp.score[1] === 7), name + ' : la partie ne se termine pas (' + sp.score + ')'); if (sp.winner === 0) wins++; sp.draw(ctx);
    }
    const sn = new G.PongScene(fakeGame, ar, () => {}, () => {}); sn.enter();        // joueur immobile : l'ordinateur doit finir par gagner
    try { for (let i = 0; i < 60 * 900 && sn.phase !== 'over'; i++) frame(sn, 1 / 60, {}); } catch (e) { ok(false, name + ' : exception (immobile) → ' + e.message); }
    ok(sn.phase === 'over' && sn.winner === 1, name + ' : un joueur immobile doit perdre (' + sn.score + ')');
    let fin = false; const so = new G.PongScene(fakeGame, ar, () => { fin = true; }, () => {}); so.enter(); so.score = [6, 0]; so.ball.x = G.W + 100; so.phase = 'play'; so.ball.vx = 300; frame(so, 1 / 60, {});
    for (let i = 0; i < 100; i++) frame(so, 1 / 60, i === 90 ? { Space: true } : {}); ok(so.phase === 'over' && so.winner === 0 && fin, name + ' : 7e point / retour au menu'); so.draw(ctx);
    ok(sn.touchMode === 'menu' && new G.PongScene(fakeGame, ar, () => {}, () => {}).touchMode === 'updown', name + ' : modes tactiles');
    console.log('  ' + name.padEnd(12) + '✓ ' + wins + '/3 victoires du bot de suivi, immobile → perdu ' + sn.score.join('-'));
    continue;
  }
  if (ar.type === 'pac') {
    const ctx = mockCtx(), sp = new G.PacScene(fakeGame, ar, () => {}, () => {}); sp.enter();
    try {
      const dirs = [{ ArrowLeft: true }, { ArrowUp: true }, { ArrowRight: true }, { ArrowDown: true }];
      for (let i = 0; i < 60 * 240 && sp.phase !== 'over'; i++) { Input.down = dirs[Math.floor(i / 50 + Math.sin(i / 97) * 3 + 8) % 4]; frame(sp, 1 / 60, {}); if (i % 120 === 0) sp.draw(ctx); }
    } catch (e) { ok(false, name + ' : exception → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
    Input.down = {}; ok(sp.score > 0, name + ' : le joueur n\'a rien mangé'); sp.draw(ctx);
    // tous les points sont accessibles depuis le départ (les fantômes ne passent pas par la porte)
    const sa = new G.PacScene(fakeGame, ar, () => {}, () => {}); sa.enter(); const seen = new Set(['10,11']), q = [[10, 11]];
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = (x + dx + 21) % 21, ny = y + dy; if (sa.open(nx, ny) && !seen.has(nx + ',' + ny)) { seen.add(nx + ',' + ny); q.push([nx, ny]); } } }
    const dots = []; sa.maze.forEach((r, y) => r.forEach((c, x) => { if (c === '.' || c === 'o') dots.push([x, y]); })); ok(dots.length === sa.dotsLeft && dots.every(d => seen.has(d[0] + ',' + d[1])), name + ' : points inaccessibles'); ok(sa.maze.every(r => r.length === 21), name + ' : labyrinthe de largeur irrégulière');
    // manger le dernier point termine le niveau, perdre 3 vies termine la partie
    const sc = new G.PacScene(fakeGame, ar, () => {}, () => {}); sc.enter(); sc.phase = 'play'; for (const r of sc.maze) r.forEach((c, x) => { if (c === '.' || c === 'o') r[x] = ' '; }); sc.maze[11][9] = '.'; sc.dotsLeft = 1; sc.want = { dx: -1, dy: 0 };
    for (let i = 0; i < 60 && sc.phase === 'play'; i++) frame(sc, 1 / 60, {}); ok(sc.phase === 'clear', name + ' : le dernier point doit terminer le niveau (' + sc.phase + ')');
    for (let i = 0; i < 150; i++) frame(sc, 1 / 60, {}); ok(sc.level === 2 && sc.phase === 'ready', name + ' : niveau suivant non lancé (niveau ' + sc.level + ', ' + sc.phase + ')');
    const sd = new G.PacScene(fakeGame, ar, () => {}, () => {}); sd.enter(); sd.phase = 'play'; sd.lives = 1; sd.ghosts[0].cx = sd.pac.cx; sd.ghosts[0].cy = sd.pac.cy; frame(sd, 1 / 60, {}); ok(sd.phase === 'dying', name + ' : le contact avec un fantôme doit tuer');
    for (let i = 0; i < 200; i++) frame(sd, 1 / 60, {}); ok(sd.phase === 'over', name + ' : plus de vie → fin de partie'); sd.draw(ctx);
    const sf = new G.PacScene(fakeGame, ar, () => {}, () => {}); sf.enter(); sf.phase = 'play'; sf.power = 5; sf.ghosts[0].fr = true; sf.ghosts[0].cx = sf.pac.cx; sf.ghosts[0].cy = sf.pac.cy; frame(sf, 1 / 60, {}); ok(sf.score >= 200 && sf.ghosts[0].state === 'house', name + ' : un fantôme effrayé doit pouvoir être mangé');
    console.log('  ' + name.padEnd(12) + '✓ ' + dots.length + ' points · score du bot aveugle : ' + sp.score);
    continue;
  }
  if (ar.type === 'bunny') {
    const ctx = mockCtx(), sb = new G.BunnyScene(fakeGame, ar, () => {}, () => {}); sb.enter();
    try {
      for (let i = 0; i < 60 * 300 && sb.phase !== 'over'; i++) {                  // un joueur adroit : angle ~46°, frappe au bon moment, booste en descente
        const keys = {};
        if (sb.phase === 'aim' && Math.abs(sb.theta - 0.8) < 0.03) keys.Space = true;
        else if (sb.phase === 'fall' && !sb.swung) { const B = sb.sweet(); if (Math.hypot(sb.m.x - B.x, sb.m.y - B.y) < 40) keys.Space = true; }
        else if (sb.phase === 'fly' && sb.flyT > 1.0 && sb.boosts > 0 && sb.m.vy > 0) keys.Space = true;
        else if (sb.phase === 'result') keys.Space = true;
        frame(sb, 1 / 60, keys); if (i % 60 === 0) sb.draw(ctx);
      }
    } catch (e) { ok(false, name + ' : exception → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
    ok(sb.phase === 'over' && sb.dists.length === 3, name + ' : les 3 lancers ne se terminent pas'); ok(sb.dists.filter(d => d > 40).length >= 2, name + ' : un bon joueur doit envoyer le lapin au-delà de 40 m au moins 2 fois sur 3 (' + sb.dists.join(', ') + ')');
    const sm = new G.BunnyScene(fakeGame, ar, () => {}, () => {}); sm.enter();                 // pas de frappe : le lapin tombe et ne va pas loin
    try { for (let i = 0; i < 60 * 60 && sm.phase !== 'result'; i++) frame(sm, 1 / 60, sm.phase === 'aim' && i > 30 ? { Space: true } : {}); } catch (e) { ok(false, name + ' : exception (raté) → ' + e.message); }
    ok(sm.phase === 'result' && sm.lastDist < 40, name + ' : un lancer raté doit finir près de Stephan (' + sm.lastDist + ' m)'); sm.draw(ctx);
    let fin = false; const so = new G.BunnyScene(fakeGame, ar, () => { fin = true; }, () => {}); so.enter(); so.dists = [10, 20]; so.cur = 2; so.phase = 'result'; so.next();
    for (let i = 0; i < 100; i++) frame(so, 1 / 60, i === 90 ? { Space: true } : {}); ok(fin, name + ' : onDone non appelé'); so.draw(ctx);
    console.log('  ' + name.padEnd(12) + '✓ 3 lancers : ' + sb.dists.join(' m, ') + ' m');
    continue;
  }
  if (ar.type === 'aura') {
    const ctx = mockCtx(), keysOf = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
    const sa = new G.AuraScene(fakeGame, ar, () => {}, () => {}); sa.enter(); let frames = 0;
    try {
      for (let i = 0; i < 60 * 400 && !sa.over; i++, frames++) {                // Stephan parfait ; en duo, Arno rate une flèche sur trois
        const st = sa.songTime(), keys = {};
        if (sa.phase === 'turn') for (const a of sa.arrows) if (a.state === 0 && Math.abs(a.t - st) < 1 / 120 && (sa.turn === 0 || (!sa.cpu && a.lane !== 1))) keys[keysOf[a.lane]] = true;
        frame(sa, 1 / 60, keys); if (i % 90 === 0) sa.draw(ctx);
      }
    } catch (e) { ok(false, name + ' : exception → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
    ok(sa.over && sa.winner === 0, name + ' : un Stephan parfait doit gagner le match (fini=' + sa.over + ', vainqueur=' + sa.winner + ')'); sa.draw(ctx);
    for (const key of ar.songs) {                                                 // les flèches tombent sur de vrais temps forts de la chanson, à la suite, au rythme du morceau
      const sy = new G.AuraScene(fakeGame, Object.assign({}, ar, { songs: [key] }), () => {}, () => {}); sy.enter(); const st0 = sy.s0 + 1.4; sy.startTurn(0, st0);
      const gaps = sy.arrows.slice(1).map((a, i) => a.t - sy.arrows[i].t);
      ok(sy.arrows.length === 15 && sy.arrows.every(a => sy.song.hits.includes(a.t)), name + ' / ' + key + ' : les flèches ne sont pas posées sur les temps forts');
      ok(sy.arrows[0].t >= st0 + 1.4 && Math.min.apply(null, gaps) >= 0.26 && Math.max.apply(null, gaps) < 3, name + ' / ' + key + ' : écarts de flèches injouables (' + Math.min.apply(null, gaps).toFixed(2) + ' à ' + Math.max.apply(null, gaps).toFixed(2) + ' s)');
      ok(sy.song.hits.length > 200 && sy.song.tracks.some(t => t.n.length > 100), name + ' / ' + key + ' : chanson incomplète');
    }
    const tie = new G.AuraScene(fakeGame, ar, () => {}, () => {}); tie.enter(); tie.score = [{ hits: 9, perf: 4 }, { hits: 9, perf: 4 }]; tie.resolveRound();
    ok(tie.roundWinner === -1 && tie.p[0].wins === 0 && tie.p[1].wins === 0 && tie.sudden, name + ' : une égalité ne doit donner de point à personne et lancer la mort subite');
    tie.pt = 99; frame(tie, 1 / 60, {}); ok(tie.phase === 'turn' && tie.arrows.length === 5 && tie.round === 1, name + ' : la mort subite doit durer 5 flèches dans la même manche');
    tie.score = [{ hits: 2, perf: 1 }, { hits: 2, perf: 1 }]; tie.resolveRound(); ok(tie.roundWinner === -1 && tie.sudden, name + ' : une nouvelle égalité relance la mort subite');
    tie.score = [{ hits: 9, perf: 3 }, { hits: 9, perf: 4 }]; tie.resolveRound(); ok(tie.roundWinner === 1 && !tie.sudden, name + ' : départage aux coups parfaits');
    let fin = false; const se = new G.AuraScene(fakeGame, ar, () => { fin = true; }, () => {}); se.enter(); se.p[1].wins = 3; se.endMatch();
    for (let i = 0; i < 100; i++) frame(se, 1 / 60, i === 90 ? { Enter: true } : {}); ok(fin, name + ' : onDone non appelé'); se.draw(ctx);
    console.log('  ' + name.padEnd(12) + '✓ match simulé en ' + Math.round(frames / 60) + ' s, ' + sa.p[0].wins + '-' + sa.p[1].wins);
    continue;
  }
  if (ar.type === 'dance') {
    const ctx = mockCtx(), sd = new G.DanceScene(fakeGame, ar, () => {}, () => {}); sd.enter(); const total = sd.arrows.length;
    try {
      for (let i = 0; i < 60 * (sd.song.length + 6) && !sd.done; i++) {                 // un joueur parfait : appuie pile sur chaque flèche
        const st = sd.songTime(), keys = {};
        for (const a of sd.arrows) if (a.state === 0 && Math.abs(a.t - st) < 1 / 120) keys[['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'][a.lane]] = true;
        frame(sd, 1 / 60, keys); if (i % 40 === 0) sd.draw(ctx);
      }
    } catch (e) { ok(false, name + ' : exception → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
    ok(sd.done, name + ' : la danse ne se termine pas'); ok(sd.hits >= total - 2, name + ' : un joueur parfait ne réussit que ' + sd.hits + '/' + total + ' flèches');
    ok(sd.bonuses === Math.floor(sd.hits / 10) && sd.score === sd.hits + sd.bonuses * 10, name + ' : score incohérent'); sd.draw(ctx);
    let fin = false; const s2 = new G.DanceScene(fakeGame, ar, () => { fin = true; }, () => {}); s2.enter(); s2.finish();
    for (let i = 0; i < 80; i++) frame(s2, 1 / 60, i === 70 ? { Enter: true } : {}); ok(fin, name + ' : onDone non appelé');
    console.log('  ' + name.padEnd(12) + '✓ ' + total + ' flèches, score parfait ' + sd.score + ' (' + sd.bonuses + ' bonus)');
    continue;
  }
  const ctx = mockCtx(); let sc = new G.BroomScene(fakeGame, ar, () => {}, () => {}); sc.enter();
  try {
    for (let i = 0; i < 60 * 40 && !sc.done && sc.lost <= 0; i++) { Input.down = { ArrowRight: i % 90 < 45, ArrowLeft: i % 90 >= 45, Space: i % 70 < 8 }; frame(sc, 1 / 60, i % 25 === 0 ? { Enter: true } : {}); if (i % 30 === 0) sc.draw(ctx); }
  } catch (e) { ok(false, name + ' : exception → ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  Input.down = {};
  // 4 touches = on recommence
  let restarted = false; const fg = { go() { restarted = true; }, ctx };
  const sl = new G.BroomScene(fg, ar, () => {}, () => {}); sl.enter(); sl.hits = 3; sl.p.inv = 0; sl.tickets.push({ x: sl.p.x, y: sl.p.y - 20, vx: 0, y0: sl.p.y - 20, t: 0, amp: 0, ph: 0 }); frame(sl, 1 / 60, {});
  ok(sl.lost > 0, name + ' : 4 touches ne déclenchent pas le recommencement');
  for (let i = 0; i < 200; i++) frame(sl, 1 / 60, {}); ok(restarted, name + ' : le niveau ne recommence pas');
  // victoire
  let finished = false; const sw = new G.BroomScene(fakeGame, ar, () => { finished = true; }, () => {}); sw.enter(); sw.complete();
  for (let i = 0; i < 80; i++) frame(sw, 1 / 60, i === 70 ? { Enter: true } : {}); ok(finished, name + ' : onDone non appelé'); sw.draw(ctx);
  console.log('  ' + name.padEnd(12) + '✓ ' + sc.score + '/' + sc.goal + ' tickets balayés par le bot, ' + sc.hits + ' touche(s)');
}

/* ---------- 3c. Détection de l'appareil + commandes tactiles ---------- */
console.log('Tactile');
{
  const g = { go(sc) { g.last = sc; }, ctx: mockCtx() };
  ok(G.Device && G.Device.touch === false, 'Device : le mode clavier doit être le mode par défaut');
  const modes = { LevelScene: 'move', BroomScene: 'broom', DanceScene: 'dance', CutScene: 'cut', ChapterSelect: 'back' };
  const lv = new G.LevelScene(g, G.LEVELS.train, () => {}, () => {}); lv.enter(); ok(lv.touchMode === 'move', 'LevelScene : mode tactile move attendu');
  lv.paused = true; ok(lv.touchMode === 'pause', 'LevelScene en pause : mode pause attendu');
  const bs = new G.BroomScene(g, G.ARENAS.balai, () => {}, () => {}); bs.enter(); ok(bs.touchMode === 'broom', 'BroomScene : mode broom attendu');
  const ds = new G.DanceScene(g, G.ARENAS.danse, () => {}, () => {}); ds.enter(); ok(ds.touchMode === 'dance', 'DanceScene : mode dance attendu');
  const cs = new G.CutScene(g, G.CUTS.casting, () => {}); cs.enter(); ok(cs.touchMode === 'cut', 'CutScene : mode cut attendu');
  const sel = new G.ChapterSelect(g); sel.enter(); ok(sel.touchMode === 'back', 'ChapterSelect : mode back attendu');
  // taps sur l'écran titre : « Choisir un chapitre » ouvre la sélection ; « Jouer » lance l'histoire
  const ti = new G.TitleScene(g); ti.enter(); Input.tap = { x: 480, y: 262 + 58 }; ti.update(1 / 60); Input.tap = null;
  ok(g.last instanceof G.ChapterSelect || g.last === undefined && ti.sel === 1, 'Titre : le tap sur « Choisir un chapitre » ne marche pas');
  g.last = null; const sel2 = new G.ChapterSelect(g); sel2.enter(); Input.tap = { x: 200, y: 100 + 52 * 3 + 10 }; sel2.update(1 / 60); Input.tap = null;
  ok(sel2.sel === 3, 'Sélection de chapitre : le tap sur une ligne ne la sélectionne pas');
  Input.tap = { x: 200, y: 100 + 52 * 3 + 10 }; sel2.update(1 / 60); Input.tap = null; ok(g.last, 'Sélection de chapitre : le second tap ne lance pas le chapitre');
  console.log('  ✓ modes tactiles par scène, taps des menus');
}

/* ---------- 3d. Menu des mini-jeux ---------- */
console.log('Mini-jeux');
{
  const g = { go(sc) { g.last = sc; }, ctx: mockCtx() };
  ok(G.MINIGAMES.length >= 1 && G.MINIGAMES.every(m => m.def && (!m.def.song || G.MUSIC[m.def.song])), 'MINIGAMES : musique introuvable');
  const ti = new G.TitleScene(g); ti.enter(); Input.tap = { x: 480, y: 254 + 100 }; ti.update(1 / 60); Input.tap = null;
  ok(g.last instanceof G.MiniGameSelect, 'Titre : le bouton « Mini-jeux » n\'ouvre pas le menu');
  const mg = new G.MiniGameSelect(g); mg.enter(); g.last = null; Input.tap = { x: 300, y: 150 }; mg.update(1 / 60); Input.tap = null; ok(g.last instanceof G.DanceScene, 'Mini-jeux : le tap sur le mini-jeu sélectionné ne lance pas la danse');
  g.last.enter(); ok(g.last.touchMode === 'dancefree' && g.last.song.length > 200, 'Danse (mini-jeu) : chanson entière attendue');
  console.log('  ✓ menu, taps, chanson entière (' + g.last.arrows.length + ' flèches, ' + Math.round(g.last.song.length) + ' s)');
}

/* ---------- 4. Écrans & dessins ---------- */
console.log('Décors / personnages');
{
  const ctx = mockCtx();
  try {
    for (const name of Object.keys(G.BG)) for (const cx of [0, 500, 1234]) G.drawBackground(ctx, name, cx, 0, 3.3);
    for (const ch of Object.values(G.CHARS)) for (const st of ['idle', 'walk', 'jump', 'fall', 'wave', 'cheer', 'sit', 'hurt']) G.drawCharacter(ctx, ch, 100, 400, { state: st, t: 1.2, facing: -1, talking: true, emote: '!' });
    for (const k of G.ITEM_KINDS) G.drawItem(ctx, k, 50, 50, 1, 1, 2);
    for (const k of Object.keys(G.HAZARDS)) { G.drawHazard(ctx, k, 100, 400, 1, 1, false); G.drawHazard(ctx, k, 100, 400, 1, -1, true); }
    for (const k of ['desk', 'chair', 'dchair', 'table', 'whiteboard', 'banner', 'cake', 'stool', 'counter', 'door', 'seat', 'maki', 'ecran', 'balai', 'tascarottes', 'scene', 'foule', 'longtable']) G.drawProp(ctx, { kind: k, x: 400, y: 480, pieces: 3, check: '#c00', candle: true }, 1);
    const ts = [new G.TitleScene(fakeGame), new G.MiniGameSelect(fakeGame), new G.ChapterSelect(fakeGame), new G.ChapterCard(fakeGame, G.STORY[0], () => {}), new G.CreditsScene(fakeGame)];
    for (const s of ts) { s.enter(); for (let i = 0; i < 30; i++) frame(s, 1 / 30, {}); s.draw(ctx); }
    console.log('  ✓ tous les dessins s\'exécutent sans erreur');
  } catch (e) { ok(false, 'dessins : ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
}
console.log(failures ? '\n' + failures + ' PROBLÈME(S)' : '\nTOUT EST OK');
process.exit(failures ? 1 : 0);
