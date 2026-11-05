'use strict';
/* ============================================================
   engine.js : boucle de jeu, scènes (titre, niveau, cinématique…)
   ============================================================ */

/* ---------- particules (confettis, étincelles) ---------- */
function burst(list, x, y, n, colors, power) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.283), s = rnd(40, power || 220);
    list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, life: rnd(0.7, 1.4), max: 1.4, size: rnd(3, 6), c: colors[i % colors.length], rot: rnd(0, 6) });
  }
}
function dust(list, x, y, n, dir) {            // petits nuages de poussière aux pieds (pas, saut, atterrissage)
  for (let i = 0; i < n; i++) list.push({ x: x + rnd(-6, 6), y: y - 2, vx: -dir * rnd(15, 55) + rnd(-35, 35), vy: rnd(-45, -12), life: rnd(0.22, 0.42), max: 0.42, size: rnd(3, 5.5), c: '#e8e2d4', rot: rnd(0, 6), g: 60 });
}
function rain(list, n, colors) {
  for (let i = 0; i < n; i++) list.push({ x: rnd(0, W), y: rnd(-200, -10), vx: rnd(-30, 30), vy: rnd(60, 160), life: rnd(3, 6), max: 6, size: rnd(4, 7), c: colors[i % colors.length], rot: rnd(0, 6), g: 0 });
}
function updateParticles(list, dt) {
  for (const p of list) { p.life -= dt; p.vy += (p.g === undefined ? 520 : p.g) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 8; }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
}
function drawParticles(ctx, list) {
  for (const p of list) {
    ctx.globalAlpha = clamp(p.life / 0.5, 0, 1); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillStyle = p.c; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
const CONFETTI = ['#ff4fa3', '#4fd2ff', '#ffd23f', '#5de27a', '#b98cff', '#ff8a3c'];

/* ============================================================
   Game : gère la scène courante et les fondus
   ============================================================ */
class Game {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    this.scene = null; this.pending = null; this.t = 0; this.fade = 0; this.fadeTarget = 0; this.last = 0;
  }
  go(scene) {
    if (!this.scene) { this.scene = scene; if (scene.enter) scene.enter(); this.fade = 1; this.fadeTarget = 0; return; }
    this.pending = scene; this.fadeTarget = 1;
  }
  update(dt) {
    this.t += dt;
    const sp = dt * 3.4;
    if (this.fade < this.fadeTarget) this.fade = Math.min(this.fadeTarget, this.fade + sp);
    else if (this.fade > this.fadeTarget) this.fade = Math.max(this.fadeTarget, this.fade - sp);
    if (this.pending && this.fade >= 1) {
      this.scene = this.pending; this.pending = null;
      if (this.scene.enter) this.scene.enter();
      this.fadeTarget = 0;
    }
    if (this.scene && !this.pending) this.scene.update(dt);
  }
  draw() {
    this.scene.draw(this.ctx);
    const vg = this.ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.98);      // léger vignettage
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.34)'); this.ctx.fillStyle = vg; this.ctx.fillRect(0, 0, W, H);
    if (this.fade > 0) { this.ctx.fillStyle = 'rgba(0,0,0,' + this.fade + ')'; this.ctx.fillRect(0, 0, W, H); }
    if (Sfx.muted) txt(this.ctx, 'SON COUPÉ (M)', W - 12, H - 10, 11, 'rgba(255,255,255,.6)', 'right');
  }
  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0); this.last = now;
    if (Input.pressed.KeyM && !(this.scene && this.scene.paused)) Sfx.muted = !Sfx.muted;
    this.update(dt); this.draw(); if (this.afterFrame) this.afterFrame(this); Input.endFrame();
    requestAnimationFrame(n => this.loop(n));
  }
  start() { requestAnimationFrame(n => { this.last = n; this.loop(n); }); }
}

/* ============================================================
   Enchaînement de l'histoire (chapitres → cinématiques / niveaux)
   ============================================================ */
function runStep(game, ci, si) {
  const ch = STORY[ci];
  if (!ch) { game.go(new CreditsScene(game)); return; }
  if (si === -1) { game.go(new ChapterCard(game, ch, () => runStep(game, ci, 0))); return; }
  const step = ch.steps[si];
  if (!step) { runStep(game, ci + 1, -1); return; }
  const next = () => runStep(game, ci, si + 1);
  if (step.type === 'cutscene') game.go(new CutScene(game, step, next));
  else if (step.type === 'dance') game.go(new DanceScene(game, step, next, () => game.go(new ChapterSelect(game))));
  else if (step.type === 'broom') game.go(new BroomScene(game, step, next, () => game.go(new ChapterSelect(game))));
  else game.go(new LevelScene(game, step, next, () => game.go(new ChapterSelect(game))));
}
const stepBg = s => (s && (s.bg || s.theme)) || 'openspace';
const chapterBg = ch => stepBg(ch.steps.find(s => s.type !== 'cutscene') || ch.steps[0]);

/* ============================================================
   Boîte de dialogue
   ============================================================ */
function drawDialogue(ctx, d, t) {
  const bx = 24, by = 34, bw = W - 48, bh = 130;   // en haut de l'écran pour ne pas cacher les personnages
  rr(ctx, bx, by, bw, bh, 16, 'rgba(14,18,34,.93)', '#8fa6ff', 2);
  let tx = bx + 26;
  if (d.ch) { drawPortrait(ctx, d.ch, bx + 14, by + 15, 100, 100, t, d.talking, d.mood); tx = bx + 138; }
  let ty = by + 34;
  if (d.name) {
    rr(ctx, tx - 4, by - 14, ctx.measureText ? Math.max(90, d.name.length * 11 + 28) : 120, 26, 10, d.ch ? shade(d.ch.top || '#2f6db5', -0.1) : '#445', '#fff', 2);
    txt(ctx, d.name, tx + 10, by + 4, 15, '#fff');
  }
  const maxW = bw - (tx - bx) - 30;
  if (!d.lines) d.lines = wrapText(ctx, d.text, maxW, 20);
  let left = Math.floor(d.shown);
  const narr = !d.ch && !d.name;
  for (const ln of d.lines) {
    if (left <= 0) break;
    txt(ctx, ln.slice(0, left), narr ? bx + bw / 2 : tx, ty + 14, 20, narr ? '#ffe9a8' : '#fff', narr ? 'center' : 'left', narr ? 'italic bold' : 'bold');
    left -= ln.length + 1; ty += 28;
  }
  if (d.shown >= d.text.length && Math.floor(t * 2.5) % 2 === 0) txt(ctx, '▼', bx + bw - 30, by + bh - 16, 16, '#8fa6ff', 'center');
}

/* ============================================================
   CutScene : cinématique scriptée avec les décors et personnages du jeu
   Un script est une fonction génératrice :
     function*(c) { c.add('hero', CHARS.hero, 100); yield c.walk('hero', 400); yield c.say('hero', 'Salut !'); }
   Voir content.js pour des exemples.
   ============================================================ */
class CutScene {
  constructor(game, def, onDone) { this.game = game; this.def = def; this.onDone = onDone; }
  get touchMode() { return 'cut'; }
  enter() {
    this.t = 0; this.bg = this.def.bg || 'openspace'; this.theme = this.def.theme || this.bg; this.worldW = this.def.worldW || W;
    this.cam = 0; this.follow = null; this.actors = {}; this.props = []; this.dlg = null; this.caption = null; this.card = null;
    this.black = 0; this.shake = 0; this.waiter = null; this.finished = false; this.error = null; this.parts = [];
    this.api = this.makeApi();
    this.gen = this.def.script(this.api);
    this.advance();
  }
  normalize(v) {
    if (!v) return null;
    if (Array.isArray(v)) { const ws = v.filter(Boolean); return ws.length ? { ws, update(dt) { this.ws = this.ws.filter(w => !w.update(dt)); return this.ws.length === 0; } } : null; }
    return v;
  }
  advance() {
    let guard = 0;
    while (!this.finished && guard++ < 500) {
      let r;
      try { r = this.gen.next(); } catch (e) { this.error = e; console.error('Erreur de cinématique :', e); this.finish(); return; }
      if (r.done) { this.finish(); return; }
      const w = this.normalize(r.value);
      if (w) { this.waiter = w; return; }
    }
  }
  finish() { if (this.finished) return; this.finished = true; this.onDone(); }
  makeApi() {
    const S = this;
    const A = k => typeof k === 'string' ? S.actors[k] : k;
    const timer = (dur, fn) => ({ t: 0, update(dt) { this.t = Math.min(dur, this.t + dt); fn(ease(this.t / dur)); return this.t >= dur; } });
    return {
      actors: S.actors,
      /* --- personnages --- */
      add(key, ch, x, o) {
        o = o || {};
        const a = { key, ch, name: o.name || ch.name || key, x, y: o.y === undefined ? FLOOR_Y : o.y, facing: o.face || 1, state: o.state || 'idle', t: rnd(0, 5), emote: null, talking: false, z: o.z || 0 };
        S.actors[key] = a; return a;
      },
      remove(k) { const a = A(k); if (a) delete S.actors[a.key]; },
      walk(k, x, speed) { speed = speed || 120; return { update(dt) { const a = A(k), dx = x - a.x, st = speed * dt; if (Math.abs(dx) <= st) { a.x = x; a.state = 'idle'; return true; } a.facing = dx > 0 ? 1 : -1; a.state = 'walk'; a.x += Math.sign(dx) * st; return false; } }; },
      face(k, d) { const a = A(k); if (typeof d === 'number') a.facing = d; else a.facing = A(d).x >= a.x ? 1 : -1; },
      pose(k, st) { A(k).state = st; },
      teleport(k, x, y) { const a = A(k); a.x = x; if (y !== undefined) a.y = y; },
      emote(k, text, sec) { const a = A(k); a.emote = text; a.emoteT = sec === undefined ? 0 : sec; return null; },   // s'éteint tout seul après `sec` secondes
      jump(k, h) { const a = A(k), y0 = a.y; h = h || 34; Sfx.play('jump'); return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / 0.5); a.y = y0 - Math.sin(p * Math.PI) * h; a.state = p < 1 ? 'jump' : 'idle'; a.squash = p < 0.12 ? 0.9 : p > 0.88 && p < 1 ? 0.88 : 1 + Math.sin(p * Math.PI) * 0.08; if (p >= 1) { a.y = y0; a.squash = undefined; return true; } return false; } }; },
      change(k, patch) { const a = A(k); a.ch = Object.assign({}, a.ch, patch); },
      /* --- dialogues --- */
      mood(k, m) { A(k).mood = m; },                      // happy | laugh | surprised | angry | sad
      say(k, text, o) {
        o = o || {};
        const a = k ? A(k) : null, prevMood = a ? a.mood : undefined;
        if (a && o.mood) a.mood = o.mood;
        const d = { ch: a ? a.ch : null, name: o.name !== undefined ? o.name : (a ? a.name : null), text, shown: 0, last: 0, talking: true, mood: o.mood };
        S.dlg = d;
        return { update(dt) {
          if (d.shown < text.length) {
            d.shown = Math.min(text.length, d.shown + dt * 46);
            const n = Math.floor(d.shown); if (n !== d.last) { if (n % 2 === 0 && text[n - 1] !== ' ') Sfx.play('blip'); d.last = n; }
            if (Input.confirm()) d.shown = text.length;
            if (a) a.talking = d.shown < text.length;
            d.talking = a ? a.talking : false;
            return false;
          }
          if (a) a.talking = false; d.talking = false;
          if (Input.confirm()) { S.dlg = null; if (a && o.mood) a.mood = prevMood; return true; }
          return false;
        } };
      },
      narrate(text) { return this.say(null, text, { name: null }); },
      caption(text, sec) { S.caption = { text }; return { t: 0, update(dt) { this.t += dt; if (this.t >= sec) { S.caption = null; return true; } return false; } }; },
      card(big, small, sec) { S.card = { big, small, t: 0, dur: sec || 2.4 }; return { update(dt) { S.card.t += dt; if (S.card.t >= S.card.dur) { S.card = null; return true; } return false; } }; },
      /* --- caméra & effets --- */
      cam(x, dur) { const x0 = S.cam; S.follow = null; return timer(dur || 1, p => { S.cam = lerp(x0, clamp(x, 0, Math.max(0, S.worldW - W)), p); }); },
      follow(k) { S.follow = k ? A(k) : null; },
      fade(to, dur) { const f0 = S.black; return timer(dur || 0.6, p => { S.black = lerp(f0, to, p); }); },
      shake(sec) { S.shake = sec; },
      sfx(n) { Sfx.play(n); },
      confetti(n) { burst(S.parts, S.cam + W / 2, 200, n || 60, CONFETTI, 360); Sfx.play('pop'); },
      rain(n) { rain(S.parts, n || 80, CONFETTI); },
      burst(x, y, n, colors, power) { burst(S.parts, x, y, n || 30, colors || CONFETTI, power || 360); },      // gerbe de particules à un endroit précis (éclats de verre…)
      bg(name, theme) { S.bg = name; S.theme = theme || name; },
      /* --- accessoires --- */
      prop(kind, x, y, o) { const p = Object.assign({ kind, x, y: y === undefined ? FLOOR_Y : y }, o || {}); S.props.push(p); return p; },
      unprop(p) { S.props = S.props.filter(q => q !== p); },
      /* --- temps --- */
      wait(sec) { return { t: 0, update(dt) { this.t += dt; return this.t >= sec; } }; },
    };
  }
  update(dt) {
    this.t += dt;
    if (Input.back() || Input.pressed.Tab) { this.finish(); return; }
    for (const k in this.actors) { const a = this.actors[k]; a.t += dt; if (a.emoteT > 0) { a.emoteT -= dt; if (a.emoteT <= 0) a.emote = null; } }
    if (this.shake > 0) this.shake -= dt;
    updateParticles(this.parts, dt);
    if (this.follow) this.cam = lerp(this.cam, clamp(this.follow.x - W / 2, 0, Math.max(0, this.worldW - W)), Math.min(1, dt * 3));
    if (this.waiter && this.waiter.update(dt)) { this.waiter = null; this.advance(); }
  }
  draw(ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate(rnd(-4, 4), rnd(-4, 4));
    const cam = Math.round(this.cam);
    drawBackground(ctx, this.bg, cam, 0, this.t);
    for (let tx = Math.floor(cam / TILE); tx <= Math.floor((cam + W) / TILE); tx++)
      for (let ty = FLOOR_Y / TILE; ty < H / TILE; ty++) drawTile(ctx, this.theme, '#', tx * TILE - cam, ty * TILE, ty === FLOOR_Y / TILE, tx, ty);
    ctx.translate(-cam, 0);
    for (const p of this.props) if (!p.front) drawProp(ctx, p, this.t);
    const list = Object.values(this.actors).sort((a, b) => a.z - b.z);
    for (const a of list) drawCharacter(ctx, a.ch, a.x, a.y, { facing: a.facing, state: a.state, t: a.t, talking: a.talking, emote: a.emote, mood: a.mood, squash: a.squash, rot: a.rot });
    for (const p of this.props) if (p.front) drawProp(ctx, p, this.t);
    drawParticles(ctx, this.parts);
    ctx.translate(cam, 0);
    ctx.restore();
    if (this.caption) { const c = this.caption; ctx.font = 'bold 22px ' + FONT; const w = ctx.measureText(c.text).width + 40; rr(ctx, W / 2 - w / 2, 22, w, 44, 12, 'rgba(14,18,34,.85)', '#8fa6ff', 2); txt(ctx, c.text, W / 2, 52, 22, '#fff', 'center'); }
    if (this.dlg) drawDialogue(ctx, this.dlg, this.t);
    if (this.black > 0) { ctx.fillStyle = 'rgba(0,0,0,' + this.black + ')'; ctx.fillRect(0, 0, W, H); }
    if (this.card) {
      const c = this.card, a = Math.min(1, c.t / 0.4, (c.dur - c.t) / 0.4);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = clamp(a, 0, 1);
      txt(ctx, c.big, W / 2, H / 2, 64, '#fff', 'center'); if (c.small) txt(ctx, c.small, W / 2, H / 2 + 44, 24, '#ffe08a', 'center'); ctx.globalAlpha = 1;
    }
    txt(ctx, 'Échap : passer la cinématique', W - 14, H - 10, 12, 'rgba(255,255,255,.7)', 'right');
  }
}

/* ============================================================
   LevelScene : un niveau de plateforme
   ============================================================ */
const PHYS = { speed: 230, jump: 640, grav: 1800, maxFall: 900, accelG: 2600, accelA: 1700, spring: 960 };

class LevelScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.paused ? 'pause' : this.talk || this.done ? 'menu' : 'move'; }
  enter() {
    const d = this.def, m = d.map;
    this.theme = d.theme || 'openspace'; this.bg = d.bg || this.theme;
    this.rows = m.length; this.cols = Math.max.apply(null, m.map(r => r.length));
    this.grid = m.map(r => r.padEnd(this.cols, '.').split(''));
    this.chase = null; this.trail = []; this.items = []; this.enemies = []; this.checks = []; this.springs = []; this.exit = null; this.start = { x: 48, y: FLOOR_Y };
    this.got = {}; this.need = {}; this.parts = [];
    const hz = d.hazards || ['chair', 'mail'];
    for (let ty = 0; ty < this.rows; ty++) for (let tx = 0; tx < this.cols; tx++) {
      const c = this.grid[ty][tx], cx = tx * TILE + TILE / 2, by = (ty + 1) * TILE;
      let clear = true;
      if (c === 'S') this.start = { x: cx, y: by };
      else if (c === 'X') this.exit = { x: cx, y: by, open: false };
      else if (c === 'C') this.checks.push({ x: cx, y: by, on: false });
      else if (c === 'M' && d.chase) { this.chase = { key: d.chase.key, k: d.chase.k, trigger: d.chase.trigger || 280, path: [{ x: cx, y: by }].concat(d.chase.path.map(([tx, row]) => ({ x: tx * TILE + TILE / 2, y: row * TILE }))), i: 0, x: cx, y: by, dir: -1, alert: false, caught: false, hop: null, wait: 0, t: 0, state: 'idle' }; this.need[d.chase.k] = 1; this.got[d.chase.k] = 0; }
      else if (c === '^') this.springs.push({ tx, ty, x: cx, y: by, anim: 0 });
      else if (c >= '1' && c <= '9') { const k = +c; this.items.push({ kind: d.items[k - 1], v: k, x: cx, y: ty * TILE + TILE / 2, taken: false, ph: rnd(0, 6) }); this.need[k] = (this.need[k] || 0) + 1; this.got[k] = 0; }
      else if (c === 'e' || c === 'E') this.enemies.push(this.makeEnemy(c === 'E' && hz[1] && !HAZARDS[hz[1]].fly ? hz[1] : hz[0], cx, ty));
      else if (c === 'f') this.enemies.push(this.makeEnemy(hz.find(h => HAZARDS[h].fly) || 'mail', cx, ty));
      else clear = false;
      if (clear) this.grid[ty][tx] = '.';
    }
    if (d.need) for (const k in d.need) this.need[k] = d.need[k];
    this.p = { x: this.start.x, y: this.start.y, vx: 0, vy: 0, w: 20, h: 50, face: 1, ground: false, coyote: 0, jbuf: 0, state: 'idle', t: 0, dead: 0, inv: 0, rot: 0, spawn: { x: this.start.x, y: this.start.y } };
    this.cam = { x: 0, y: 0 }; this.snapCam();
    this.talk = null; this.t = 0; this.falls = 0; this.done = false; this.doneT = 0; this.paused = false; this.toastMsg = null; this.exitWarn = 0;
  }
  makeEnemy(type, cx, ty) {
    const H0 = HAZARDS[type]; let y = (ty + 1) * TILE;
    const e = { type, w: H0.w, h: H0.h, x: cx, y, x0: cx, y0: y, dir: Math.random() < 0.5 ? -1 : 1, t: rnd(0, 6), alive: true, squash: 0, fly: H0.fly, speed: H0.speed, range: 52 + Math.floor(rnd(0, 3)) * 16 };
    if (!e.fly) { let ty2 = ty, g = 0; while (g++ < 8 && !this.solidFloor(Math.floor(cx / TILE), ty2 + 1)) ty2++; e.y = (ty2 + 1) * TILE; }
    return e;
  }
  snapCam() { const p = this.p; this.cam.x = clamp(p.x - W / 2, 0, Math.max(0, this.cols * TILE - W)); this.cam.y = clamp(p.y - H * 0.7, 0, Math.max(0, this.rows * TILE - H)); }
  tile(tx, ty) { if (tx < 0 || tx >= this.cols) return '#'; if (ty < 0 || ty >= this.rows) return '.'; return this.grid[ty][tx]; }
  solidFloor(tx, ty) { const c = this.tile(tx, ty); return c === '#' || c === '='; }
  toast(s) { this.toastMsg = { s, t: 2.2 }; }

  /* ----- physique ----- */
  moveX(dx) {
    const p = this.p; p.x += dx;
    const l = p.x - p.w / 2, r = p.x + p.w / 2, top = p.y - p.h + 1, bot = p.y - 0.5;
    for (let ty = Math.floor(top / TILE); ty <= Math.floor(bot / TILE); ty++) {
      if (dx > 0) { const tx = Math.floor(r / TILE); if (this.tile(tx, ty) === '#') { p.x = tx * TILE - p.w / 2 - 0.001; p.vx = 0; break; } }
      else if (dx < 0) { const tx = Math.floor(l / TILE); if (this.tile(tx, ty) === '#') { p.x = (tx + 1) * TILE + p.w / 2 + 0.001; p.vx = 0; break; } }
    }
  }
  moveY(dy) {
    const p = this.p, prev = p.y; p.y += dy;
    const l = p.x - p.w / 2 + 1, r = p.x + p.w / 2 - 1;
    if (dy > 0) {
      const ty = Math.floor(p.y / TILE);
      for (let tx = Math.floor(l / TILE); tx <= Math.floor(r / TILE); tx++) {
        const c = this.tile(tx, ty);
        if (c === '#' || (c === '=' && prev <= ty * TILE + 1)) { p.y = ty * TILE; p.vy = 0; p.ground = true; break; }
      }
    } else if (dy < 0) {
      const ty = Math.floor((p.y - p.h) / TILE);
      for (let tx = Math.floor(l / TILE); tx <= Math.floor(r / TILE); tx++) {
        if (this.tile(tx, ty) === '#') { p.y = (ty + 1) * TILE + p.h; p.vy = 0; break; }
      }
    }
  }
  physics(h) {
    const p = this.p;
    if (p.dead > 0) { p.vy += PHYS.grav * h; p.y += p.vy * h; p.x += p.vx * h; p.rot += h * 9; return; }
    const g = (p.vy < 0 && !Input.jumpHeld()) ? PHYS.grav * 2.2 : PHYS.grav;
    p.vy = Math.min(PHYS.maxFall, p.vy + g * h);
    this.moveX(p.vx * h);
    p.ground = false; this.moveY(p.vy * h);
  }
  control(dt) {
    const p = this.p; if (p.dead > 0) return;
    const ax = (Input.right() ? 1 : 0) - (Input.left() ? 1 : 0);
    p.vx = approach(p.vx, ax * PHYS.speed, (ax === 0 ? 2.2 : 1) * (p.ground ? PHYS.accelG : PHYS.accelA) * dt);
    if (ax) p.face = ax;
    p.coyote = p.ground ? 0.1 : p.coyote - dt;
    p.jbuf = Input.jumpPressed() ? 0.12 : p.jbuf - dt;
    if (p.jbuf > 0 && p.coyote > 0) { p.vy = -PHYS.jump; p.jbuf = 0; p.coyote = 0; p.ground = false; Sfx.play('jump'); p.stretch = 0.2; dust(this.parts, p.x, p.y, 5, 0); }
  }
  hurt(kind) {
    const p = this.p; if (p.dead > 0 || p.inv > 0 || this.done) return;
    this.falls++; Sfx.play('hurt');
    if (kind === 'fall') { p.dead = 0.55; p.vy = 0; p.vx = 0; this.toast('Plouf !'); }
    else { p.dead = 0.9; p.vy = -460; p.vx = -p.face * 90; this.toast('Aïe !'); }
  }
  respawn() { this.trail = []; const p = this.p; p.x = p.spawn.x; p.y = p.spawn.y; p.vx = 0; p.vy = 0; p.dead = 0; p.rot = 0; p.inv = 1.6; p.ground = false; this.snapCam(); }

  /* ----- boucle ----- */
  update(dt) {
    if (Input.back() || Input.pressed.KeyP) this.paused = !this.paused;
    if (this.paused) {
      if (Input.pressed.KeyR) this.game.go(new LevelScene(this.game, this.def, this.onDone, this.onQuit));
      if (Input.pressed.KeyM) this.onQuit();
      if (Input.pressed.Enter) this.paused = false;
      return;
    }
    if (Input.pressed.KeyR && !this.done) { this.game.go(new LevelScene(this.game, this.def, this.onDone, this.onQuit)); return; }
    this.t += dt;
    updateParticles(this.parts, dt);
    if (this.toastMsg) { this.toastMsg.t -= dt; if (this.toastMsg.t <= 0) this.toastMsg = null; }
    if (this.talk) { this.updateTalk(dt); return; }
    if (this.done) {
      this.doneT += dt;
      if (this.doneT > 0.8 && Input.confirm()) this.onDone({ falls: this.falls, time: this.t });
      return;
    }
    const p = this.p;
    this.control(dt);
    const n = Math.max(1, Math.ceil(dt / (1 / 90))), h = dt / n;
    const vy0 = p.vy, g0 = p.ground;
    for (let i = 0; i < n; i++) this.physics(h);
    if (p.ground && !g0 && vy0 > 260 && p.dead <= 0) { p.land = 0.22; dust(this.parts, p.x, p.y, 8, 0); }
    if (p.land > 0) p.land -= dt; if (p.stretch > 0) p.stretch -= dt;
    if (p.dead <= 0 && p.y > this.rows * TILE + 100) this.hurt('fall');
    if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) this.respawn(); }
    if (p.inv > 0) p.inv -= dt;
    p.t += dt;
    if (p.ground && Math.abs(p.vx) > 60 && p.dead <= 0) { this.stepT = (this.stepT || 0) - dt; if (this.stepT <= 0) { this.stepT = 0.17; dust(this.parts, p.x - p.face * 8, p.y, 2, p.face); } }
    p.state = p.dead > 0 ? 'hurt' : !p.ground ? (p.vy < 0 ? 'jump' : 'fall') : Math.abs(p.vx) > 20 ? 'walk' : 'idle';
    this.entities(dt);
    if (this.def.follower) { this.trail.push({ t: this.t, x: p.x, y: p.y, face: p.face, state: p.state }); while (this.trail.length > 1 && this.trail[0].t < this.t - 1.2) this.trail.shift(); }
    const tx = p.x - W / 2 + p.face * 40, ty = p.y - H * 0.7;
    this.cam.x = clamp(lerp(this.cam.x, tx, Math.min(1, dt * 5)), 0, Math.max(0, this.cols * TILE - W));
    this.cam.y = clamp(lerp(this.cam.y, ty, Math.min(1, dt * 5)), 0, Math.max(0, this.rows * TILE - H));
  }
  entities(dt) {
    const p = this.p, alive = p.dead <= 0;
    for (const s of this.springs) {
      s.anim = Math.max(0, s.anim - dt * 5);
      if (alive && p.vy >= 0 && Math.abs(p.x - s.x) < 18 && p.y > s.ty * TILE + 18 && p.y < s.ty * TILE + TILE + 6) { p.vy = -PHYS.spring; p.ground = false; s.anim = 1; Sfx.play('spring'); }
    }
    for (const c of this.checks) if (alive && !c.on && Math.abs(p.x - c.x) < 22 && Math.abs(p.y - c.y) < 40) {
      this.checks.forEach(o => o.on = false); c.on = true; p.spawn = { x: c.x, y: c.y }; Sfx.play('check'); this.toast('Café ! Point de reprise'); burst(this.parts, c.x, c.y - 30, 14, ['#ffe08a', '#fff'], 140);
    }
    for (const it of this.items) if (!it.taken && alive && Math.abs(p.x - it.x) < 22 && p.y - p.h / 2 > it.y - 38 && p.y - p.h / 2 < it.y + 38 + 10) {
      it.taken = true; this.got[it.v]++; Sfx.play('coin'); burst(this.parts, it.x, it.y, 10, ['#ffe08a', '#fff', '#8fe3ff'], 150);
      if (this.def.talks && this.def.talks[it.v]) this.startTalk(this.def.talks[it.v]);
      if (this.allDone() && this.exit && !this.exit.open) { this.exit.open = true; Sfx.play('door'); this.toast('Tout est là ! Cap sur la sortie →'); }
    }
    if (this.chase) this.updateChase(this.chase, dt);
    for (const e of this.enemies) {
      if (!e.alive) { e.squash += dt; continue; }
      e.t += dt;
      if (e.fly) { e.x = e.x0 + Math.sin(e.t * 1.2) * e.range; e.y = e.y0 + Math.sin(e.t * 2.4) * 8; e.dir = Math.cos(e.t * 1.2) >= 0 ? 1 : -1; }
      else {
        e.x += e.dir * e.speed * dt;
        const ax = e.x + e.dir * (e.w / 2 + 2), tx = Math.floor(ax / TILE);
        if (this.tile(tx, Math.floor((e.y - 6) / TILE)) === '#' || !this.solidFloor(tx, Math.floor((e.y + 4) / TILE))) { e.dir = -e.dir; e.x += e.dir * 2; }
      }
      if (alive && p.inv <= 0 && Math.abs(p.x - e.x) < (p.w + e.w) / 2 - 3 && p.y > e.y - e.h && p.y - p.h < e.y) {
        if (p.vy > 60 && p.y < e.y - e.h + 20) { e.alive = false; p.vy = -430; p.ground = false; Sfx.play('stomp'); burst(this.parts, e.x, e.y - e.h / 2, 8, ['#fff', '#ccc'], 120); }
        else this.hurt('enemy');
      }
    }
    if (this.exit && alive && Math.abs(p.x - this.exit.x) < 26 && Math.abs(p.y - this.exit.y) < 40) {
      if (this.exit.open) this.complete();
      else if (this.exitWarn <= 0) { this.exitWarn = 2.5; this.toast('Il manque encore ' + this.remaining() + ' élément(s) !'); }
    }
    if (this.exitWarn > 0) this.exitWarn -= dt;
  }
  /* ----- poursuite : un personnage qui bondit de plateforme en plateforme quand on s'approche (def.chase + 'M' dans la carte) ----- */
  updateChase(m, dt) {
    const p = this.p, alive = p.dead <= 0; m.t += dt;
    if (m.caught) {                                     // une fois attrapé, il suit le héros
      m.x += (p.x - p.face * 30 - m.x) * Math.min(1, dt * 6); m.y += (p.y - m.y) * Math.min(1, dt * 12); m.dir = p.face;
      m.state = p.state === 'walk' ? 'walk' : (p.ground ? 'idle' : 'jump'); return;
    }
    if (!m.alert && alive && Math.abs(p.x - m.x) < m.trigger) { m.alert = true; this.toast(CHARS[m.key].name + ' t\'a repéré ! Il file !'); Sfx.play('spring'); }
    if (m.alert && !m.hop && m.i < m.path.length - 1) {
      if (m.wait > 0) m.wait -= dt;
      else if (Math.abs(p.x - m.x) < 230) { const a = m.path[m.i], b = m.path[m.i + 1]; m.hop = { a, b, u: 0, dur: 0.75, arc: 46 + Math.max(0, a.y - b.y) * 0.5 }; m.dir = b.x >= a.x ? 1 : -1; Sfx.play('jump'); }
    }
    if (m.hop) {
      const h = m.hop; h.u = Math.min(1, h.u + dt / h.dur);
      m.x = lerp(h.a.x, h.b.x, h.u); m.y = lerp(h.a.y, h.b.y, h.u) - Math.sin(h.u * Math.PI) * h.arc; m.state = 'jump';
      if (h.u >= 1) { m.i++; m.hop = null; m.wait = 0.5; }
    } else m.state = m.alert && m.i >= m.path.length - 1 ? 'wave' : 'idle';
    if (alive && Math.abs(p.x - m.x) < 24 && p.y > m.y - 58 && p.y - p.h < m.y) {
      m.caught = true; this.got[m.k]++; Sfx.play('coin'); burst(this.parts, m.x, m.y - 30, 16, ['#ffe08a', '#fff', '#f4a6b8'], 170);
      if (this.def.talks && this.def.talks[m.k]) this.startTalk(this.def.talks[m.k]);
      if (this.allDone() && this.exit && !this.exit.open) { this.exit.open = true; Sfx.play('door'); this.toast('Tout est là ! Cap sur la sortie →'); }
    }
  }

  /* ----- petites scènes de dialogue pendant le niveau (def.talks = { numéroObjet: [[perso|null, texte], …] }) ----- */
  startTalk(lines) { this.talk = { lines, i: -1, d: null, age: 0 }; this.nextTalk(); }
  nextTalk() {
    const k = this.talk; k.i++;
    if (k.i >= k.lines.length) { this.talk = null; return; }
    const [who, text] = k.lines[k.i], ch = who ? CHARS[who] : null;
    k.d = { ch, name: ch ? ch.name : null, text, shown: 0, last: 0, talking: true }; k.age = 0;
  }
  updateTalk(dt) {
    const k = this.talk, d = k.d; k.age += dt;
    if (d.shown < d.text.length) {
      d.shown = Math.min(d.text.length, d.shown + dt * 46);
      const n = Math.floor(d.shown); if (n !== d.last) { if (n % 2 === 0 && d.text[n - 1] !== ' ') Sfx.play('blip'); d.last = n; }
      d.talking = d.shown < d.text.length;
      if (Input.confirm() && k.age > 0.15) d.shown = d.text.length;
    } else { d.talking = false; if (Input.confirm() && k.age > 0.15) this.nextTalk(); }
  }
  remaining() { let r = 0; for (const k in this.need) r += Math.max(0, this.need[k] - this.got[k]); return r; }
  allDone() { return this.remaining() === 0; }
  complete() { this.talk = null; this.done = true; this.doneT = 0; Sfx.play('win'); burst(this.parts, this.exit.x, this.exit.y - 40, 70, CONFETTI, 380); }

  /* ----- affichage ----- */
  draw(ctx) {
    const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
    drawBackground(ctx, this.bg, cx, cy, this.t);
    ctx.save(); ctx.translate(-cx, -cy);
    const x0 = Math.floor(cx / TILE), x1 = Math.min(this.cols - 1, Math.floor((cx + W) / TILE)), y0 = Math.floor(cy / TILE), y1 = Math.min(this.rows - 1, Math.floor((cy + H) / TILE));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const c = this.grid[ty][tx];
      if (c === '#') drawTile(ctx, this.theme, '#', tx * TILE, ty * TILE, this.tile(tx, ty - 1) !== '#', tx, ty);
      else if (c === '=') drawTile(ctx, this.theme, '=', tx * TILE, ty * TILE, true, tx, ty);
    }
    for (const d of this.def.decor || []) drawProp(ctx, d, this.t);                    // décor posé dans le niveau (def.decor = [{kind, x, y}])
    for (const s of this.springs) drawSpring(ctx, s.x, s.y, s.anim);
    for (const c of this.checks) drawCoffeeMachine(ctx, c.x, c.y, c.on, this.t);
    if (this.exit) drawDoor(ctx, this.exit.x, this.exit.y, this.exit.open, this.t, this.def.exitLabel);
    for (const it of this.items) if (!it.taken) {
      const bob = String(it.kind).startsWith('npc:') ? 0 : Math.sin(this.t * 3 + it.ph) * 3;
      ctx.globalAlpha = 0.22 + 0.1 * Math.sin(this.t * 4 + it.ph); circ(ctx, it.x, it.y + bob, 19, '#fff6b0'); ctx.globalAlpha = 1;
      drawItem(ctx, it.kind, it.x, it.y + bob, 1, this.t, it.v);
      if (!String(it.kind).startsWith('npc:')) { const sp = 0.5 + 0.5 * Math.sin(this.t * 5 + it.ph), q = 2 + 4 * sp; ctx.save(); ctx.translate(it.x + 12, it.y + bob - 13); ctx.rotate(this.t * 0.8); ctx.globalAlpha = 0.35 + 0.55 * sp; poly(ctx, [[0, -q], [1.3, -1.3], [q, 0], [1.3, 1.3], [0, q], [-1.3, 1.3], [-q, 0], [-1.3, -1.3]], '#fff'); ctx.restore(); }
    }
    if (this.chase) {
      const m = this.chase;
      if (this.def.chase.mount) {                 // monté sur une monture (ex. un cheval gonflable)
        const bob = Math.abs(Math.sin(m.t * 9)) * (m.state === 'jump' ? 0 : 5);
        drawProp(ctx, { kind: this.def.chase.mount, x: m.x, y: m.y - bob, face: m.dir }, m.t);
        drawCharacter(ctx, CHARS[m.key], m.x - m.dir * 6, m.y - 38 - bob, { facing: m.dir, state: 'sit', t: m.t });
      } else drawCharacter(ctx, CHARS[m.key], m.x, m.y, { facing: m.dir, state: m.state, t: m.t });
    }
    for (const e of this.enemies) if (!e.alive && e.squash > 0.5) continue; else drawHazard(ctx, e.type, e.x, e.y, e.t, e.dir, !e.alive);
    if (this.def.follower && this.trail.length) { const tt = this.t - 0.45; let sm = this.trail[0]; for (const q of this.trail) { if (q.t <= tt) sm = q; else break; } drawCharacter(ctx, CHARS[this.def.follower], sm.x, sm.y, { facing: sm.face, state: sm.state, t: this.t }); }
    const p = this.p;
    if (!(p.inv > 0 && p.dead <= 0 && Math.floor(this.t * 14) % 2 === 0)) { let sq = 1; if (p.land > 0) sq = 1 - 0.2 * (p.land / 0.22); else if (p.stretch > 0) sq = 1 + 0.14 * (p.stretch / 0.2); else if (!p.ground && p.dead <= 0) sq = 1 + Math.min(0.08, Math.abs(p.vy) / 7000);
      drawCharacter(ctx, CHARS.hero, p.x, p.y, { facing: p.face, state: p.state, t: p.t, rot: p.dead > 0 ? p.rot : 0, noShadow: p.dead > 0, squash: sq === 1 ? undefined : sq }); }
    drawParticles(ctx, this.parts);
    ctx.restore();
    this.drawHUD(ctx);
    if (this.talk) drawDialogue(ctx, this.talk.d, this.t);
  }
  drawHUD(ctx) {
    const keys = Object.keys(this.need), pw = 24 + keys.length * 98;
    rr(ctx, 12, 10, pw, 46, 12, 'rgba(14,18,34,.8)', 'rgba(143,166,255,.6)', 1.5);
    let x = 24;
    for (const k of keys) {
      const ik = this.def.items[k - 1];
      if (String(ik).startsWith('npc:')) drawPortrait(ctx, CHARS[ik.slice(4)], x, 19, 28, 28, this.t, false); else drawItem(ctx, ik, x + 14, 33, 0.95, this.t, +k);
      const done = this.got[k] >= this.need[k];
      txt(ctx, this.got[k] + '/' + this.need[k], x + 36, 40, 19, done ? '#7dffa0' : '#fff'); x += 98;
    }
    rr(ctx, W - 150, 10, 138, 34, 12, 'rgba(14,18,34,.8)'); txt(ctx, 'Chutes : ' + this.falls, W - 81, 33, 16, '#fff', 'center');
    if (this.t < 4.5) {
      const a = clamp(Math.min(this.t / 0.4, (4.5 - this.t) / 0.6), 0, 1); ctx.globalAlpha = a;
      rr(ctx, W / 2 - 300, 70, 600, 70, 14, 'rgba(14,18,34,.88)', '#8fa6ff', 2);
      txt(ctx, this.def.title, W / 2, 98, 24, '#ffe08a', 'center'); txt(ctx, this.def.objective || '', W / 2, 126, 17, '#fff', 'center'); ctx.globalAlpha = 1;
    }
    if (this.toastMsg) { const a = clamp(this.toastMsg.t / 0.4, 0, 1); ctx.globalAlpha = a; ctx.font = 'bold 20px ' + FONT; const w = ctx.measureText(this.toastMsg.s).width + 36; rr(ctx, W / 2 - w / 2, H - 70, w, 38, 12, 'rgba(14,18,34,.9)', '#8fa6ff', 2); txt(ctx, this.toastMsg.s, W / 2, H - 45, 20, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (this.done) {
      drawParticles(ctx, this.parts);
      rr(ctx, W / 2 - 250, 150, 500, 220, 18, 'rgba(14,18,34,.94)', '#ffd23f', 3);
      txt(ctx, 'Niveau terminé !', W / 2, 205, 36, '#ffd23f', 'center');
      txt(ctx, this.def.title, W / 2, 240, 20, '#fff', 'center');
      txt(ctx, 'Chutes : ' + this.falls + '   ·   Temps : ' + Math.round(this.t) + ' s', W / 2, 288, 20, '#cfd8ff', 'center');
      if (this.doneT > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, 'Entrée pour continuer', W / 2, 340, 18, '#8fa6ff', 'center');
    }
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'PAUSE', W / 2, 220, 56, '#fff', 'center');
      txt(ctx, Device.touch ? 'Touche un bouton ci-dessous' : 'Entrée / Échap : reprendre   ·   R : recommencer   ·   M : retour au menu', W / 2, 270, 18, '#cfd8ff', 'center');
    }
  }
}

/* ============================================================
   BroomScene : arène « coup de balai » — des tickets arrivent, on les balaie
   (def : { type:'broom', thrower:'franck', goal:24, bg, theme, title, objective })
   ============================================================ */
class BroomScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.paused ? 'pause' : this.done ? 'menu' : 'broom'; }
  enter() {
    const d = this.def;
    this.bg = d.bg || 'circuit'; this.theme = d.theme || 'circuit'; this.goal = d.goal || 24;
    this.t = 0; this.p = { x: 240, y: FLOOR_Y, vy: 0, ground: true, state: 'idle', t: 0, inv: 0 };
    this.b = { x: 150, y: FLOOR_Y };
    this.hop = 0; this.tickets = []; this.parts = []; this.spawnT = 1.6; this.swing = 0; this.hits = 0; this.score = 0; this.throwAnim = 0;
    this.done = false; this.doneT = 0; this.lost = 0; this.paused = false; this.toastMsg = null; this.flash = 0;
  }
  toast(s) { this.toastMsg = { s, t: 2.2 }; }
  restart() { this.game.go(new BroomScene(this.game, this.def, this.onDone, this.onQuit)); }
  complete() { if (this.done) return; this.done = true; this.doneT = 0; this.tickets = []; Sfx.play('win'); burst(this.parts, 480, 200, 90, CONFETTI, 380); }
  update(dt) {
    if (Input.back() || Input.pressed.KeyP) this.paused = !this.paused;
    if (this.paused) {
      if (Input.pressed.KeyR) this.restart();
      if (Input.pressed.KeyM) this.onQuit();
      if (Input.pressed.Enter) this.paused = false;
      return;
    }
    if (Input.pressed.KeyR && !this.done) { this.restart(); return; }
    this.t += dt; updateParticles(this.parts, dt);
    if (this.toastMsg) { this.toastMsg.t -= dt; if (this.toastMsg.t <= 0) this.toastMsg = null; }
    if (this.flash > 0) this.flash -= dt;
    if (this.done) { this.doneT += dt; if (this.doneT > 0.8 && Input.confirm()) this.onDone({ time: this.t }); return; }
    if (this.lost > 0) { this.lost -= dt; if (this.lost <= 0) this.restart(); return; }
    const p = this.p, ax = (Input.right() ? 1 : 0) - (Input.left() ? 1 : 0);
    p.x = clamp(p.x + ax * PHYS.speed * 0.9 * dt, 150, 600);
    if (p.ground && Input.jumpPressed()) { p.vy = -PHYS.jump; p.ground = false; Sfx.play('jump'); }
    p.vy += PHYS.grav * dt; p.y += p.vy * dt;
    if (p.y >= FLOOR_Y) { p.y = FLOOR_Y; p.vy = 0; p.ground = true; }
    p.state = !p.ground ? 'jump' : ax ? 'walk' : 'idle'; p.t += dt; if (p.inv > 0) p.inv -= dt;
    this.b.x += (p.x - 85 - this.b.x) * Math.min(1, dt * 8); this.b.y += (p.y - this.b.y) * Math.min(1, dt * 10);
    if (this.swing > -0.12) this.swing -= dt;
    if (['Enter', 'NumpadEnter', 'KeyE', 'KeyX', 'KeyF'].some(k => Input.pressed[k]) && this.swing <= -0.12) { this.swing = 0.3; this.hop = 0.42; Sfx.play('stomp'); dust(this.parts, this.b.x, this.b.y, 5, 0); }          // Stephan balaie, Bastien saute et balaie aussi
    this.throwAnim = Math.max(0, this.throwAnim - dt);
    if (this.hop > 0) { this.hop -= dt; if (this.hop <= 0) dust(this.parts, this.b.x, this.b.y, 5, 0); }
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const prog = this.score / this.goal, lvl = [452, 405, 330][Math.floor(Math.random() * 3)];
      const n = Math.random() < 0.22 ? 2 : 1;
      for (let i = 0; i < n; i++) { const yy = i ? [452, 405, 330].filter(v => v !== lvl)[Math.floor(Math.random() * 2)] : lvl; this.tickets.push({ x: 830 + i * 70, y: yy, y0: yy, vx: -rnd(150, 440) * (1 + 0.4 * prog), t: 0, amp: Math.random() < 0.35 ? rnd(10, 32) : 0, ph: rnd(0, 6) }); }
      this.throwAnim = 0.35; Sfx.play('blip'); this.spawnT = rnd(0.7, 1.3) * (1 - 0.35 * prog) + 0.2;
    }
    const bb = this.bastienPos();
    const zone = (o, tk) => tk.x > o.x + 8 && tk.x < o.x + 112 && tk.y > o.y - 118 && tk.y < o.y + 8;
    const body = (o, tk) => Math.abs(tk.x - o.x) < 26 && tk.y > o.y - 66 && tk.y < o.y + 6;
    for (const tk of this.tickets) {
      tk.t += dt; tk.x += tk.vx * dt; tk.y = tk.y0 + Math.sin(tk.t * 5 + tk.ph) * tk.amp;
      if (this.swing > 0 && (zone(p, tk) || zone(bb, tk))) {
        tk.dead = true; this.score++; Sfx.play('coin'); burst(this.parts, tk.x, tk.y, 10, ['#ffe08a', '#fff', '#ff8a6a'], 170);
        if (this.score >= this.goal) { this.complete(); return; }
      } else if (p.inv <= 0 && (body(p, tk) || body(bb, tk))) {
        tk.dead = true; this.hits++; p.inv = 0.7; this.flash = 0.25; Sfx.play('hurt'); burst(this.parts, tk.x, tk.y, 8, ['#d6402f', '#fff'], 150);
        if (this.hits >= 4) { this.lost = 1.6; this.toast('Touchés 4 fois… on recommence !'); } else this.toast('Aïe ! ' + this.hits + '/4');
      } else if (tk.x < -60) tk.dead = true;
    }
    this.tickets = this.tickets.filter(tk => !tk.dead);
  }
  bastienPos() { const k = this.hop > 0 ? 1 - this.hop / 0.42 : 0; return { x: this.b.x, y: this.b.y - (this.hop > 0 ? Math.sin(k * Math.PI) * 64 : 0) }; }       // Bastien saute à chaque coup de balai
  broom(ctx, o, delay) {
    const k = this.swing > 0 ? clamp(1 - (this.swing - delay) / 0.3, 0, 1) : 0, ang = this.swing > 0 ? lerp(-2.1, 0.75, ease(k)) : 1.4;
    drawBroom(ctx, o.x + 8, o.y - 47, ang, 62);
  }
  draw(ctx) {
    drawBackground(ctx, this.bg, this.t * 40, 0, this.t);
    for (let tx = 0; tx <= W / TILE; tx++) for (let ty = FLOOR_Y / TILE; ty < H / TILE; ty++) drawTile(ctx, this.theme, '#', tx * TILE, ty * TILE, ty === FLOOR_Y / TILE, tx, ty);
    const th = this.def.thrower || 'franck';
    rr(ctx, 800, FLOOR_Y - 36, 130, 36, 6, '#14543c', '#d9b64a', 2); rect(ctx, 800, FLOOR_Y - 36, 130, 5, '#d9b64a');
    drawCharacter(ctx, CHARS[th], 865, FLOOR_Y - 36, { facing: -1, state: this.throwAnim > 0 ? 'wave' : 'idle', t: this.t });
    const p = this.p, blink = p.inv > 0 && Math.floor(this.t * 14) % 2 === 0;
    const bb = this.bastienPos(), hk = this.hop > 0 ? 1 - this.hop / 0.42 : 0;
    drawCharacter(ctx, CHARS.bastien, bb.x, bb.y, { facing: 1, state: this.hop > 0 ? 'jump' : p.state, t: this.t, squash: this.hop > 0 ? (hk < 0.15 ? 0.9 : 1 + Math.sin(hk * Math.PI) * 0.08) : undefined, mood: this.hop > 0 ? 'laugh' : undefined }); this.broom(ctx, bb, 0.1);
    if (!blink) drawCharacter(ctx, CHARS.hero, p.x, p.y, { facing: 1, state: p.state, t: p.t });
    this.broom(ctx, p, 0);
    for (const tk of this.tickets) drawTicketHDR(ctx, tk.x, tk.y, this.t + tk.ph);
    drawParticles(ctx, this.parts);
    if (this.flash > 0) { ctx.fillStyle = 'rgba(255,40,40,' + this.flash * 0.6 + ')'; ctx.fillRect(0, 0, W, H); }
    this.drawHUD(ctx);
  }
  drawHUD(ctx) {
    rr(ctx, 12, 10, 330, 46, 12, 'rgba(14,18,34,.8)', 'rgba(143,166,255,.6)', 1.5);
    drawTicketHDR(ctx, 50, 33, 0); txt(ctx, this.score + '/' + this.goal, 90, 41, 20, this.score >= this.goal ? '#7dffa0' : '#fff');
    for (let i = 0; i < 4; i++) { circ(ctx, 214 + i * 30, 33, 10, i < 4 - this.hits ? '#ff5a6a' : '#3a2f3a'); circ(ctx, 214 + i * 30, 33, 10, 'rgba(0,0,0,0)'); }
    txt(ctx, 'vies', 168, 39, 14, '#cfd8ff', 'center');
    if (this.t < 6) {
      const a = clamp(Math.min(this.t / 0.4, (6 - this.t) / 0.6), 0, 1); ctx.globalAlpha = a;
      rr(ctx, W / 2 - 330, 70, 660, 78, 14, 'rgba(14,18,34,.88)', '#8fa6ff', 2);
      txt(ctx, this.def.title || 'Coup de balai', W / 2, 98, 24, '#ffe08a', 'center'); txt(ctx, this.def.objective || '', W / 2, 124, 16, '#fff', 'center');
      txt(ctx, Device.touch ? 'Boutons : ◀ ▶ bouger · ⤒ sauter · BALAI : coup de balai' : '← → bouger · Espace sauter · Entrée / E : coup de balai', W / 2, 144, 14, '#cfd8ff', 'center'); ctx.globalAlpha = 1;
    }
    if (this.toastMsg) { const a = clamp(this.toastMsg.t / 0.4, 0, 1); ctx.globalAlpha = a; ctx.font = 'bold 20px ' + FONT; const w = ctx.measureText(this.toastMsg.s).width + 36; rr(ctx, W / 2 - w / 2, H - 70, w, 38, 12, 'rgba(14,18,34,.9)', '#8fa6ff', 2); txt(ctx, this.toastMsg.s, W / 2, H - 45, 20, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (this.done) {
      rr(ctx, W / 2 - 250, 150, 500, 200, 18, 'rgba(14,18,34,.94)', '#ffd23f', 3);
      txt(ctx, 'Backlog nettoyé !', W / 2, 205, 36, '#ffd23f', 'center'); txt(ctx, this.score + ' tickets HDR balayés · ' + this.hits + ' touche(s)', W / 2, 250, 20, '#cfd8ff', 'center');
      if (this.doneT > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, 'Entrée pour continuer', W / 2, 310, 18, '#8fa6ff', 'center');
    }
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H); txt(ctx, 'PAUSE', W / 2, 220, 56, '#fff', 'center');
      txt(ctx, Device.touch ? 'Touche un bouton ci-dessous' : 'Entrée / Échap : reprendre   ·   R : recommencer   ·   M : retour au menu', W / 2, 270, 18, '#cfd8ff', 'center');
    }
  }
}

/* ============================================================
   DanceScene : jeu de rythme façon DDR sur un extrait de musique (MUSIC, music.js)
   def : { type:'dance', song:'dancing', bg, theme, title, objective }
   1 point par flèche réussie, +BONUS toutes les 10 flèches réussies.
   ============================================================ */
const DANCE = { speed: 220, hitY: 70, spawnY: 395, win: 0.17, perfect: 0.07, bonus: 10, every: 10, lead: 2.6 };
const DANCE_LANES = { x: [360, 440, 520, 600], color: ['#ff5ac8', '#4fd8ff', '#7dff7d', '#ffb347'], keys: [['ArrowLeft', 'KeyA'], ['ArrowDown', 'KeyS'], ['ArrowUp', 'KeyW'], ['ArrowRight', 'KeyD']] };
class DanceScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.done ? 'menu' : this.def.free ? 'dancefree' : 'dance'; }
  enter() {
    this.song = MUSIC[this.def.song || 'dancing']; this.bg = this.def.bg || 'bar'; this.theme = this.def.theme || 'bar';
    this.arrows = this.song.arrows.map(([t, lane]) => ({ t, lane, state: 0 }));
    this.t = 0; this.score = 0; this.hits = 0; this.misses = 0; this.combo = 0; this.best = 0; this.bonuses = 0; this.pops = []; this.parts = []; this.pressed = [0, 0, 0, 0];
    this.done = false; this.doneT = 0; this.pose = 0; this.poseT = 0; this.cast = this.def.guests || ['coline', 'amelie', 'sheryna', 'youssef', 'imen', 'cecile', 'franck', 'danila', 'hakim', 'cowboy', 'arno', 'justine', 'sandie', 'bastien', 'olivier', 'chef'];
    this.started = false; Music.start(this.song, DANCE.lead);
  }
  songTime() { return Music.playing ? Music.time() : this.t - DANCE.lead; }
  restart() { Music.stop(); this.game.go(new DanceScene(this.game, this.def, this.onDone, this.onQuit)); }
  pop(text, color, y) { this.pops.push({ text, color, y: y || 200, t: 0 }); }
  finish() {
    if (this.done) return; this.done = true; this.doneT = 0; Music.stop(); Sfx.play('win'); burst(this.parts, 480, 150, 90, CONFETTI, 380);
    if (this.def.free) { const key = 'dance.' + (this.def.song || 'dancing'); this.prevBest = Best.get(key); this.record = this.score > this.prevBest; if (this.record) Best.set(key, this.score); }
  }
  update(dt) {
    if (this.def.free && Input.back()) { Music.stop(); this.onQuit(); return; }                    // mini-jeu : Échap = retour au menu
    if (Input.pressed.KeyR && !this.done) { this.restart(); return; }
    this.t += dt; updateParticles(this.parts, dt); this.poseT -= dt;
    for (let i = 0; i < 4; i++) this.pressed[i] = Math.max(0, this.pressed[i] - dt);
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < 0.9);
    Music.update();
    if (this.done) { this.doneT += dt; if (this.doneT > 0.8 && Input.confirm()) this.onDone({ score: this.score }); return; }
    const st = this.songTime();
    for (let lane = 0; lane < 4; lane++) {
      if (!DANCE_LANES.keys[lane].some(k => Input.pressed[k])) continue;
      this.pressed[lane] = 0.15;
      let best = null; for (const a of this.arrows) if (a.state === 0 && a.lane === lane && Math.abs(a.t - st) <= DANCE.win && (!best || Math.abs(a.t - st) < Math.abs(best.t - st))) best = a;
      if (!best) { this.combo = 0; continue; }
      best.state = 1; this.hits++; this.score++; this.combo++; this.best = Math.max(this.best, this.combo);
      const perfect = Math.abs(best.t - st) <= DANCE.perfect;
      Sfx.play('coin'); this.pop(perfect ? 'PARFAIT !' : 'BIEN', perfect ? '#ffe08a' : '#8fe3ff', 120);
      burst(this.parts, DANCE_LANES.x[lane], DANCE.hitY, 8, [DANCE_LANES.color[lane], '#fff'], 150);
      this.pose = lane; this.poseT = 0.28;
      if (this.hits % DANCE.every === 0) { this.score += DANCE.bonus; this.bonuses++; this.pop('BONUS +' + DANCE.bonus + ' !', '#ff9af0', 170); Sfx.play('win'); burst(this.parts, 480, 120, 40, CONFETTI, 300); }
    }
    for (const a of this.arrows) if (a.state === 0 && st - a.t > DANCE.win) { a.state = 2; this.misses++; this.combo = 0; }
    if (st > this.song.length + 0.8) this.finish();
  }
  draw(ctx) {
    const st = this.songTime(), beat = Math.max(0, st) * this.song.bpm / 60;
    drawBackground(ctx, this.bg, 0, 0, this.t);
    for (let tx = 0; tx <= W / TILE; tx++) for (let ty = FLOOR_Y / TILE; ty < H / TILE; ty++) {      // piste de danse lumineuse
      drawTile(ctx, this.theme, '#', tx * TILE, ty * TILE, ty === FLOOR_Y / TILE, tx, ty);
      ctx.globalAlpha = 0.35; rect(ctx, tx * TILE, ty * TILE, TILE, TILE, ['#ff4fa3', '#4fd8ff', '#ffe08a', '#7dff7d'][(tx + ty + Math.floor(beat)) % 4]); ctx.globalAlpha = 1;
    }
    // invités qui dansent (fond), Stephan en première ligne
    const row = this.cast, per = 10, fx = [120, 240, 360, 600, 720, 840];
    row.forEach((k, i) => { const back = i < per, x = back ? 50 + i * 92 : fx[(i - per) % 6], y = back ? FLOOR_Y + 6 : FLOOR_Y + 36; drawCharacter(ctx, CHARS[k], x, y, { facing: x < 480 ? 1 : -1, state: ['cheer', 'wave', 'idle'][(Math.floor(beat) + i) % 3], t: this.t + i }); });
    const hs = this.poseT > 0 ? ['wave', 'jump', 'cheer', 'wave'][this.pose] : (Math.floor(beat * 2) % 2 ? 'cheer' : 'idle');
    drawCharacter(ctx, CHARS.hero, 480, FLOOR_Y + 52, { facing: 1, state: hs, t: this.t });
    // couloir des flèches
    rr(ctx, 320, 18, 320, 380, 14, 'rgba(10,8,30,.62)', 'rgba(255,255,255,.3)', 2);
    for (let l = 0; l < 4; l++) { const x = DANCE_LANES.x[l]; ctx.globalAlpha = 0.5 + 0.5 * (this.pressed[l] > 0 ? 1 : 0); drawArrow(ctx, x, DANCE.hitY, l, this.pressed[l] > 0 ? DANCE_LANES.color[l] : 'rgba(255,255,255,.08)', 25, DANCE_LANES.color[l]); ctx.globalAlpha = 1; }
    for (const a of this.arrows) {
      if (a.state === 1) continue;
      const y = DANCE.hitY + (a.t - st) * DANCE.speed; if (y > DANCE.spawnY + 30 || y < -40) continue;
      ctx.globalAlpha = a.state === 2 ? 0.25 : clamp((DANCE.spawnY + 30 - y) / 40, 0, 1);
      drawArrow(ctx, DANCE_LANES.x[a.lane], y, a.lane, DANCE_LANES.color[a.lane], 25, '#fff'); ctx.globalAlpha = 1;
    }
    drawParticles(ctx, this.parts);
    for (const p of this.pops) { ctx.globalAlpha = clamp(1 - p.t / 0.9, 0, 1); txt(ctx, p.text, 480, p.y - p.t * 30, p.text.startsWith('BONUS') ? 36 : 28, p.color, 'center'); ctx.globalAlpha = 1; }
    this.drawHUD(ctx, st);
  }
  drawHUD(ctx, st) {
    rr(ctx, 12, 10, 270, 74, 12, 'rgba(14,18,34,.82)', 'rgba(143,166,255,.6)', 1.5);
    txt(ctx, 'Points : ' + this.score, 26, 38, 22, '#ffe08a'); txt(ctx, 'Combo : ' + this.combo, 26, 62, 16, '#cfd8ff'); txt(ctx, 'Flèches : ' + this.hits + '/' + this.arrows.length, 150, 62, 16, '#cfd8ff');
    rr(ctx, 26, 70, 242, 8, 4, 'rgba(255,255,255,.15)'); rr(ctx, 26, 70, 242 * ((this.hits % DANCE.every) / DANCE.every), 8, 4, '#ff9af0');
    const left = clamp(1 - Math.max(0, st) / this.song.length, 0, 1), secs = Math.ceil(left * this.song.length);
    rr(ctx, W - 150, 10, 138, 34, 12, 'rgba(14,18,34,.82)'); txt(ctx, secs >= 100 ? Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0') : secs + ' s', W - 81, 34, 20, '#fff', 'center');
    rr(ctx, W - 150, 50, 138, 6, 3, 'rgba(255,255,255,.18)'); rr(ctx, W - 150, 50, 138 * (1 - left), 6, 3, '#ffd23f');
    if (st < 0) txt(ctx, st < -1.6 ? 'Prêts ?' : Math.ceil(-st), 480, 230, 54, '#fff', 'center');
    if (this.t < 7) { const a = clamp(Math.min(this.t / 0.4, (7 - this.t) / 0.6), 0, 1); ctx.globalAlpha = a; rr(ctx, 160, 410, 640, 40, 12, 'rgba(14,18,34,.88)', '#8fa6ff', 2); txt(ctx, Device.touch ? 'Touche la bonne flèche (en bas) au bon moment !' : '← ↑ ↓ → (ou Q Z S D) : appuie sur la bonne flèche au bon moment !', 480, 436, 16, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (this.done) {
      const ratio = this.hits / this.arrows.length;
      rr(ctx, W / 2 - 260, 90, 520, 250, 18, 'rgba(14,18,34,.95)', '#ffd23f', 3);
      txt(ctx, ratio > 0.85 ? 'Dancing King !' : ratio > 0.5 ? 'Belle prestation !' : 'On a dansé, c\'est l\'essentiel !', W / 2, 145, 34, '#ffd23f', 'center');
      txt(ctx, this.score + ' points', W / 2, 192, 30, '#fff', 'center');
      txt(ctx, this.hits + '/' + this.arrows.length + ' flèches · ' + this.bonuses + ' bonus · meilleur combo ' + this.best, W / 2, 232, 18, '#cfd8ff', 'center');
      if (this.def.free) txt(ctx, this.record ? 'Nouveau record !' : 'Record : ' + this.prevBest + ' points', W / 2, 268, 20, this.record ? '#7dffa0' : '#ffe08a', 'center');
      if (this.doneT > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, 'Entrée pour continuer', W / 2, 308, 18, '#8fa6ff', 'center');
    }
  }
}

/* ============================================================
   Écrans : titre, sélection de chapitre, carte de chapitre, générique
   ============================================================ */
function drawLogo(ctx, text, cx, y, size, t) {                // grand titre doré, lettre par lettre
  ctx.font = 'bold ' + size + 'px ' + FONT; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  let x = cx - ctx.measureText(text).width / 2;
  for (const chr of text) {
    const w = ctx.measureText(chr).width, by = y + Math.sin(t * 3 + x * 0.02) * 4;
    ctx.font = 'bold ' + size + 'px ' + FONT; ctx.lineWidth = 11; ctx.strokeStyle = '#4a1a5e'; ctx.strokeText(chr, x, by + 3);
    ctx.lineWidth = 6; ctx.strokeStyle = '#8a2fa8'; ctx.strokeText(chr, x, by);
    const g = ctx.createLinearGradient(0, by - size * 0.8, 0, by); g.addColorStop(0, '#fff7b0'); g.addColorStop(1, '#ffb000'); ctx.fillStyle = g; ctx.fillText(chr, x, by);
    x += w;
  }
}
const TEAM_KEYS = ['coline', 'amelie', 'sheryna', 'youssef', 'imen', 'cecile', 'franck', 'danila', 'hakim', 'matthieu', 'arno', 'justine', 'sandie', 'bastien', 'olivier', 'chef'];
class TitleScene {
  constructor(game) { this.game = game; }
  enter() {
    this.ownTap = true; this.t = 0; this.sel = 0; this.parts = [];
    const fx = [120, 240, 360, 600, 720, 840];
    this.cast = TEAM_KEYS.map((k, i) => ({ ch: CHARS[k === 'matthieu' ? 'cowboy' : k], x: i < 10 ? 50 + i * 92 : fx[(i - 10) % 6], y: i < 10 ? FLOOR_Y + 6 : FLOOR_Y + 36, t: i * 0.37, i }));
    this.cast.push({ ch: CHARS.hero, x: 480, y: FLOOR_Y + 40, t: 0, i: 99, hero: true });
  }
  update(dt) {
    this.t += dt; for (const c of this.cast) c.t += dt; updateParticles(this.parts, dt);
    if (Math.random() < dt * 4) burst(this.parts, rnd(60, 900), 0, 3, CONFETTI, 30);
    if (Input.menuUp()) { this.sel = (this.sel + 2) % 3; Sfx.play('blip'); } else if (Input.menuDown()) { this.sel = (this.sel + 1) % 3; Sfx.play('blip'); }
    if (Input.tap) for (let i = 0; i < 3; i++) { const y = 254 + i * 50; if (Math.abs(Input.tap.x - W / 2) < 180 && Input.tap.y > y - 32 && Input.tap.y < y + 18) { this.sel = i; this.go(); return; } }
    if (Input.confirm()) this.go();
  }
  go() { Sfx.play('door'); if (this.sel === 0) runStep(this.game, 0, -1); else if (this.sel === 1) this.game.go(new ChapterSelect(this.game)); else this.game.go(new MiniGameSelect(this.game)); }
  draw(ctx) {
    drawBackground(ctx, 'bar', this.t * 30, 0, this.t);
    for (let x = 0; x < W; x += TILE) for (let y = FLOOR_Y; y < H; y += TILE) { drawTile(ctx, 'bar', '#', x, y, y === FLOOR_Y, x / TILE, y / TILE); ctx.globalAlpha = 0.3; rect(ctx, x, y, TILE, TILE, ['#ff4fa3', '#4fd8ff', '#ffe08a', '#7dff7d'][(x / TILE + y / TILE + Math.floor(this.t * 1.6)) % 4]); ctx.globalAlpha = 1; }
    for (const c of this.cast) drawCharacter(ctx, c.ch, c.x, c.y, { facing: c.x < 480 ? 1 : -1, state: c.hero ? (Math.floor(this.t * 1.6) % 2 ? 'cheer' : 'wave') : ['cheer', 'wave', 'idle'][(Math.floor(this.t * 1.6) + c.i) % 3], t: c.t });
    drawParticles(ctx, this.parts);
    ctx.fillStyle = 'rgba(8,6,24,.45)'; ctx.fillRect(0, 0, W, 330);
    const tl = CONFIG.title.split('\n'), ty0 = tl.length > 1 ? 80 : 122, sz = tl.length > 1 ? 62 : 72;
    tl.forEach((l, i) => drawLogo(ctx, l, W / 2, ty0 + i * 64, sz, this.t + i * 0.5));
    const ry = ty0 + (tl.length - 1) * 64 + 24;
    rr(ctx, W / 2 - 270, ry, 540, 44, 10, '#d6402f', '#fff', 3); poly(ctx, [[W / 2 - 270, ry + 14], [W / 2 - 296, ry + 14], [W / 2 - 280, ry + 22], [W / 2 - 296, ry + 32], [W / 2 - 270, ry + 32]], '#a02a1e'); poly(ctx, [[W / 2 + 270, ry + 14], [W / 2 + 296, ry + 14], [W / 2 + 280, ry + 22], [W / 2 + 296, ry + 32], [W / 2 + 270, ry + 32]], '#a02a1e');
    txt(ctx, CONFIG.subtitle, W / 2, ry + 31, 24, '#fff', 'center');
    ['Jouer', 'Choisir un chapitre', 'Mini-jeux'].forEach((s, i) => {
      const y = 254 + i * 50, on = this.sel === i, pulse = on ? 4 * Math.sin(this.t * 6) : 0;
      if (on) { ctx.globalAlpha = 0.35; rr(ctx, W / 2 - 190, y - 32, 380, 50, 25, '#ffd23f'); ctx.globalAlpha = 1; }
      rr(ctx, W / 2 - 170, y - 28, 340, 44, 22, on ? '#ffd23f' : 'rgba(20,16,44,.88)', on ? '#fff' : 'rgba(255,255,255,.35)', 2.5);
      txt(ctx, s, W / 2, y + 2, 25, on ? '#2a1a3e' : '#fff', 'center');
      if (on) { txt(ctx, '▶', W / 2 - 150 + pulse, y + 2, 20, '#2a1a3e', 'center'); txt(ctx, '◀', W / 2 + 150 - pulse, y + 2, 20, '#2a1a3e', 'center'); }
    });
    rr(ctx, 70, H - 36, W - 140, 26, 13, 'rgba(8,6,24,.7)');
    txt(ctx, Device.touch ? 'Touche un bouton pour jouer   ·   Touche l\'écran pour faire défiler les dialogues   ·   Boutons à l\'écran : bouger / sauter / pause' : '← → (ou Q D) : bouger   ·   Espace (ou Z / ↑) : sauter   ·   Entrée : dialogues   ·   Échap : pause   ·   M : son', W / 2, H - 18, 13, 'rgba(255,255,255,.92)', 'center');
  }
}

/* ============================================================
   AuraScene : « Battle d'aura » — Stephan contre Arno, chacun son tour sur 15 flèches (mécanique DDR)
   def : { type:'aura', mode:'cpu'|'duo', song:'full' } · 3 manches gagnées = victoire
   ============================================================ */
const AURA = { arrows: 15, sudden: 5, speed: 193, hitY: 62, spawnY: 335, travel: 1.4, toWin: 3, lead: 2.0, bar: 2.4, win: 0.17, perfect: 0.07, resultT: 3.6 };
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
class AuraScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.over ? 'menu' : 'dancefree'; }
  enter() {
    const keys = this.def.songs || ['dre', 'gangsta']; this.songKey = keys[Math.floor(Math.random() * keys.length)];          // une chanson au hasard à chaque match
    this.song = MUSIC[this.songKey]; this.s0 = this.song.start || 0; this.cpu = this.def.mode !== 'duo';
    const mk = (key, name, x, face, color) => ({ key, name, x, face, color, lane: [x - 90, x - 30, x + 30, x + 90], wins: 0, combo: 0, aura: 0, fx: null, fxT: 0, active: false });
    this.p = [mk('hero', 'Stephan', 300, 1, '#ffd23f'), mk('arno', 'Arno', 660, -1, '#b46bff')];
    this.t = 0; this.parts = []; this.arrows = []; this.round = 1; this.turn = 0; this.pt = 0; this.pressed = [0, 0, 0, 0]; this.pops = [];
    this.score = [{ hits: 0, perf: 0 }, { hits: 0, perf: 0 }]; this.roundWinner = -2; this.sudden = false; this.n = AURA.arrows; this.off = 0; this.over = false; this.winner = -1; this.phase = 'intro'; this.shake = 0; this.tearT = 0;
    Music.start(this.song, AURA.lead, this.s0);
  }
  songTime() { return Music.playing ? Music.time() : this.t - AURA.lead + this.s0 - this.off; }
  pop(text, color, x, y) { this.pops.push({ text, color, x, y, t: 0 }); }
  startRound(st) {
    if (st > this.song.length - 34) { Music.start(this.song, 0.4, this.s0); this.off = this.t - AURA.lead + 0.4; st = this.songTime(); }   // la chanson repart du début si la partie dure longtemps
    this.score = [{ hits: 0, perf: 0 }, { hits: 0, perf: 0 }]; this.roundWinner = -2; this.n = this.sudden ? AURA.sudden : AURA.arrows; this.startTurn(0, st);
  }
  startTurn(i, st) {                                                              // les flèches sont posées sur les vrais temps forts de la chanson (grosse caisse, caisse claire, clap)
    this.turn = i; const hits = this.song.hits, from = st + AURA.travel + 0.7, arr = []; let k = 0, lastLane = -1, run = 0;
    while (k < hits.length && hits[k] < from) k++;
    for (; k < hits.length && arr.length < this.n; k++) {
      let lane = Math.floor(Math.random() * 4);
      if (lane === lastLane) { if (++run >= 2) { lane = (lane + 1 + Math.floor(Math.random() * 3)) % 4; run = 0; } } else run = 0;
      arr.push({ t: hits[k], lane, state: 0 }); lastLane = lane;
    }
    this.arrows = arr; this.firstT = arr.length ? arr[0].t : from; this.lastT = arr.length ? arr[arr.length - 1].t : from; this.p.forEach((q, j) => { q.active = j === i; q.combo = 0; });
    const cpuP = clamp(0.66 + 0.05 * (this.round - 1) + 0.06 * (this.p[0].wins - this.p[1].wins) + rnd(-0.1, 0.1), 0.5, 0.95);
    if (this.cpu && i === 1) for (const a of arr) { a.cpuHit = Math.random() < cpuP; a.cpuT = a.t + rnd(-0.07, 0.07); }
    this.phase = 'turn';
  }
  hit(i, a, perfect) {
    const q = this.p[i]; a.state = 1; this.score[i].hits++; if (perfect) this.score[i].perf++; q.combo++;
    const poses = ['cheer', 'wave', 'jump', 'cheer'];                              // mouvements aléatoires façon battle d'aura
    q.fx = { pose: poses[Math.floor(Math.random() * 4)], rot: rnd(-0.28, 0.28), dx: rnd(-16, 16), dy: rnd(-14, 0), sq: rnd(0.9, 1.14), mood: Math.random() < 0.5 ? 'laugh' : 'happy' }; q.fxT = 0.38;
    burst(this.parts, q.x, FLOOR_Y - 60, perfect ? 12 : 7, [q.color, '#fff', hexA(q.color, 0.8)], 200); this.shake = 0.12;
    this.pop(perfect ? 'PARFAIT' : 'BIEN', perfect ? '#ffe08a' : '#8fe3ff', q.x, 300);
    Sfx.play(this.cpu && i === 1 ? 'blip' : 'coin');
  }
  resolveRound() {
    const a = this.score[0], b = this.score[1], d = a.hits !== b.hits ? a.hits - b.hits : a.perf - b.perf;
    this.roundWinner = d > 0 ? 0 : d < 0 ? 1 : -1; this.phase = 'result'; this.pt = 0; this.p.forEach(q => { q.active = false; });
    this.sudden = this.roundWinner === -1;                                         // égalité parfaite : manche décisive en mort subite (5 flèches chacun)
    if (this.roundWinner >= 0) { this.p[this.roundWinner].wins++; Sfx.play('win'); burst(this.parts, this.p[this.roundWinner].x, FLOOR_Y - 90, 50, CONFETTI, 360); }
  }
  endMatch() {
    this.over = true; this.phase = 'end'; this.pt = 0; this.winner = this.p[0].wins >= AURA.toWin ? 0 : 1; Music.stop(); Sfx.play('win');
    burst(this.parts, this.p[this.winner].x, FLOOR_Y - 90, 90, CONFETTI, 420);
    if (this.cpu && this.winner === 0) Best.set('aura.cpu', Best.get('aura.cpu') + 1);
  }
  update(dt) {
    if (Input.back()) { Music.stop(); this.onQuit(); return; }
    this.t += dt; this.pt += dt; updateParticles(this.parts, dt); Music.update();
    if (this.shake > 0) this.shake -= dt;
    for (const o of this.pops) o.t += dt; this.pops = this.pops.filter(o => o.t < 0.8);
    for (let i = 0; i < 4; i++) this.pressed[i] = Math.max(0, this.pressed[i] - dt);
    const st = this.songTime();
    for (const q of this.p) {                                                       // l'aura monte avec le combo et brûle en flammèches
      q.aura += ((q.active && q.combo > 0 ? Math.min(1, 0.3 + q.combo / 7) : 0) - q.aura) * Math.min(1, dt * 4); if (q.fxT > 0) q.fxT -= dt;
      if (q.aura > 0.25 && Math.random() < dt * 40 * q.aura) this.parts.push({ x: q.x + rnd(-24, 24), y: FLOOR_Y - rnd(0, 50), vx: rnd(-18, 18), vy: rnd(-130, -60), g: -40, life: rnd(0.5, 0.95), max: 0.95, size: rnd(3, 6), c: Math.random() < 0.4 ? '#fff' : q.color, rot: rnd(0, 6) });
    }
    if (this.phase === 'result' || this.phase === 'end') {                         // le perdant pleure
      this.tearT -= dt;
      if (this.tearT <= 0) { this.tearT = 0.06; const loser = this.phase === 'end' ? 1 - this.winner : this.roundWinner >= 0 ? 1 - this.roundWinner : -1;
        if (loser >= 0) { const q = this.p[loser]; this.parts.push({ x: q.x + q.face * 12, y: FLOOR_Y - 58, vx: q.face * rnd(10, 45), vy: rnd(-40, 10), g: 420, life: 0.7, max: 0.7, size: 4, c: '#6ad0ff', rot: 0 }); } }
    }
    switch (this.phase) {
      case 'intro': if (st >= this.s0 + 1.4) this.startRound(st); break;
      case 'turn': this.updateTurn(st); break;
      case 'result': if (this.pt > AURA.resultT) { if (this.p.some(q => q.wins >= AURA.toWin)) this.endMatch(); else { if (this.roundWinner !== -1) this.round++; this.startRound(st); } } break;
      case 'end': if (this.pt > 1 && Input.confirm()) { Music.stop(); this.onDone({ winner: this.winner }); } break;
    }
  }
  updateTurn(st) {
    const i = this.turn, human = !(this.cpu && i === 1);
    if (human) for (let lane = 0; lane < 4; lane++) {
      if (!DANCE_LANES.keys[lane].some(k => Input.pressed[k])) continue;
      this.pressed[lane] = 0.15; let best = null;
      for (const a of this.arrows) if (a.state === 0 && a.lane === lane && Math.abs(a.t - st) <= AURA.win && (!best || Math.abs(a.t - st) < Math.abs(best.t - st))) best = a;
      if (best) this.hit(i, best, Math.abs(best.t - st) <= AURA.perfect); else this.p[i].combo = 0;
    } else for (const a of this.arrows) if (a.state === 0 && a.cpuHit && st >= a.cpuT) this.hit(i, a, Math.abs(a.cpuT - a.t) <= AURA.perfect);
    for (const a of this.arrows) if (a.state === 0 && st - a.t > AURA.win) { a.state = 2; this.p[i].combo = 0; }
    if (st > this.lastT + 0.9) { if (i === 0) this.startTurn(1, st); else this.resolveRound(); }
  }
  drawFighter(ctx, q, i) {
    const res = this.phase === 'result' || this.phase === 'end', win = res && (this.phase === 'end' ? this.winner === i : this.roundWinner === i), lose = res && (this.phase === 'end' ? this.winner !== i : this.roundWinner === 1 - i);
    let state = 'idle', dx = 0, dy = 0, rot = 0, sq, mood;
    if (win) { state = 'cheer'; dy = -Math.abs(Math.sin(this.t * 9)) * 36; mood = 'laugh'; }
    else if (lose) { state = 'idle'; rot = 0.16 * q.face; mood = 'sad'; }
    else if (q.fxT > 0) { const f = q.fx; state = f.pose; dx = f.dx; dy = f.dy; rot = f.rot; sq = f.sq; mood = f.mood; }
    if (q.aura > 0.03) {                                                            // halo d'aura
      const cx = q.x + dx, cy = FLOOR_Y - 50, r = (60 + 75 * q.aura) * (1 + Math.sin(this.t * 9 + i) * 0.08), g = ctx.createRadialGradient(cx, cy, 6, cx, cy, r);
      g.addColorStop(0, hexA(q.color, 0.6 * q.aura)); g.addColorStop(1, hexA(q.color, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy - 12, r * 0.8, r * 1.2, 0, 0, 6.2832); ctx.fill();
    }
    drawCharacter(ctx, CHARS[q.key], q.x + dx, FLOOR_Y + dy, { facing: q.face, state, t: this.t + i * 1.3, rot, squash: sq, mood });
  }
  drawPanel(ctx, q, i, st) {
    const x0 = q.lane[0] - 40, w = q.lane[3] - q.lane[0] + 80, on = q.active;
    ctx.globalAlpha = on ? 1 : 0.4; rr(ctx, x0, 14, w, AURA.spawnY + 12, 14, 'rgba(10,8,30,.68)', on ? q.color : 'rgba(255,255,255,.3)', on ? 3 : 2);
    for (let l = 0; l < 4; l++) drawArrow(ctx, q.lane[l], AURA.hitY, l, on && this.pressed[l] > 0 ? DANCE_LANES.color[l] : 'rgba(255,255,255,.07)', 21, DANCE_LANES.color[l]);
    if (on) for (const a of this.arrows) {
      if (a.state === 1) continue; const y = AURA.hitY + (a.t - st) * AURA.speed; if (y > AURA.spawnY + 24 || y < -30) continue;
      ctx.globalAlpha = a.state === 2 ? 0.25 : clamp((AURA.spawnY + 24 - y) / 40, 0, 1); drawArrow(ctx, q.lane[a.lane], y, a.lane, DANCE_LANES.color[a.lane], 21, '#fff');
    }
    ctx.globalAlpha = 1;
    txt(ctx, this.score[i].hits + '/' + this.n, x0 + w - 12, AURA.spawnY + 2, 18, on ? '#ffe08a' : 'rgba(255,255,255,.5)', 'right');
  }
  draw(ctx) {
    const st = this.songTime(), sh = this.shake > 0 ? rnd(-3, 3) : 0;
    ctx.save(); ctx.translate(sh, sh);
    drawBackground(ctx, 'openspace', 0, 0, this.t);
    for (let tx = 0; tx <= W / TILE; tx++) for (let ty = FLOOR_Y / TILE; ty < H / TILE; ty++) drawTile(ctx, 'openspace', '#', tx * TILE, ty * TILE, ty === FLOOR_Y / TILE, tx, ty);
    ctx.fillStyle = 'rgba(8,6,24,.35)'; ctx.fillRect(0, 0, W, H);
    this.p.forEach((q, i) => this.drawFighter(ctx, q, i));
    drawParticles(ctx, this.parts);
    this.p.forEach((q, i) => this.drawPanel(ctx, q, i, st));
    for (const o of this.pops) { ctx.globalAlpha = clamp(1 - o.t / 0.8, 0, 1); txt(ctx, o.text, o.x, o.y - o.t * 40, 22, o.color, 'center'); ctx.globalAlpha = 1; }
    ctx.restore();
    this.drawHUD(ctx, st);
  }
  drawHUD(ctx, st) {
    rr(ctx, W / 2 - 100, 8, 200, 34, 12, 'rgba(14,18,34,.85)', 'rgba(143,166,255,.6)', 1.5); txt(ctx, this.sudden ? 'MORT SUBITE' : 'MANCHE ' + this.round, W / 2, 32, 20, this.sudden ? '#ff7a7a' : '#ffe08a', 'center');
    rr(ctx, 8, H - 34, 250, 26, 13, 'rgba(14,18,34,.72)'); txt(ctx, '♪ ' + this.song.title + ' — ' + this.song.artist, 22, H - 16, 13, '#fff');
    this.p.forEach((q, i) => {
      const x = i === 0 ? 20 : W - 20, al = i === 0 ? 'left' : 'right';
      txt(ctx, q.name, x, 62, 20, q.color, al);
      for (let k = 0; k < AURA.toWin; k++) { const cx = i === 0 ? 26 + k * 24 : W - 26 - k * 24; circ(ctx, cx, 80, 8, k < q.wins ? q.color : 'rgba(255,255,255,.18)'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, 80, 8, 0, 6.2832); ctx.stroke(); }
    });
    let msg = null, sub = null;
    if (this.phase === 'intro') { msg = 'BATTLE D\'AURA'; sub = 'Stephan  VS  Arno · premier à ' + AURA.toWin + ' manches'; }
    else if (this.phase === 'turn' && st < this.firstT - AURA.travel + 0.3) { msg = (this.sudden ? 'MORT SUBITE · ' : '') + 'Au tour de ' + this.p[this.turn].name + ' !'; sub = (this.cpu && this.turn === 1) ? 'L\'ordinateur joue…' : this.n + ' flèches : fais le plus de points !'; }
    else if (this.phase === 'result') {
      const tied = this.score[0].hits === this.score[1].hits, why = tied && this.roundWinner >= 0 ? ' (plus de coups parfaits)' : '';
      msg = this.roundWinner < 0 ? 'Égalité parfaite !' : 'Manche pour ' + this.p[this.roundWinner].name + ' !';
      sub = this.roundWinner < 0 ? 'Mort subite : ' + AURA.sudden + ' flèches chacun pour départager' : this.p[0].name + ' ' + this.score[0].hits + '/' + this.n + '  ·  ' + this.p[1].name + ' ' + this.score[1].hits + '/' + this.n + why;
    }
    if (msg) { rr(ctx, W / 2 - 280, 172, 560, sub ? 82 : 54, 16, 'rgba(14,18,34,.88)', '#ffd23f', 3); txt(ctx, msg, W / 2, 212, 30, '#ffd23f', 'center'); if (sub) txt(ctx, sub, W / 2, 242, 17, '#cfd8ff', 'center'); }
    if (this.over) {
      rr(ctx, W / 2 - 280, 120, 560, 150, 18, 'rgba(14,18,34,.94)', '#ffd23f', 3);
      txt(ctx, this.p[this.winner].name + ' gagne le match !', W / 2, 180, 36, '#ffd23f', 'center'); txt(ctx, this.p[0].wins + ' - ' + this.p[1].wins, W / 2, 222, 28, '#fff', 'center');
      if (this.pt > 1 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, 'Entrée pour continuer', W / 2, 255, 17, '#8fa6ff', 'center');
    }
    if (this.t < 6 && this.phase !== 'end') { ctx.globalAlpha = clamp(Math.min(this.t / 0.4, (6 - this.t) / 0.6), 0, 1); txt(ctx, Device.touch ? 'Touche les flèches en bas quand c\'est ton tour !' : '← ↑ ↓ → (ou Q Z S D) : appuie sur la bonne flèche à ton tour !', W / 2, H - 22, 15, '#fff', 'center'); ctx.globalAlpha = 1; }
  }
}

/* ============================================================
   BunnyScene : « Lapin Sport » (façon Yeti Sport) — Matthieu en lapin saute d'un immeuble, Stephan le frappe à la batte
   1) fixer l'angle  2) frapper quand le lapin passe dans le cercle  3) booster en vol (carottes) · 3 lancers, meilleur record gardé
   ============================================================ */
const BUNNY = { g: 900, fg: 330, fallT: 1.7, rq: 75, reach: 105, hand: [8, 428], pxPerM: 12, tries: 3, roof: [-128, 86] };
const balloonAt = k => ({ x: 650 + k * 520 + hash(k * 3 + 1) * 230, y: 130 + hash(k * 3 + 2) * 230 });
const springAt = k => 1000 + k * 1150 + hash(k * 5 + 4) * 300;
class BunnyScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.phase === 'over' ? 'menu' : 'one'; }
  enter() { this.t = 0; this.cur = 0; this.dists = []; this.best0 = Best.get('lapin.best'); this.bestThrow = 0; this.startThrow(); }
  startThrow() {
    this.phase = 'aim'; this.pt = 0; this.theta = 0.8; this.parts = []; this.pops = [];
    this.m = { x: BUNNY.roof[0], y: BUNNY.roof[1], vx: 0, vy: 0, rot: 0, state: 'idle', dir: 1 }; this.cam = { x: -260, y: 0 };
    this.swung = false; this.swingT = -1; this.boosts = 3; this.stillT = 0; this.q = 0; this.shake = 0; this.popped = new Set(); this.flyT = 0; this.maxX = 0; this.msg = null; this.msgT = 0; this.path = null; this.hitPos = null; this.dmin = 1e9;
  }
  act() { return ['Space', 'Enter', 'NumpadEnter', 'ArrowUp', 'KeyW'].some(k => Input.pressed[k]); }
  sweet() { return { x: BUNNY.hand[0] + Math.cos(this.theta) * BUNNY.reach, y: BUNNY.hand[1] - Math.sin(this.theta) * BUNNY.reach }; }
  say(text, color) { this.msg = { text, color: color || '#ffd23f' }; this.msgT = 1.4; }
  leap() {                                                                     // Matthieu saute : une parabole qui passe près de la zone de frappe
    const T = BUNNY.fallT, S = { x: 70 + rnd(-35, 35), y: 335 + rnd(-30, 30) }, x0 = BUNNY.roof[0], y0 = BUNNY.roof[1];
    this.path = { x0, y0, vx: (S.x - x0) / T, vy: (S.y - y0 - 0.5 * BUNNY.fg * T * T) / T }; this.phase = 'fall'; this.fallT = 0; Sfx.play('jump');
  }
  launch(q) {
    const m = this.m;
    if (q > 0 && this.hitPos) { m.x = this.hitPos.x; m.y = this.hitPos.y; }
    const power = q > 0 ? 420 + 1130 * Math.pow(q, 0.9) : 130, ang = q > 0 ? this.theta + rnd(-1, 1) * (1 - q) * 0.25 : 1.0;
    m.vx = q > 0 ? Math.cos(ang) * power : this.path.vx * 0.5; m.vy = q > 0 ? -Math.sin(ang) * power : 0; this.q = q; this.phase = 'fly'; this.flyT = 0; this.shake = q > 0 ? 0.35 : 0;
    if (q > 0) { burst(this.parts, m.x, m.y, 26, ['#fff', '#ffe08a', '#ff8a3c'], 380); Sfx.play('win'); this.say(q > 0.85 ? 'SMASH PARFAIT !' : q > 0.55 ? 'Beau coup !' : 'Un peu mou…', q > 0.85 ? '#ff7a7a' : '#ffd23f'); }
    else { this.say('Raté !', '#cfd8ff'); Sfx.play('hurt'); }
  }
  endThrow() {
    const d = Math.floor(Math.max(0, this.maxX) / BUNNY.pxPerM); this.dists.push(d); this.bestThrow = Math.max(this.bestThrow, d);
    this.m.state = 'hurt'; this.m.rot = Math.PI / 2; this.phase = 'result'; this.pt = 0; this.lastDist = d; this.newRecord = d > Math.max(this.best0, ...this.dists.slice(0, -1), 0); Sfx.play(d > 60 ? 'win' : 'blip');
  }
  next() {
    if (this.cur + 1 >= BUNNY.tries) {
      this.phase = 'over'; this.pt = 0; this.recordNow = this.bestThrow > this.best0; if (this.recordNow) Best.set('lapin.best', this.bestThrow);
      burst(this.parts, 480, 150, 70, CONFETTI, 380); Sfx.play('win');
    } else { this.cur++; this.startThrow(); }
  }
  update(dt) {
    if (Input.back()) { this.onQuit(); return; }
    this.t += dt; this.pt += dt; updateParticles(this.parts, dt); if (this.shake > 0) this.shake -= dt; if (this.msgT > 0) this.msgT -= dt;
    const act = this.act();
    switch (this.phase) {
      case 'aim': this.theta = lerp(0.2, 1.35, 0.5 + 0.5 * Math.sin(this.pt * 2.6)); if (act) { Sfx.play('blip'); this.phase = 'wait'; this.pt = 0; } break;
      case 'wait': if (this.pt > 0.8) this.leap(); break;
      case 'fall': this.updateFall(dt, act); break;
      case 'fly': this.updateFly(dt, act); break;
      case 'result': if (this.pt > 0.8 && act) this.next(); break;
      case 'over': if (this.pt > 0.8 && act) this.onDone({ best: this.bestThrow }); break;
    }
    const m = this.m, fly = this.phase === 'fly' || this.phase === 'result', tx = fly ? Math.max(-260, m.x - 240) : -260, ty = fly ? Math.min(0, m.y - 250) : 0;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 5); this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 4);
  }
  updateFall(dt, act) {
    this.fallT += dt; const m = this.m, p = this.path, tau = this.fallT;
    m.x = p.x0 + p.vx * tau; m.y = p.y0 + p.vy * tau + 0.5 * BUNNY.fg * tau * tau; m.rot = Math.sin(tau * 9) * 0.3; m.state = 'jump';
    if (!this.swung && act) { this.swung = true; this.swingT = 0; this.dmin = 1e9; Sfx.play('stomp'); }
    if (this.swingT >= 0) {
      this.swingT += dt; const B = this.sweet(), d = Math.hypot(m.x - B.x, m.y - B.y);
      if (d < this.dmin) { this.dmin = d; this.hitPos = { x: m.x, y: m.y }; }
      if (this.swingT >= 0.22) { const q = clamp(1 - this.dmin / BUNNY.rq, 0, 1); this.swingT = -2; if (q > 0.1) { this.launch(q); return; } this.say('Raté !', '#cfd8ff'); }
    }
    if (m.y + 40 >= FLOOR_Y) { m.y = FLOOR_Y - 40; if (this.swingT < 0) this.launch(0); }          // au sol : raté (sauf si le coup est encore en cours)
  }
  updateFly(dt, act) {
    const m = this.m; this.flyT += dt;
    if (act && this.boosts > 0) { this.boosts--; m.vx = Math.min(1700, m.vx + 190); m.vy = Math.min(m.vy, 0) - 260; burst(this.parts, m.x - 10, m.y + 20, 16, ['#ff8a3c', '#ffd23f', '#fff'], 240); Sfx.play('spring'); }
    for (let s = 0; s < 2; s++) {
      const h = dt / 2; m.vy += BUNNY.g * h; m.vx = Math.min(1800, m.vx * (1 - 0.2 * h)); m.x += m.vx * h; m.y += m.vy * h;      // frottement de l'air + vitesse limitée
      if (m.y + 40 >= FLOOR_Y) {
        m.y = FLOOR_Y - 40;
        if (m.vy > 200) {
          const k = Math.round((m.x - 1000) / 1150);
          if (k >= 0 && Math.abs(m.x - springAt(k)) < 44) { m.vy = -1050; m.vx += 200; this.say('BOING !', '#7dffa0'); Sfx.play('spring'); }
          else { m.vy = -m.vy * 0.5; m.vx *= 0.8; dust(this.parts, m.x, FLOOR_Y, 8, 0); Sfx.play('stomp'); }
        } else { m.vy = 0; m.vx *= 1 - 1.8 * h; }
      }
    }
    for (let k = Math.floor((m.x - 650) / 520) - 1; k <= Math.floor((m.x - 650) / 520) + 1; k++) {            // ballons : poussée vers l'avant
      if (k < 0 || this.popped.has(k)) continue; const b = balloonAt(k);
      if (Math.hypot(m.x - b.x, m.y - b.y) < 46) { this.popped.add(k); m.vx += 280; m.vy = Math.min(m.vy, 0) - 380; burst(this.parts, b.x, b.y, 14, ['#ff5a8a', '#fff', '#ffd23f'], 260); Sfx.play('coin'); }
    }
    const air = m.y + 40 < FLOOR_Y - 1; m.rot += air ? 8 * dt * (m.vx >= 0 ? 1 : -1) : m.vx * dt / 38; m.state = air ? 'hurt' : 'jump'; this.maxX = Math.max(this.maxX, m.x);
    if (!air && Math.abs(m.vx) < 14 && Math.abs(m.vy) < 30) this.stillT += dt; else this.stillT = 0;
    if (this.stillT > 0.5 || this.flyT > 45) this.endThrow();
  }
  batAngle() {
    if (this.phase === 'fall' && this.swingT >= 0) return lerp(this.theta + 1.5, this.theta - 0.4, ease(clamp(this.swingT / 0.2, 0, 1)));
    if (this.swingT === -2 || this.phase === 'fly' || this.phase === 'result' || this.phase === 'over') return this.theta - 0.4;
    return this.phase === 'aim' ? this.theta : this.theta + 1.5 * (this.phase === 'fall' ? 1 : 0.35);
  }
  draw(ctx) {
    const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y), sh = this.shake > 0 ? rnd(-4, 4) : 0;
    ctx.save(); ctx.translate(sh, sh);
    drawBackground(ctx, 'ville', cx, 0, this.t);
    const gy = FLOOR_Y - cy, off = ((cx % TILE) + TILE) % TILE;                              // sol qui défile
    for (let x = -off; x < W; x += TILE) for (let y = gy, r = 0; y < H; y += TILE, r++) drawTile(ctx, 'ville', '#', x, y, r === 0, Math.floor((cx + x) / TILE), r);
    ctx.save(); ctx.translate(-cx, -cy);
    rect(ctx, -520, 70, 420, FLOOR_Y - 70, '#8c6a5a'); rect(ctx, -520, 70, 420, 12, '#5e4439'); rect(ctx, -540, 62, 460, 12, '#4a352c');   // l'immeuble d'où saute Matthieu
    for (let r = 0; r < 14; r++) for (let c = 0; c < 8; c++) rect(ctx, -496 + c * 50, 100 + r * 28, 26, 16, hash(r * 9 + c) > 0.35 ? '#ffe9a8' : '#4a3a44');
    for (let k = 1; k < 40; k++) { const x = k * 50 * BUNNY.pxPerM; rect(ctx, x - 2, FLOOR_Y - 70, 4, 70, '#fff'); rr(ctx, x - 30, FLOOR_Y - 110, 60, 28, 6, '#fff', '#c0392b', 3); txt(ctx, (k * 50) + ' m', x, FLOOR_Y - 90, 14, '#c0392b', 'center'); }
    if (this.best0 > 0) { const x = this.best0 * BUNNY.pxPerM; rect(ctx, x - 2, FLOOR_Y - 130, 4, 130, '#ffd23f'); poly(ctx, [[x, FLOOR_Y - 130], [x + 46, FLOOR_Y - 116], [x, FLOOR_Y - 102]], '#ffd23f'); txt(ctx, 'RECORD', x + 4, FLOOR_Y - 138, 13, '#a07800'); }
    for (let k = Math.max(0, Math.floor((cx - 650) / 520)); k < Math.floor((cx + W - 650) / 520) + 2; k++) { if (!this.popped.has(k)) { const b = balloonAt(k); drawBalloon(ctx, b.x, b.y, this.t, ['#ff5a8a', '#4fd8ff', '#ffd23f', '#7dff7d'][k % 4]); } }
    for (let k = 0; k < 40; k++) { const x = springAt(k); if (x > cx - 60 && x < cx + W + 60) drawSpring(ctx, x, FLOOR_Y, 0); }
    // Stephan, la batte et le cercle de frappe
    const B = this.sweet(), ang = this.batAngle(), show = this.phase === 'aim' || this.phase === 'wait' || (this.phase === 'fall' && !this.swung);
    if (show) { const pulse = 1 + Math.sin(this.t * 8) * 0.08; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.setLineDash && ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(B.x, B.y, 30 * pulse, 0, 6.2832); ctx.stroke(); ctx.setLineDash && ctx.setLineDash([]); circ(ctx, B.x, B.y, 6, '#ffd23f'); }
    if (this.phase === 'aim') { for (let i = 1; i <= 4; i++) circ(ctx, BUNNY.hand[0] + Math.cos(this.theta) * (40 + i * 52), BUNNY.hand[1] - Math.sin(this.theta) * (40 + i * 52), 3.5, 'rgba(255,255,255,.7)'); txt(ctx, Math.round(this.theta * 57.3) + '°', B.x + 30, B.y - 28, 20, '#fff'); }
    drawCharacter(ctx, CHARS.hero, 0, FLOOR_Y, { facing: 1, state: 'idle', t: this.t, rot: this.swingT >= 0 ? -0.08 : 0 });
    drawBat(ctx, BUNNY.hand[0], BUNNY.hand[1], ang, 96);
    // Matthieu
    const m = this.m, lying = this.phase === 'result' || this.phase === 'over';
    drawCharacter(ctx, CHARS.lapin, m.x, m.y + 40 + (lying ? 18 : 0), { facing: 1, state: this.phase === 'wait' || this.phase === 'aim' ? 'wave' : m.state, t: this.t, rot: m.rot, emote: lying && this.dists.length ? '@_@' : null, mood: this.phase === 'fly' ? 'surprised' : lying ? 'sad' : 'happy' });
    if (this.phase === 'fly' && this.boosts < 3 && this.flyT < 3) { /* traînée de la dernière carotte */ }
    drawParticles(ctx, this.parts);
    ctx.restore(); ctx.restore();
    this.drawHUD(ctx);
  }
  drawHUD(ctx) {
    const m = this.m, d = Math.floor(Math.max(0, this.phase === 'fly' ? m.x : this.maxX) / BUNNY.pxPerM);
    rr(ctx, 12, 10, 250, 46, 12, 'rgba(14,18,34,.82)', 'rgba(143,166,255,.6)', 1.5); txt(ctx, 'Lancer ' + (this.cur + 1) + '/' + BUNNY.tries, 26, 30, 17, '#ffe08a'); txt(ctx, 'Record : ' + Math.max(this.best0, this.bestThrow) + ' m', 26, 50, 15, '#cfd8ff');
    if (this.phase === 'fly' || this.phase === 'result') { rr(ctx, W / 2 - 90, 10, 180, 50, 14, 'rgba(14,18,34,.85)', '#ffd23f', 2); txt(ctx, d + ' m', W / 2, 46, 34, '#ffd23f', 'center'); }
    if (this.phase === 'fly' || this.phase === 'fall') { rr(ctx, W - 150, 10, 138, 40, 12, 'rgba(14,18,34,.82)'); for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < this.boosts ? 1 : 0.2; drawItem(ctx, 'carotte', W - 120 + i * 40, 31, 0.85, this.t, i); ctx.globalAlpha = 1; } }
    if (this.msgT > 0) { ctx.globalAlpha = clamp(this.msgT / 0.4, 0, 1); txt(ctx, this.msg.text, W / 2, 170, 44, this.msg.color, 'center'); ctx.globalAlpha = 1; }
    const hint = { aim: 'Appuie pour fixer l\'angle de la batte', wait: 'Prépare-toi…', fall: 'Frappe quand Matthieu passe dans le cercle !', fly: 'Appuie pour booster avec une carotte (' + this.boosts + ')' }[this.phase];
    if (hint) { rr(ctx, W / 2 - 280, H - 44, 560, 32, 14, 'rgba(14,18,34,.8)'); txt(ctx, (Device.touch ? hint.replace('Appuie', 'Touche') : hint), W / 2, H - 22, 17, '#fff', 'center'); }
    if (this.phase === 'result') {
      rr(ctx, W / 2 - 260, 120, 520, 170, 18, 'rgba(14,18,34,.94)', '#ffd23f', 3); txt(ctx, 'Lancer ' + (this.cur + 1) + ' : ' + this.lastDist + ' m', W / 2, 180, 40, '#ffd23f', 'center');
      txt(ctx, this.newRecord ? 'Nouveau record !' : this.lastDist > 150 ? 'Quel envol !' : this.lastDist < 20 ? 'Matthieu n\'a pas décollé…' : 'Pas mal !', W / 2, 220, 22, this.newRecord ? '#7dffa0' : '#cfd8ff', 'center');
      if (this.pt > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, Device.touch ? 'Touche pour continuer' : 'Espace / Entrée pour continuer', W / 2, 262, 17, '#8fa6ff', 'center');
    }
    if (this.phase === 'over') {
      rr(ctx, W / 2 - 280, 90, 560, 230, 18, 'rgba(14,18,34,.95)', '#ffd23f', 3); txt(ctx, this.recordNow ? 'Nouveau record !' : 'Fin des lancers', W / 2, 140, 36, this.recordNow ? '#7dffa0' : '#ffd23f', 'center');
      this.dists.forEach((v, i) => txt(ctx, 'Lancer ' + (i + 1) + ' : ' + v + ' m', W / 2, 184 + i * 28, 21, v === this.bestThrow ? '#ffe08a' : '#fff', 'center'));
      txt(ctx, 'Meilleur : ' + this.bestThrow + ' m', W / 2, 290, 22, '#ffd23f', 'center');
      if (this.pt > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, Device.touch ? 'Touche pour revenir au menu' : 'Entrée pour revenir au menu', W / 2, 312, 15, '#8fa6ff', 'center');
    }
  }
}

/* ============================================================
   PongScene : « Pong Deve » — le Pong d'origine (fond noir, raquettes blanches) contre l'ordinateur,
   mais la balle est la tête de Stephan. Premier à 7 points.
   ============================================================ */
const PONG = { padW: 14, padH: 92, padX: 34, padSpeed: 470, cpuSpeed: 330, r: 24, v0: 370, vmax: 780, toWin: 7, top: 24, bot: H - 24 };
class PongScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.phase === 'over' ? 'menu' : 'updown'; }
  enter() {
    this.t = 0; this.score = [0, 0]; this.parts = []; this.py = H / 2; this.cy = H / 2; this.rally = 0; this.best = 0; this.cpuErr = 0; this.cpuThink = 0; this.cpuTy = H / 2;
    this.mood = 'happy'; this.moodT = 0; this.wins0 = Best.get('pong.wins'); this.serve(Math.random() < 0.5 ? 1 : -1);
  }
  serve(dir) { this.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, rot: 0 }; this.dir = dir; this.phase = 'serve'; this.pt = 1.1; this.rally = 0; }
  hitPaddle(side, padY) {                                                        // renvoi : l'angle dépend de l'endroit de la raquette touché
    const b = this.ball, rel = clamp((b.y - padY) / (PONG.padH / 2 + PONG.r * 0.5), -1, 1), sp = Math.min(PONG.vmax, Math.hypot(b.vx, b.vy) * 1.06 + 12), a = rel * 0.95;
    b.vx = -side * Math.cos(a) * sp; b.vy = Math.sin(a) * sp; this.rally++; this.best = Math.max(this.best, this.rally);
    this.mood = 'surprised'; this.moodT = 0.3; burst(this.parts, b.x, b.y, 8, ['#fff', '#cfd8ff'], 200); Sfx.play('stomp');
    if (side === -1) { this.cpuErr = rnd(-1, 1) * (26 + this.rally * 3); }
  }
  point(who) {
    this.score[who]++; this.phase = 'point'; this.pt = 1.3; this.moodT = 9; this.mood = who === 0 ? 'laugh' : 'sad';
    Sfx.play(who === 0 ? 'coin' : 'hurt'); burst(this.parts, clamp(this.ball.x, 20, W - 20), this.ball.y, 24, who === 0 ? CONFETTI : ['#fff', '#8fa6ff'], 320);
    if (this.score[who] >= PONG.toWin) { this.phase = 'over'; this.pt = 0; this.winner = who; if (who === 0) { Best.set('pong.wins', this.wins0 + 1); Sfx.play('win'); burst(this.parts, W / 2, 200, 70, CONFETTI, 380); } }
  }
  update(dt) {
    if (Input.back()) { this.onQuit(); return; }
    this.t += dt; this.pt += this.phase === 'over' ? dt : 0; updateParticles(this.parts, dt); if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0 && this.phase !== 'point') this.mood = 'happy'; }
    const up = Input.down.ArrowUp || Input.down.KeyW, dn = Input.down.ArrowDown || Input.down.KeyS;
    if (this.phase !== 'over') this.py = clamp(this.py + ((dn ? 1 : 0) - (up ? 1 : 0)) * PONG.padSpeed * dt, PONG.top + PONG.padH / 2 + 6, PONG.bot - PONG.padH / 2 - 6);
    const b = this.ball;
    if (this.phase === 'serve') {
      this.pt -= dt; b.rot += dt * 3;
      if (this.pt <= 0) { const a = rnd(-0.5, 0.5); b.vx = this.dir * Math.cos(a) * PONG.v0; b.vy = Math.sin(a) * PONG.v0; this.phase = 'play'; this.mood = 'happy'; }
    } else if (this.phase === 'play') {
      for (let s = 0; s < 3 && this.phase === 'play'; s++) this.stepBall(dt / 3);
      b.rot += b.vx * dt / 40;
    } else if (this.phase === 'point') {
      this.pt -= dt; b.rot += dt * 6; if (this.pt <= 0) this.serve(this.lastLoser);
    } else if (this.phase === 'over' && this.pt > 0.8 && Input.confirm()) { this.onDone({ win: this.winner === 0 }); return; }
    // l'ordinateur : suit la balle avec un petit retard, une vitesse limitée et une erreur de visée
    this.cpuThink -= dt; if (this.cpuThink <= 0) { this.cpuThink = 0.09; this.cpuTy = b.vx > 0 && this.phase === 'play' ? b.y + this.cpuErr : lerp(this.cpuTy, H / 2, 0.15); }
    const dy = this.cpuTy - this.cy, sp = Math.min(PONG.cpuSpeed + this.rally * 6, 400) * dt; this.cy = clamp(this.cy + clamp(dy, -sp, sp), PONG.top + PONG.padH / 2 + 6, PONG.bot - PONG.padH / 2 - 6);
  }
  stepBall(h) {
    const b = this.ball, r = PONG.r; b.x += b.vx * h; b.y += b.vy * h;
    if (b.y < PONG.top + r) { b.y = PONG.top + r; b.vy = Math.abs(b.vy); Sfx.play('blip'); }
    if (b.y > PONG.bot - r) { b.y = PONG.bot - r; b.vy = -Math.abs(b.vy); Sfx.play('blip'); }
    const lx = PONG.padX + PONG.padW, rx = W - PONG.padX - PONG.padW;
    if (b.vx < 0 && b.x - r * 0.8 <= lx && b.x > PONG.padX - r && Math.abs(b.y - this.py) < PONG.padH / 2 + r * 0.6) { b.x = lx + r * 0.8; this.hitPaddle(-1, this.py); }
    else if (b.vx > 0 && b.x + r * 0.8 >= rx && b.x < rx + PONG.padW + r && Math.abs(b.y - this.cy) < PONG.padH / 2 + r * 0.6) { b.x = rx - r * 0.8; this.hitPaddle(1, this.cy); }
    if (b.x < -r) { this.lastLoser = -1; this.point(1); } else if (b.x > W + r) { this.lastLoser = 1; this.point(0); }
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#000');
    rect(ctx, 0, PONG.top - 8, W, 8, '#fff'); rect(ctx, 0, PONG.bot, W, 8, '#fff');
    for (let y = PONG.top + 6; y < PONG.bot - 10; y += 30) rect(ctx, W / 2 - 3, y, 6, 16, '#fff');
    const mono = 'Courier New, monospace';
    txt(ctx, String(this.score[0]), W / 2 - 80, 110, 84, '#fff', 'center', 'bold', mono); txt(ctx, String(this.score[1]), W / 2 + 80, 110, 84, '#fff', 'center', 'bold', mono);
    rect(ctx, PONG.padX, this.py - PONG.padH / 2, PONG.padW, PONG.padH, '#fff'); rect(ctx, W - PONG.padX - PONG.padW, this.cy - PONG.padH / 2, PONG.padW, PONG.padH, '#fff');
    const b = this.ball, bob = this.phase === 'serve' ? Math.sin(this.t * 8) * 3 : 0;
    if (this.phase !== 'point' || this.pt > 0.3) drawHead(ctx, CHARS.hero, b.x, b.y + bob, PONG.r * 2.3, { t: this.t, mood: this.mood, rot: b.rot });
    drawParticles(ctx, this.parts);
    txt(ctx, 'TOI', 60, H - 36, 14, '#888', 'left', 'bold', mono); txt(ctx, 'ORDINATEUR', W - 60, H - 36, 14, '#888', 'right', 'bold', mono);
    txt(ctx, 'PONG DEVE  ·  premier à ' + PONG.toWin, W / 2, H - 36, 14, '#888', 'center', 'bold', mono);
    if (this.phase === 'serve' && this.score[0] + this.score[1] === 0) txt(ctx, Device.touch ? 'Boutons ▲ ▼' : '↑ ↓  (ou Z / S) : bouger la raquette', W / 2, 170, 20, '#fff', 'center', 'bold', mono);
    if (this.phase === 'over') {
      rect(ctx, W / 2 - 300, 190, 600, 190, '#000'); rect(ctx, W / 2 - 300, 190, 600, 4, '#fff'); rect(ctx, W / 2 - 300, 376, 600, 4, '#fff');
      txt(ctx, this.winner === 0 ? 'STEPHAN GAGNE !' : 'L\'ORDINATEUR GAGNE', W / 2, 250, 38, '#fff', 'center', 'bold', mono);
      txt(ctx, this.score[0] + ' - ' + this.score[1] + '   ·   plus longue série : ' + this.best + ' renvois', W / 2, 292, 18, '#ccc', 'center', 'bold', mono);
      txt(ctx, 'Victoires : ' + (this.wins0 + (this.winner === 0 ? 1 : 0)), W / 2, 324, 18, '#ffd23f', 'center', 'bold', mono);
      if (this.pt > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, Device.touch ? 'Touche pour revenir au menu' : 'Entrée pour revenir au menu', W / 2, 362, 16, '#fff', 'center', 'bold', mono);
    }
  }
}

/* ============================================================
   PacScene : « Stephan Man » — un Pac-Man dont le héros est la tête de Stephan.
   Les fantômes sont des collègues (Chef, Bastien, Olivier, Arno). Gros points = Stephan fait peur à tout le monde.
   ============================================================ */
const PAC_HALF = [
  '###########', '#o........#', '#.###.###.#', '#..........', '#.###.#.###', '#.....#....', '#####.###..', '#####.#....', '#####.#.##D', ' .......#  ',
  '#####.#.###', '#####.#....', '#.....#....', '#.###.#.###', '#...#......', '#.###.#.###', '#.###.###.#', '#o.........', '###########',
];
const PAC_MAZE = PAC_HALF.map(h => h + h.slice(0, 10).split('').reverse().join(''));        // labyrinthe symétrique : 21 colonnes × 19 lignes
const PAC_C = 21, PAC_R = PAC_MAZE.length, PAC_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const PAC = { cell: 26, ox: 207, oy: 46, speed: 6.6, gspeed: 5.3, fspeed: 3.3, powerT: 7, lives: 3, start: [10, 11] };
const PAC_GHOSTS = [
  { key: 'chef', color: '#e8453c', aggr: 0.85, wait: 0 }, { key: 'bastien', color: '#ff8fc8', aggr: 0.7, wait: 3 },
  { key: 'olivier', color: '#4fd8ff', aggr: 0.55, wait: 6.5 }, { key: 'arno', color: '#ffa23c', aggr: 0.45, wait: 10 },
];
class PacScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.phase === 'over' ? 'menu' : 'pacman'; }
  enter() {
    this.t = 0; this.score = 0; this.lives = PAC.lives; this.level = 1; this.parts = []; this.pops = []; this.best0 = Best.get('stephanman.best'); this.newRecord = false; this.munch = 0;
    this.loadMaze(); this.resetActors(); this.phase = 'ready'; this.pt = 2.4;
  }
  loadMaze() { this.maze = PAC_MAZE.map(r => r.split('')); this.dotsLeft = this.maze.reduce((n, r) => n + r.filter(c => c === '.' || c === 'o').length, 0); }
  resetActors() {
    this.pac = { cx: PAC.start[0], cy: PAC.start[1], dx: 0, dy: 0, p: 0 }; this.want = { dx: 0, dy: 0 }; this.face = 1; this.power = 0; this.combo = 0;
    this.ghosts = PAC_GHOSTS.map((g, i) => Object.assign({ i }, g, i === 0 ? { cx: 10, cy: 7, dx: -1, dy: 0, p: 0, state: 'out', fr: false } : { cx: 8 + i, cy: 9, dx: 0, dy: 0, p: 0, state: 'house', fr: false, timer: g.wait * Math.max(0.4, 1 - 0.12 * (this.level - 1)) }));
  }
  open(x, y, door) { x = mod(x, PAC_C); if (y < 0 || y >= PAC_R) return false; const c = this.maze[y][x]; return c !== '#' && (c !== 'D' || !!door); }
  pos(e) { return { x: e.cx + e.dx * e.p, y: e.cy + e.dy * e.p }; }
  scr(x, y) { return { x: PAC.ox + (x + 0.5) * PAC.cell, y: PAC.oy + (y + 0.5) * PAC.cell }; }
  advance(e, dist, choose) {
    if (!e.dx && !e.dy) { choose(e); if (!e.dx && !e.dy) return; }
    e.p += dist;
    while (e.p >= 1) { e.cx = mod(e.cx + e.dx, PAC_C); e.cy += e.dy; e.p -= 1; choose(e); if (!e.dx && !e.dy) { e.p = 0; return; } }
  }
  flip(e) { if (!e.dx && !e.dy) return; e.cx = mod(e.cx + e.dx, PAC_C); e.cy += e.dy; e.p = 1 - e.p; e.dx = -e.dx; e.dy = -e.dy; }          // demi-tour au milieu d'un couloir
  choosePac(e) {
    const w = this.want;
    if ((w.dx || w.dy) && this.open(e.cx + w.dx, e.cy + w.dy)) { e.dx = w.dx; e.dy = w.dy; }
    else if (!this.open(e.cx + e.dx, e.cy + e.dy)) { e.dx = 0; e.dy = 0; }
  }
  chooseGhost(g) {
    let opts = PAC_DIRS.filter(d => this.open(g.cx + d[0], g.cy + d[1])); const fwd = opts.filter(d => !(d[0] === -g.dx && d[1] === -g.dy)); if (fwd.length) opts = fwd; if (!opts.length) return;
    let pick;
    if (g.fr || Math.random() > g.aggr) pick = opts[Math.floor(Math.random() * opts.length)];
    else {
      const a = this.pac; let tx = a.cx, ty = a.cy;
      if (g.key === 'bastien') { tx += a.dx * 3; ty += a.dy * 3; }
      else if (g.key === 'arno' && Math.hypot(tx - g.cx, ty - g.cy) < 6) { tx = 1; ty = 17; }
      let bd = 1e9; for (const d of opts) { const dd = Math.hypot(g.cx + d[0] - tx, g.cy + d[1] - ty); if (dd < bd) { bd = dd; pick = d; } }
    }
    g.dx = pick[0]; g.dy = pick[1];
  }
  say(text, x, y, color) { this.pops.push({ text, x, y, t: 0, color: color || '#fff' }); }
  die() { this.phase = 'dying'; this.pt = 1.6; this.lives--; Sfx.play('hurt'); }
  finish() {
    this.phase = 'over'; this.pt = 0; this.newRecord = this.score > this.best0; if (this.newRecord) { Best.set('stephanman.best', this.score); burst(this.parts, W / 2, 200, 60, CONFETTI, 380); Sfx.play('win'); }
  }
  update(dt) {
    if (Input.back()) { this.onQuit(); return; }
    this.t += dt; updateParticles(this.parts, dt); for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < 1.1);
    switch (this.phase) {
      case 'ready': this.pt -= dt; this.readInput(); if (this.pt <= 0) this.phase = 'play'; break;
      case 'play': this.stepPlay(dt); break;
      case 'dying': this.pt -= dt; if (this.pt <= 0) { if (this.lives <= 0) this.finish(); else { this.resetActors(); this.phase = 'ready'; this.pt = 1.6; } } break;
      case 'clear': this.pt -= dt; if (this.pt <= 0) { this.level++; this.loadMaze(); this.resetActors(); this.phase = 'ready'; this.pt = 1.8; } break;
      case 'over': this.pt += dt; if (this.pt > 0.8 && Input.confirm()) this.onDone({ score: this.score }); break;
    }
  }
  readInput() {
    const dirOf = s => (s.ArrowLeft || s.KeyA) ? [-1, 0] : (s.ArrowRight || s.KeyD) ? [1, 0] : (s.ArrowUp || s.KeyW) ? [0, -1] : (s.ArrowDown || s.KeyS) ? [0, 1] : null;
    const d = dirOf(Input.pressed) || dirOf(Input.down); if (d) this.want = { dx: d[0], dy: d[1] };
  }
  stepPlay(dt) {
    this.readInput(); const a = this.pac, w = this.want;
    if ((a.dx || a.dy) && w.dx === -a.dx && w.dy === -a.dy) this.flip(a);                       // demi-tour immédiat
    this.advance(a, PAC.speed * dt, e => this.choosePac(e)); if (a.dx) this.face = a.dx;
    // manger
    const pp = this.pos(a), cx = mod(Math.round(pp.x), PAC_C), cy = clamp(Math.round(pp.y), 0, PAC_R - 1), ch = this.maze[cy][cx];
    if (ch === '.' || ch === 'o') {
      this.maze[cy][cx] = ' '; this.dotsLeft--; this.score += ch === 'o' ? 50 : 10; if (++this.munch % 3 === 0) Sfx.play('blip');
      if (ch === 'o') { this.power = Math.max(3, PAC.powerT - 0.5 * (this.level - 1)); this.combo = 0; for (const g of this.ghosts) if (g.state === 'out') { g.fr = true; this.flip(g); } Sfx.play('spring'); }
      if (this.dotsLeft <= 0) { this.phase = 'clear'; this.pt = 2; Sfx.play('win'); burst(this.parts, W / 2, 200, 60, CONFETTI, 380); return; }
    }
    if (this.power > 0) { this.power -= dt; if (this.power <= 0) for (const g of this.ghosts) g.fr = false; }
    // fantômes
    for (const g of this.ghosts) {
      if (g.state === 'house') { g.timer -= dt; if (g.timer <= 0) { g.state = 'out'; g.cx = 10; g.cy = 7; g.dx = Math.random() < 0.5 ? 1 : -1; g.dy = 0; g.p = 0; g.fr = false; } continue; }
      const sp = (g.fr ? PAC.fspeed : PAC.gspeed + 0.35 * (this.level - 1)) * dt; this.advance(g, sp, e => this.chooseGhost(e));
      const gp = this.pos(g); let ddx = pp.x - gp.x; if (Math.abs(ddx) > PAC_C / 2) ddx -= Math.sign(ddx) * PAC_C;
      if (Math.hypot(ddx, pp.y - gp.y) < 0.6) {
        if (g.fr) {                                                                 // Stephan croque le collègue
          const pts = 200 * Math.pow(2, this.combo++); this.score += pts; const s = this.scr(gp.x, gp.y); this.say(String(pts), s.x, s.y, '#7dffd2'); burst(this.parts, s.x, s.y, 16, [g.color, '#fff'], 260); Sfx.play('coin');
          g.state = 'house'; g.fr = false; g.timer = 2.8; g.cx = 9 + (g.i % 3); g.cy = 9; g.dx = g.dy = 0; g.p = 0;
        } else { this.die(); return; }
      }
    }
  }
  draw(ctx) {
    const cs = PAC.cell, ox = PAC.ox, oy = PAC.oy, mono = 'Courier New, monospace';
    rect(ctx, 0, 0, W, H, '#05061a');
    // labyrinthe
    for (let y = 0; y < PAC_R; y++) for (let x = 0; x < PAC_C; x++) {
      const c = this.maze[y][x], px = ox + x * cs, py = oy + y * cs;
      if (c === '#') {
        rect(ctx, px, py, cs, cs, '#0b1448'); ctx.strokeStyle = '#4a6cff'; ctx.lineWidth = 2; ctx.beginPath();
        const wall = (xx, yy) => yy < 0 || yy >= PAC_R || xx < 0 || xx >= PAC_C || this.maze[yy][xx] === '#';
        if (!wall(x - 1, y)) { ctx.moveTo(px + 1, py); ctx.lineTo(px + 1, py + cs); } if (!wall(x + 1, y)) { ctx.moveTo(px + cs - 1, py); ctx.lineTo(px + cs - 1, py + cs); }
        if (!wall(x, y - 1)) { ctx.moveTo(px, py + 1); ctx.lineTo(px + cs, py + 1); } if (!wall(x, y + 1)) { ctx.moveTo(px, py + cs - 1); ctx.lineTo(px + cs, py + cs - 1); }
        ctx.stroke();
      } else if (c === 'D') rect(ctx, px, py + cs / 2 - 2, cs, 4, '#ff8fc8');
      else if (c === '.') circ(ctx, px + cs / 2, py + cs / 2, 2.6, '#ffe2b0');
      else if (c === 'o') { circ(ctx, px + cs / 2, py + cs / 2, 6 + Math.sin(this.t * 8) * 1.2, '#fff6d0'); circ(ctx, px + cs / 2, py + cs / 2, 3.5, '#ffd23f'); }
    }
    ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, PAC_C * cs, PAC_R * cs); ctx.clip();
    // fantômes (collègues sous un drap)
    for (const g of this.ghosts) {
      let p = this.pos(g), bob = 0; if (g.state === 'house') { p = { x: g.cx, y: g.cy }; bob = Math.sin(this.t * 6 + g.cx) * 2; }
      const s = this.scr(p.x, p.y), flash = this.power > 0 && this.power < 2 && Math.floor(this.t * 6) % 2 === 0, col = g.fr ? (flash ? '#fff' : '#2f45d8') : g.color;
      for (const off of [0, -PAC_C * cs, PAC_C * cs]) this.drawGhost(ctx, g, s.x + off, s.y + bob, col, g.fr);
    }
    // Stephan
    const a = this.pac, pp = this.pos(a), sp = this.scr(pp.x, pp.y), moving = (a.dx || a.dy) && this.phase === 'play', chomp = moving ? Math.floor(this.t * 9) % 2 === 0 : false;
    for (const off of [0, -PAC_C * cs, PAC_C * cs]) {
      if (this.phase === 'dying') { const k = clamp(this.pt / 1.6, 0, 1); if (k > 0.05) drawHead(ctx, CHARS.hero, sp.x + off, sp.y, 30 * k, { t: this.t, mood: 'sad', rot: (1 - k) * 14 }); }
      else drawHead(ctx, CHARS.hero, sp.x + off, sp.y, 32, { t: this.t, mood: chomp ? 'surprised' : 'happy', facing: this.face, rot: (a.dy ? a.dy * 0.7 * this.face : 0) });
    }
    ctx.restore();
    drawParticles(ctx, this.parts);
    for (const p of this.pops) { ctx.globalAlpha = clamp(1.1 - p.t, 0, 1); txt(ctx, p.text, p.x, p.y - p.t * 30, 18, p.color, 'center', 'bold', mono); ctx.globalAlpha = 1; }
    // panneaux
    txt(ctx, 'STEPHAN', 104, 80, 24, '#ffd23f', 'center', 'bold', mono); txt(ctx, 'MAN', 104, 104, 24, '#ffd23f', 'center', 'bold', mono);
    txt(ctx, 'SCORE', 104, 160, 15, '#8fa6ff', 'center', 'bold', mono); txt(ctx, String(this.score), 104, 188, 28, '#fff', 'center', 'bold', mono);
    txt(ctx, 'NIVEAU ' + this.level, 104, 232, 16, '#cfd8ff', 'center', 'bold', mono);
    txt(ctx, 'RECORD', 856, 80, 15, '#8fa6ff', 'center', 'bold', mono); txt(ctx, String(Math.max(this.best0, this.score)), 856, 108, 24, '#ffe08a', 'center', 'bold', mono);
    txt(ctx, 'VIES', 856, 160, 15, '#8fa6ff', 'center', 'bold', mono);
    for (let i = 0; i < PAC.lives; i++) { ctx.globalAlpha = i < this.lives ? 1 : 0.2; drawHead(ctx, CHARS.hero, 826 + i * 30, 192, 26, { t: this.t, mood: 'happy' }); ctx.globalAlpha = 1; }
    if (this.power > 0) { rr(ctx, 756, 224, 200, 14, 7, 'rgba(255,255,255,.15)'); rr(ctx, 756, 224, 200 * clamp(this.power / PAC.powerT, 0, 1), 14, 7, '#7dffd2'); txt(ctx, 'COLLÈGUES EFFRAYÉS', 856, 256, 12, '#7dffd2', 'center', 'bold', mono); }
    txt(ctx, Device.touch ? '◀ ▶ ▲ ▼' : '← ↑ ↓ → ou ZQSD', 104, H - 56, 13, '#8c96c8', 'center', 'bold', mono); txt(ctx, 'Échap : quitter', 104, H - 36, 13, '#8c96c8', 'center', 'bold', mono);
    const cm = this.scr(10, 12);
    if (this.phase === 'ready') txt(ctx, 'PRÊT ?', cm.x, cm.y + 6, 24, '#ffd23f', 'center', 'bold', mono);
    if (this.phase === 'clear') txt(ctx, 'NIVEAU TERMINÉ !', W / 2, 270, 36, '#7dffa0', 'center', 'bold', mono);
    if (this.phase === 'over') {
      rr(ctx, W / 2 - 240, 150, 480, 240, 18, 'rgba(5,6,26,.94)', '#ffd23f', 3);
      txt(ctx, this.newRecord ? 'Nouveau record !' : 'Fin de partie', W / 2, 205, 34, this.newRecord ? '#7dffa0' : '#ffd23f', 'center', 'bold', mono);
      txt(ctx, 'Score : ' + this.score, W / 2, 250, 28, '#fff', 'center', 'bold', mono); txt(ctx, 'Niveau atteint : ' + this.level, W / 2, 285, 18, '#cfd8ff', 'center', 'bold', mono);
      txt(ctx, 'Record : ' + Math.max(this.best0, this.score), W / 2, 315, 18, '#ffe08a', 'center', 'bold', mono);
      if (this.pt > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, Device.touch ? 'Touche pour revenir au menu' : 'Entrée pour revenir au menu', W / 2, 360, 16, '#8fa6ff', 'center', 'bold', mono);
    }
  }
  drawGhost(ctx, g, x, y, col, fr) {                                             // un drap coloré avec le visage du collègue
    const w = 13, wave = Math.sin(this.t * 14) * 1.5;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 1, w, Math.PI, 0); ctx.lineTo(x + w, y + 11);
    for (let k = 0; k < 4; k++) { ctx.lineTo(x + w - (k + 0.5) * w / 2, y + 7 + (k % 2 ? wave : -wave) * 0.5); ctx.lineTo(x + w - (k + 1) * w / 2, y + 11); }
    ctx.closePath(); ctx.fill();
    drawHead(ctx, CHARS[g.key], x, y - 3, 25, { t: this.t, mood: fr ? 'surprised' : 'angry' });
  }
}

/* ============================================================
   InvaderScene : « Deve Invader » — un Space Invaders. Le canon est la tête de Stephan,
   les envahisseurs sont les têtes des collègues. Boucliers, soucoupe bonus (Matthieu-lapin), vagues de plus en plus rapides.
   ============================================================ */
const INV = { cols: 8, rows: 4, dx: 62, dy: 46, size: 36, left: 40, right: W - 40, top: 96, playerY: 496, speed: 6.5, shotCd: 0.38, lives: 3, bunkerY: 398 };
const INV_KEYS = ['coline', 'amelie', 'sheryna', 'cecile', 'franck', 'danila', 'hakim', 'matthieu', 'arno', 'justine', 'sandie', 'bastien', 'olivier', 'imen', 'youssef', 'chef'];
class InvaderScene {
  constructor(game, def, onDone, onQuit) { this.game = game; this.def = def; this.onDone = onDone; this.onQuit = onQuit; }
  get touchMode() { return this.phase === 'over' ? 'menu' : 'invader'; }
  enter() { this.t = 0; this.score = 0; this.lives = INV.lives; this.wave = 1; this.parts = []; this.pops = []; this.best0 = Best.get('invader.best'); this.newRecord = false; this.startWave(); }
  startWave() {
    this.en = []; const lo = Math.min(3, this.wave - 1) * 14;
    for (let r = 0; r < INV.rows; r++) for (let c = 0; c < INV.cols; c++) this.en.push({ r, c, key: INV_KEYS[(r * INV.cols + c + (this.wave - 1) * 3) % INV_KEYS.length], alive: true, hit: 0 });
    this.fx = INV.left + 20; this.fy = INV.top + lo; this.dir = 1; this.px = W / 2; this.shots = []; this.bombs = []; this.cool = 0; this.bombT = 1.5; this.inv = 0; this.ufo = null; this.ufoT = rnd(8, 14); this.flash = 0; this.kick = 0;
    this.bunkers = []; for (let b = 0; b < 4; b++) { const bx = 120 + b * 240 - 28; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { if (r === 3 && c > 1 && c < 5) continue; this.bunkers.push({ x: bx + c * 8, y: INV.bunkerY + r * 8, hp: 2 }); } }
    this.phase = 'ready'; this.pt = 1.8;
  }
  alive() { return this.en.filter(e => e.alive); }
  ex(e) { return this.fx + e.c * INV.dx; }
  ey(e) { return this.fy + e.r * INV.dy; }
  say(text, x, y, color) { this.pops.push({ text, x, y, t: 0, color: color || '#fff' }); }
  fire() { this.shots.push({ x: this.px, y: INV.playerY - 26 }); this.cool = INV.shotCd; this.kick = 0.15; Sfx.play('blip'); }
  update(dt) {
    if (Input.back()) { this.onQuit(); return; }
    this.t += dt; updateParticles(this.parts, dt); for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < 1.1); if (this.kick > 0) this.kick -= dt; if (this.flash > 0) this.flash -= dt;
    for (const e of this.en) if (e.hit > 0) e.hit -= dt;
    switch (this.phase) {
      case 'ready': this.pt -= dt; this.move(dt); if (this.pt <= 0) this.phase = 'play'; break;
      case 'play': this.stepPlay(dt); break;
      case 'dying': this.pt -= dt; if (this.pt <= 0) { if (this.lives <= 0) this.finish(); else { this.inv = 2; this.phase = 'play'; this.bombs = []; } } break;
      case 'clear': this.pt -= dt; if (this.pt <= 0) { this.wave++; this.startWave(); } break;
      case 'over': this.pt += dt; if (this.pt > 0.8 && Input.confirm()) this.onDone({ score: this.score }); break;
    }
  }
  move(dt) { const d = (Input.down.ArrowRight || Input.down.KeyD ? 1 : 0) - (Input.down.ArrowLeft || Input.down.KeyA ? 1 : 0); this.px = clamp(this.px + d * 330 * dt, 40, W - 40); }
  finish() { this.phase = 'over'; this.pt = 0; this.newRecord = this.score > this.best0; if (this.newRecord) { Best.set('invader.best', this.score); burst(this.parts, W / 2, 200, 60, CONFETTI, 380); Sfx.play('win'); } }
  stepPlay(dt) {
    this.move(dt); if (this.cool > 0) this.cool -= dt; if (this.inv > 0) this.inv -= dt;
    const fireKey = Input.down.Space || Input.down.ArrowUp || Input.down.KeyW || Input.down.Enter;
    if (fireKey && this.cool <= 0 && this.shots.length < 2) this.fire();
    // la formation avance, descend au bord et accélère quand elle se vide
    const al = this.alive(), total = INV.rows * INV.cols, sp = (46 + (total - al.length) * 3.6 + this.wave * 9) * dt * this.dir;
    let minX = 1e9, maxX = -1e9, maxY = 0; for (const e of al) { const x = this.ex(e); minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, this.ey(e)); }
    if ((this.dir > 0 && maxX + sp > INV.right - INV.size / 2) || (this.dir < 0 && minX + sp < INV.left + INV.size / 2)) { this.dir = -this.dir; this.fy += 16; } else this.fx += sp;
    // projectiles du joueur
    for (const s of this.shots) { s.y -= 620 * dt; }
    for (const s of this.shots) {
      if (s.dead) continue;
      for (const e of al) if (e.alive && Math.abs(this.ex(e) - s.x) < 20 && Math.abs(this.ey(e) - s.y) < 20) {
        e.alive = false; s.dead = true; const pts = 10 + (INV.rows - 1 - e.r) * 5; this.score += pts; this.say('+' + pts, this.ex(e), this.ey(e), '#ffe08a'); burst(this.parts, this.ex(e), this.ey(e), 14, [CONFETTI[e.c % 6], '#fff'], 240); Sfx.play('stomp'); break;
      }
      if (!s.dead && this.ufo && Math.abs(this.ufo.x - s.x) < 28 && Math.abs(62 - s.y) < 18) { const pts = 50 * (1 + Math.floor(Math.random() * 6)); this.score += pts; this.say(String(pts), this.ufo.x, 70, '#7dffd2'); burst(this.parts, this.ufo.x, 62, 24, CONFETTI, 300); Sfx.play('coin'); this.ufo = null; s.dead = true; }
      if (!s.dead && s.y < 20) s.dead = true;
      if (!s.dead) for (const b of this.bunkers) if (b.hp > 0 && s.x > b.x - 2 && s.x < b.x + 10 && s.y > b.y - 4 && s.y < b.y + 10) { b.hp--; s.dead = true; break; }
    }
    this.shots = this.shots.filter(s => !s.dead);
    // les envahisseurs lancent des tickets
    this.bombT -= dt; if (this.bombT <= 0 && al.length) {
      this.bombT = Math.max(0.35, 1.05 - 0.07 * this.wave) * rnd(0.6, 1.25); const cols = [...new Set(al.map(e => e.c))], c = Math.random() < 0.4 ? Math.round((this.px - this.fx) / INV.dx) : cols[Math.floor(Math.random() * cols.length)];
      const col = al.filter(e => e.c === clamp(c, 0, INV.cols - 1)); const sh = (col.length ? col : al).reduce((a, e) => (this.ey(e) > this.ey(a) ? e : a));
      this.bombs.push({ x: this.ex(sh), y: this.ey(sh) + 16, vy: 190 + this.wave * 12, rot: rnd(0, 6) }); sh.hit = 0.25;
    }
    for (const b of this.bombs) { b.y += b.vy * dt; b.rot += dt * 5; if (b.y > H) b.dead = true; }
    for (const b of this.bombs) {
      if (b.dead) continue;
      for (const k of this.bunkers) if (k.hp > 0 && b.x > k.x - 4 && b.x < k.x + 12 && b.y > k.y - 4 && b.y < k.y + 10) { k.hp--; b.dead = true; break; }
      if (!b.dead && this.inv <= 0 && Math.abs(b.x - this.px) < 18 && Math.abs(b.y - INV.playerY) < 20) { b.dead = true; this.hurt(); return; }
    }
    this.bombs = this.bombs.filter(b => !b.dead);
    // les envahisseurs mangent les boucliers qu'ils touchent
    for (const e of al) for (const k of this.bunkers) if (k.hp > 0 && Math.abs(this.ex(e) - k.x - 4) < 22 && Math.abs(this.ey(e) - k.y - 4) < 22) k.hp = 0;
    // soucoupe bonus : Matthieu en lapin
    this.ufoT -= dt; if (this.ufoT <= 0 && !this.ufo) { const l = Math.random() < 0.5; this.ufo = { x: l ? -30 : W + 30, v: l ? 120 : -120 }; this.ufoT = rnd(14, 22); }
    if (this.ufo) { this.ufo.x += this.ufo.v * dt; if (this.ufo.x < -40 || this.ufo.x > W + 40) this.ufo = null; }
    // fin de vague / défaite
    if (!this.alive().length) { this.phase = 'clear'; this.pt = 1.8; this.bombs = []; Sfx.play('win'); burst(this.parts, W / 2, 220, 60, CONFETTI, 380); return; }
    if (maxY + INV.size / 2 >= INV.playerY - 24) { this.lives = 0; this.hurt(true); }
  }
  hurt(force) {
    this.lives = force ? 0 : this.lives - 1; this.phase = 'dying'; this.pt = 1.3; this.flash = 0.3; Sfx.play('hurt'); burst(this.parts, this.px, INV.playerY, 26, ['#ffd23f', '#ff8a3c', '#fff'], 300);
  }
  draw(ctx) {
    const mono = 'Courier New, monospace';
    rect(ctx, 0, 0, W, H, '#03040f');
    for (let i = 0; i < 70; i++) { const x = hash(i * 3) * W, y = (hash(i * 3 + 1) * H + this.t * (6 + hash(i) * 22)) % H; ctx.globalAlpha = 0.3 + hash(i * 7) * 0.6; rect(ctx, x, y, 2, 2, '#fff'); } ctx.globalAlpha = 1;
    rect(ctx, 0, INV.playerY + 26, W, 2, '#2c8a4a');
    // boucliers
    for (const b of this.bunkers) if (b.hp > 0) rect(ctx, b.x, b.y, 8, 8, b.hp > 1 ? '#6ee86e' : '#3d8f45');
    // envahisseurs
    const sway = Math.sin(this.t * 4) * 2;
    for (const e of this.alive()) { const x = this.ex(e), y = this.ey(e) + (e.c % 2 ? sway : -sway); drawHead(ctx, CHARS[e.key], x, y, INV.size, { t: this.t + e.c, mood: e.hit > 0 ? 'laugh' : e.r % 2 ? 'angry' : 'happy' }); }
    if (this.ufo) drawHead(ctx, CHARS.lapin, this.ufo.x, 62, 38, { t: this.t, mood: 'laugh', rot: Math.sin(this.t * 6) * 0.2 });
    // tirs
    for (const s of this.shots) { rect(ctx, s.x - 2, s.y - 8, 4, 16, '#ffd23f'); rect(ctx, s.x - 1, s.y - 8, 2, 16, '#fff'); }
    for (const b of this.bombs) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.sin(b.rot) * 0.5); rect(ctx, -6, -8, 12, 16, '#fffdf4'); rect(ctx, -4, -4, 8, 2, '#d6402f'); rect(ctx, -4, 0, 8, 2, '#d6402f'); rect(ctx, -4, 4, 5, 2, '#d6402f'); ctx.restore(); }
    // canon : Stephan
    const blink = this.inv > 0 && Math.floor(this.t * 14) % 2 === 0;
    if (this.phase !== 'dying' && this.phase !== 'over' && !blink) {
      rect(ctx, this.px - 20, INV.playerY + 14, 40, 10, '#cfd8ff'); rect(ctx, this.px - 3, INV.playerY - 24 - (this.kick > 0 ? 3 : 0), 6, 14, '#cfd8ff');
      drawHead(ctx, CHARS.hero, this.px, INV.playerY, 40, { t: this.t, mood: this.kick > 0 ? 'surprised' : 'happy' });
    }
    drawParticles(ctx, this.parts);
    for (const p of this.pops) { ctx.globalAlpha = clamp(1.1 - p.t, 0, 1); txt(ctx, p.text, p.x, p.y - p.t * 30, 18, p.color, 'center', 'bold', mono); ctx.globalAlpha = 1; }
    if (this.flash > 0) { ctx.globalAlpha = this.flash; rect(ctx, 0, 0, W, H, '#ff3030'); ctx.globalAlpha = 1; }
    // HUD
    txt(ctx, 'SCORE ' + this.score, 20, 30, 20, '#fff', 'left', 'bold', mono); txt(ctx, 'VAGUE ' + this.wave, W / 2, 30, 18, '#8fa6ff', 'center', 'bold', mono); txt(ctx, 'RECORD ' + Math.max(this.best0, this.score), W / 2, 50, 13, '#ffe08a', 'center', 'bold', mono);
    for (let i = 0; i < INV.lives; i++) { ctx.globalAlpha = i < this.lives ? 1 : 0.2; drawHead(ctx, CHARS.hero, W - 40 - i * 34, 26, 26, { t: this.t, mood: 'happy' }); ctx.globalAlpha = 1; }
    txt(ctx, 'DEVE INVADER', 20, H - 8, 12, '#556', 'left', 'bold', mono);
    if (this.phase === 'ready') { txt(ctx, 'VAGUE ' + this.wave, W / 2, 250, 40, '#ffd23f', 'center', 'bold', mono); if (this.wave === 1) txt(ctx, Device.touch ? '◀ ▶ pour bouger · TIR pour tirer' : '← →  (ou Q / D) : bouger   ·   Espace : tirer', W / 2, 290, 17, '#fff', 'center', 'bold', mono); }
    if (this.phase === 'clear') txt(ctx, 'VAGUE TERMINÉE !', W / 2, 270, 36, '#7dffa0', 'center', 'bold', mono);
    if (this.phase === 'over') {
      rr(ctx, W / 2 - 240, 150, 480, 240, 18, 'rgba(3,4,15,.95)', '#ffd23f', 3);
      txt(ctx, this.newRecord ? 'Nouveau record !' : 'Fin de partie', W / 2, 205, 34, this.newRecord ? '#7dffa0' : '#ffd23f', 'center', 'bold', mono);
      txt(ctx, 'Score : ' + this.score, W / 2, 250, 28, '#fff', 'center', 'bold', mono); txt(ctx, 'Vague atteinte : ' + this.wave, W / 2, 285, 18, '#cfd8ff', 'center', 'bold', mono);
      txt(ctx, 'Record : ' + Math.max(this.best0, this.score), W / 2, 315, 18, '#ffe08a', 'center', 'bold', mono);
      if (this.pt > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, Device.touch ? 'Touche pour revenir au menu' : 'Entrée pour revenir au menu', W / 2, 360, 16, '#8fa6ff', 'center', 'bold', mono);
    }
  }
}

/* ============================================================
   MiniGameSelect : menu des mini-jeux (liste MINIGAMES dans content.js)
   ============================================================ */
function startMiniGame(game, def) {
  const back = () => game.go(new MiniGameSelect(game));
  game.go(def.type === 'broom' ? new BroomScene(game, def, back, back) : def.type === 'aura' ? new AuraScene(game, def, back, back) : def.type === 'bunny' ? new BunnyScene(game, def, back, back) : def.type === 'pong' ? new PongScene(game, def, back, back) : def.type === 'pac' ? new PacScene(game, def, back, back) : def.type === 'invader' ? new InvaderScene(game, def, back, back) : new DanceScene(game, def, back, back));
}
class MiniGameSelect {
  constructor(game) { this.game = game; }
  get touchMode() { return 'back'; }
  enter() { this.ownTap = true; this.sel = 0; this.t = 0; }
  update(dt) {
    this.t += dt;
    const n = MINIGAMES.length;
    if (Input.menuUp()) { this.sel = (this.sel + n - 1) % n; Sfx.play('blip'); }
    if (Input.menuDown()) { this.sel = (this.sel + 1) % n; Sfx.play('blip'); }
    if (Input.tap) {
      const i = Math.floor((Input.tap.y - 84) / 70);
      if (Input.tap.x > 60 && Input.tap.x < 900 && i >= 0 && i < n && Input.tap.y - 84 - i * 70 < 64) { if (this.sel === i) { Sfx.play('door'); startMiniGame(this.game, MINIGAMES[i].def); return; } this.sel = i; Sfx.play('blip'); }
    }
    if (Input.confirm()) { Sfx.play('door'); startMiniGame(this.game, MINIGAMES[this.sel].def); return; }
    if (Input.back()) this.game.go(new TitleScene(this.game));
  }
  draw(ctx) {
    drawBackground(ctx, 'bar', this.t * 30, 0, this.t);
    ctx.fillStyle = 'rgba(8,6,24,.72)'; ctx.fillRect(0, 0, W, H);
    txt(ctx, 'Mini-jeux', 60, 80, 40, '#ffd23f');
    MINIGAMES.forEach((g, i) => {
      const y = 84 + i * 70, on = i === this.sel, best = g.best ? Best.get(g.best) : 0, k = 0.74;
      rr(ctx, 60, y, 840, 64, 16, on ? '#ffd23f' : 'rgba(255,255,255,.12)', on ? '#fff' : 'rgba(255,255,255,.3)', 2);
      ctx.save(); ctx.beginPath(); ctx.rect(70, y + 2, 270, 60); ctx.clip(); ctx.scale(k, k); const fy = (y + 60) / k;       // petites icônes
      if (g.icon === 'bunny') { drawCharacter(ctx, CHARS.hero, 120 / k, fy, { facing: 1, state: 'idle', t: this.t }); drawCharacter(ctx, CHARS.lapin, 215 / k, fy - 12 - (on ? Math.abs(Math.sin(this.t * 5)) * 16 : 0), { facing: 1, state: 'jump', t: this.t, rot: on ? this.t * 4 : 0 }); }
      else if (g.icon === 'duel') { drawCharacter(ctx, CHARS.hero, 120 / k, fy, { facing: 1, state: on ? 'cheer' : 'idle', t: this.t }); drawCharacter(ctx, CHARS.arno, 215 / k, fy, { facing: -1, state: on ? 'cheer' : 'idle', t: this.t + 1 }); }
      else if (g.icon === 'pong') { rect(ctx, 90 / k, (y + 14) / k, 6, 48 / k, '#fff'); rect(ctx, 300 / k, (y + 14 + (on ? Math.sin(this.t * 4) * 8 : 0)) / k, 6, 48 / k, '#fff'); drawHead(ctx, CHARS.hero, (195 + (on ? Math.sin(this.t * 4) * 70 : 0)) / k, (y + 38 + (on ? Math.cos(this.t * 6) * 10 : 0)) / k, 34, { t: this.t, mood: 'happy', rot: this.t * 2 }); }
      else if (g.icon === 'pac') { for (let d = 0; d < 4; d++) circ(ctx, (205 + d * 24) / k, (y + 38) / k, 2.5 / k * k, '#ffe2b0'); drawHead(ctx, CHARS.hero, (130 + (on ? (this.t * 60) % 40 : 0)) / k, (y + 38) / k, 38, { t: this.t, mood: Math.floor(this.t * 9) % 2 ? 'surprised' : 'happy' }); drawHead(ctx, CHARS.chef, 310 / k, (y + 38) / k, 30, { t: this.t, mood: 'angry' }); }
      else if (g.icon === 'invader') { const sw = on ? Math.sin(this.t * 3) * 14 : 0; ['coline', 'bastien', 'arno', 'olivier'].forEach((c, n) => drawHead(ctx, CHARS[c], (130 + n * 46 + sw) / k, (y + 22) / k, 26, { t: this.t, mood: 'angry' })); drawHead(ctx, CHARS.hero, (205 + (on ? Math.sin(this.t * 4) * 50 : 0)) / k, (y + 46) / k, 24, { t: this.t, mood: 'happy' }); if (on) rect(ctx, 205 / k, (y + 32) / k, 3, 6 / k, '#ffd23f'); }
      else for (let l = 0; l < 4; l++) drawArrow(ctx, 120 / k + l * 52 / k, (y + 38) / k + Math.sin(this.t * 4 + l) * (on ? 4 : 0), l, DANCE_LANES.color[l], 19, on ? '#2a1a3e' : '#fff');
      ctx.restore();
      txt(ctx, g.title, 350, y + 29, 26, on ? '#2a1a3e' : '#fff');
      txt(ctx, g.desc, 350, y + 52, 15, on ? '#4a3a5e' : '#cfd8ff');
      if (best) txt(ctx, (g.bestLabel || 'Record') + ' : ' + best + (g.bestUnit || ''), 880, y + 29, 19, on ? '#2a1a3e' : '#ffe08a', 'right');
    });
    txt(ctx, Device.touch ? 'Touche un mini-jeu, puis touche-le encore pour jouer' : '↑ ↓ : choisir   ·   Entrée : jouer   ·   Échap : retour', W / 2, H - 20, 15, '#fff', 'center');
  }
}

class ChapterSelect {
  constructor(game) { this.game = game; }
  get touchMode() { return 'back'; }
  enter() { this.ownTap = true; this.sel = 0; this.t = 0; }
  update(dt) {
    this.t += dt;
    if (Input.tap) {
      const t = Input.tap, i = Math.floor((t.y - 100) / 52);
      if (t.x > 40 && t.x < 580 && i >= 0 && i < STORY.length && t.y - 100 - i * 52 < 44) { if (this.sel === i) { runStep(this.game, i, -1); return; } this.sel = i; Sfx.play('blip'); }
      else if (t.x > 620 && t.x < 920 && t.y > 100 && t.y < 360) { runStep(this.game, this.sel, -1); return; }
    }
    if (Input.menuUp()) { this.sel = (this.sel + STORY.length - 1) % STORY.length; Sfx.play('blip'); }
    if (Input.menuDown()) { this.sel = (this.sel + 1) % STORY.length; Sfx.play('blip'); }
    if (Input.confirm()) runStep(this.game, this.sel, -1);
    if (Input.back()) this.game.go(new TitleScene(this.game));
  }
  draw(ctx) {
    const ch = STORY[this.sel], bg = chapterBg(ch);
    drawBackground(ctx, bg, this.t * 30, 0, this.t);
    ctx.fillStyle = 'rgba(8,10,24,.72)'; ctx.fillRect(0, 0, W, H);
    txt(ctx, 'Choisis un chapitre', 40, 56, 34, '#ffd23f');
    STORY.forEach((c, i) => {
      const y = 100 + i * 52, on = i === this.sel;
      rr(ctx, 40, y, 540, 44, 12, on ? '#ffd23f' : 'rgba(255,255,255,.1)');
      txt(ctx, c.day, 58, y + 29, 20, on ? '#1a1a2e' : '#ffd23f'); txt(ctx, c.title, 130, y + 29, 20, on ? '#1a1a2e' : '#fff');
    });
    rr(ctx, 620, 100, 300, 260, 16, 'rgba(14,18,34,.85)', '#8fa6ff', 2);
    txt(ctx, ch.day, 770, 160, 56, '#ffd23f', 'center'); txt(ctx, ch.title, 770, 200, 20, '#fff', 'center');
    const lv = ch.steps.filter(s => s.type !== 'cutscene').length, cs = ch.steps.filter(s => s.type === 'cutscene').length;
    txt(ctx, (THEMES[bg] ? THEMES[bg].label : bg), 770, 240, 18, '#cfd8ff', 'center'); txt(ctx, lv + ' niveau(x) · ' + cs + ' cinématique(s)', 770, 272, 16, '#cfd8ff', 'center');
    txt(ctx, Device.touch ? 'Touche un chapitre, puis touche-le encore (ou la carte) pour jouer' : '↑ ↓ : choisir   ·   Entrée : jouer   ·   Échap : retour', W / 2, H - 20, 15, '#fff', 'center');
  }
}

class ChapterCard {
  constructor(game, ch, onDone) { this.game = game; this.ch = ch; this.onDone = onDone; }
  enter() { this.t = 0; this.done = false; }
  update(dt) { this.t += dt; if (!this.done && (this.t > 2.6 || (this.t > 0.5 && Input.confirm()))) { this.done = true; this.onDone(); } }
  draw(ctx) {
    drawBackground(ctx, chapterBg(this.ch), this.t * 25, 0, this.t);
    ctx.fillStyle = 'rgba(5,6,16,.78)'; ctx.fillRect(0, 0, W, H);
    const a = clamp(Math.min(this.t / 0.5, (2.6 - this.t) / 0.5), 0, 1); ctx.globalAlpha = a;
    txt(ctx, this.ch.day, W / 2, H / 2 - 10, 96, '#ffd23f', 'center'); txt(ctx, this.ch.title, W / 2, H / 2 + 40, 30, '#fff', 'center'); ctx.globalAlpha = 1;
  }
}

class CreditsScene {
  constructor(game) { this.game = game; }
  enter() { this.t = 0; this.parts = []; this.cast = ['coline', 'amelie', 'cecile', 'danila', 'hero', 'sheryna', 'bastien', 'olivier', 'arno', 'chef'].map((k, i) => ({ ch: CHARS[k], x: 90 + i * 86, t: i * 0.5 })); }
  update(dt) {
    this.t += dt; for (const c of this.cast) c.t += dt; updateParticles(this.parts, dt);
    if (Math.random() < dt * 8) rain(this.parts, 2, CONFETTI);
    if (this.t > 2 && Input.confirm()) this.game.go(new TitleScene(this.game));
  }
  draw(ctx) {
    drawBackground(ctx, 'bar', this.t * 30, 0, this.t);
    for (let x = 0; x < W; x += TILE) for (let y = FLOOR_Y; y < H; y += TILE) drawTile(ctx, 'bar', '#', x, y, y === FLOOR_Y, x / TILE, y / TILE);
    for (const c of this.cast) drawCharacter(ctx, c.ch, c.x, FLOOR_Y, { facing: -1, state: 'cheer', t: c.t });
    drawParticles(ctx, this.parts);
    ctx.fillStyle = 'rgba(8,6,20,.6)'; ctx.fillRect(0, 0, W, 360);
    CONFIG.credits.forEach((l, i) => { const y = 440 - this.t * 38 + i * 40; if (y > -40 && y < 350) txt(ctx, l, W / 2, y, l.startsWith('★') ? 34 : 22, l.startsWith('★') ? '#ffd23f' : '#fff', 'center'); });
    if (this.t > 2 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, 'Entrée : retour au titre', W / 2, H - 14, 16, '#fff', 'center');
  }
}
