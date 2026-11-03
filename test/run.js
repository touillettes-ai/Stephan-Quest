// Banc de test sans navigateur : node test/run.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'js');
const src = ['util', 'music', 'draw', 'engine', 'content'].map(f => fs.readFileSync(path.join(dir, f + '.js'), 'utf8')).join('\n');

function mockCtx() {
  const target = { measureText: s => ({ width: String(s).length * 9 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), canvas: { width: 960, height: 544 } };
  return new Proxy(target, { get(t, k) { return k in t ? t[k] : () => {}; }, set(t, k, v) { t[k] = v; return true; } });
}
const G = new Function('window', 'document', 'requestAnimationFrame', src + `
  return { Game, LevelScene, CutScene, TitleScene, ChapterSelect, ChapterCard, CreditsScene, BroomScene, DanceScene, MUSIC, ARENAS, STORY, LEVELS, CUTS, CHARS, Input, Sfx, W, H, TILE, FLOOR_Y, runStep, BG, THEMES, drawBackground, drawCharacter, drawItem, drawHazard, drawProp, ITEM_KINDS, HAZARDS };`
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
  if (ar.type === 'dance') {
    const ctx = mockCtx(), sd = new G.DanceScene(fakeGame, ar, () => {}, () => {}); sd.enter(); const total = sd.arrows.length;
    try {
      for (let i = 0; i < 60 * 52 && !sd.done; i++) {                 // un joueur parfait : appuie pile sur chaque flèche
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
    const ts = [new G.TitleScene(fakeGame), new G.ChapterSelect(fakeGame), new G.ChapterCard(fakeGame, G.STORY[0], () => {}), new G.CreditsScene(fakeGame)];
    for (const s of ts) { s.enter(); for (let i = 0; i < 30; i++) frame(s, 1 / 30, {}); s.draw(ctx); }
    console.log('  ✓ tous les dessins s\'exécutent sans erreur');
  } catch (e) { ok(false, 'dessins : ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
}
console.log(failures ? '\n' + failures + ' PROBLÈME(S)' : '\nTOUT EST OK');
process.exit(failures ? 1 : 0);
