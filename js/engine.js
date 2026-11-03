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
  if (d.ch) { drawPortrait(ctx, d.ch, bx + 14, by + 15, 100, 100, t, d.talking); tx = bx + 138; }
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
      jump(k, h) { const a = A(k), y0 = a.y; h = h || 34; Sfx.play('jump'); return { t: 0, update(dt) { this.t += dt; const p = Math.min(1, this.t / 0.5); a.y = y0 - Math.sin(p * Math.PI) * h; a.state = p < 1 ? 'jump' : 'idle'; if (p >= 1) { a.y = y0; return true; } return false; } }; },
      change(k, patch) { const a = A(k); a.ch = Object.assign({}, a.ch, patch); },
      /* --- dialogues --- */
      say(k, text, o) {
        o = o || {};
        const a = k ? A(k) : null;
        const d = { ch: a ? a.ch : null, name: o.name !== undefined ? o.name : (a ? a.name : null), text, shown: 0, last: 0, talking: true };
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
          if (Input.confirm()) { S.dlg = null; return true; }
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
    for (const a of list) drawCharacter(ctx, a.ch, a.x, a.y, { facing: a.facing, state: a.state, t: a.t, talking: a.talking, emote: a.emote });
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
    if (p.jbuf > 0 && p.coyote > 0) { p.vy = -PHYS.jump; p.jbuf = 0; p.coyote = 0; p.ground = false; Sfx.play('jump'); }
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
    for (let i = 0; i < n; i++) this.physics(h);
    if (p.dead <= 0 && p.y > this.rows * TILE + 100) this.hurt('fall');
    if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) this.respawn(); }
    if (p.inv > 0) p.inv -= dt;
    p.t += dt;
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
    if (!(p.inv > 0 && p.dead <= 0 && Math.floor(this.t * 14) % 2 === 0)) drawCharacter(ctx, CHARS.hero, p.x, p.y, { facing: p.face, state: p.state, t: p.t, rot: p.dead > 0 ? p.rot : 0, noShadow: p.dead > 0 });
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
    this.tickets = []; this.parts = []; this.spawnT = 1.6; this.swing = 0; this.hits = 0; this.score = 0; this.throwAnim = 0;
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
    if (['Enter', 'NumpadEnter', 'KeyE', 'KeyX', 'KeyF'].some(k => Input.pressed[k]) && this.swing <= -0.12) { this.swing = 0.3; Sfx.play('stomp'); }
    this.throwAnim = Math.max(0, this.throwAnim - dt);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const prog = this.score / this.goal, lvl = [452, 405, 330][Math.floor(Math.random() * 3)];
      const n = Math.random() < 0.22 ? 2 : 1;
      for (let i = 0; i < n; i++) { const yy = i ? [452, 405, 330].filter(v => v !== lvl)[Math.floor(Math.random() * 2)] : lvl; this.tickets.push({ x: 830 + i * 70, y: yy, y0: yy, vx: -rnd(150, 440) * (1 + 0.4 * prog), t: 0, amp: Math.random() < 0.35 ? rnd(10, 32) : 0, ph: rnd(0, 6) }); }
      this.throwAnim = 0.35; Sfx.play('blip'); this.spawnT = rnd(0.7, 1.3) * (1 - 0.35 * prog) + 0.2;
    }
    const zone = (o, tk) => tk.x > o.x + 8 && tk.x < o.x + 112 && tk.y > o.y - 118 && tk.y < o.y + 8;
    const body = (o, tk) => Math.abs(tk.x - o.x) < 26 && tk.y > o.y - 66 && tk.y < o.y + 6;
    for (const tk of this.tickets) {
      tk.t += dt; tk.x += tk.vx * dt; tk.y = tk.y0 + Math.sin(tk.t * 5 + tk.ph) * tk.amp;
      if (this.swing > 0 && (zone(p, tk) || zone(this.b, tk))) {
        tk.dead = true; this.score++; Sfx.play('coin'); burst(this.parts, tk.x, tk.y, 10, ['#ffe08a', '#fff', '#ff8a6a'], 170);
        if (this.score >= this.goal) { this.complete(); return; }
      } else if (p.inv <= 0 && (body(p, tk) || body(this.b, tk))) {
        tk.dead = true; this.hits++; p.inv = 0.7; this.flash = 0.25; Sfx.play('hurt'); burst(this.parts, tk.x, tk.y, 8, ['#d6402f', '#fff'], 150);
        if (this.hits >= 4) { this.lost = 1.6; this.toast('Touchés 4 fois… on recommence !'); } else this.toast('Aïe ! ' + this.hits + '/4');
      } else if (tk.x < -60) tk.dead = true;
    }
    this.tickets = this.tickets.filter(tk => !tk.dead);
  }
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
    drawCharacter(ctx, CHARS.bastien, this.b.x, this.b.y, { facing: 1, state: p.state, t: this.t }); this.broom(ctx, this.b, 0.04);
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
  get touchMode() { return this.done ? 'menu' : 'dance'; }
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
  finish() { if (this.done) return; this.done = true; this.doneT = 0; Music.stop(); Sfx.play('win'); burst(this.parts, 480, 150, 90, CONFETTI, 380); }
  update(dt) {
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
    const left = clamp(1 - Math.max(0, st) / this.song.length, 0, 1);
    rr(ctx, W - 150, 10, 138, 34, 12, 'rgba(14,18,34,.82)'); txt(ctx, Math.ceil(left * this.song.length) + ' s', W - 81, 34, 20, '#fff', 'center');
    if (st < 0) txt(ctx, st < -1.6 ? 'Prêts ?' : Math.ceil(-st), 480, 230, 54, '#fff', 'center');
    if (this.t < 7) { const a = clamp(Math.min(this.t / 0.4, (7 - this.t) / 0.6), 0, 1); ctx.globalAlpha = a; rr(ctx, 160, 410, 640, 40, 12, 'rgba(14,18,34,.88)', '#8fa6ff', 2); txt(ctx, Device.touch ? 'Touche la bonne flèche (en bas) au bon moment !' : '← ↑ ↓ → (ou Q Z S D) : appuie sur la bonne flèche au bon moment !', 480, 436, 16, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (this.done) {
      const ratio = this.hits / this.arrows.length;
      rr(ctx, W / 2 - 260, 90, 520, 250, 18, 'rgba(14,18,34,.95)', '#ffd23f', 3);
      txt(ctx, ratio > 0.85 ? 'Dancing King !' : ratio > 0.5 ? 'Belle prestation !' : 'On a dansé, c\'est l\'essentiel !', W / 2, 145, 34, '#ffd23f', 'center');
      txt(ctx, this.score + ' points', W / 2, 192, 30, '#fff', 'center');
      txt(ctx, this.hits + '/' + this.arrows.length + ' flèches · ' + this.bonuses + ' bonus · meilleur combo ' + this.best, W / 2, 232, 18, '#cfd8ff', 'center');
      if (this.doneT > 0.8 && Math.floor(this.t * 2) % 2 === 0) txt(ctx, 'Entrée pour continuer', W / 2, 300, 18, '#8fa6ff', 'center');
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
    if (Input.menuUp() || Input.menuDown()) { this.sel = 1 - this.sel; Sfx.play('blip'); }
    if (Input.tap) for (let i = 0; i < 2; i++) { const y = 262 + i * 58; if (Math.abs(Input.tap.x - W / 2) < 180 && Input.tap.y > y - 32 && Input.tap.y < y + 18) { this.sel = i; this.go(); return; } }
    if (Input.confirm()) this.go();
  }
  go() { Sfx.play('door'); if (this.sel === 0) runStep(this.game, 0, -1); else this.game.go(new ChapterSelect(this.game)); }
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
    ['Jouer', 'Choisir un chapitre'].forEach((s, i) => {
      const y = 262 + i * 58, on = this.sel === i, pulse = on ? 4 * Math.sin(this.t * 6) : 0;
      if (on) { ctx.globalAlpha = 0.35; rr(ctx, W / 2 - 190, y - 32, 380, 50, 25, '#ffd23f'); ctx.globalAlpha = 1; }
      rr(ctx, W / 2 - 170, y - 28, 340, 44, 22, on ? '#ffd23f' : 'rgba(20,16,44,.88)', on ? '#fff' : 'rgba(255,255,255,.35)', 2.5);
      txt(ctx, s, W / 2, y + 2, 25, on ? '#2a1a3e' : '#fff', 'center');
      if (on) { txt(ctx, '▶', W / 2 - 150 + pulse, y + 2, 20, '#2a1a3e', 'center'); txt(ctx, '◀', W / 2 + 150 - pulse, y + 2, 20, '#2a1a3e', 'center'); }
    });
    rr(ctx, 70, H - 36, W - 140, 26, 13, 'rgba(8,6,24,.7)');
    txt(ctx, Device.touch ? 'Touche un bouton pour jouer   ·   Touche l\'écran pour faire défiler les dialogues   ·   Boutons à l\'écran : bouger / sauter / pause' : '← → (ou Q D) : bouger   ·   Espace (ou Z / ↑) : sauter   ·   Entrée : dialogues   ·   Échap : pause   ·   M : son', W / 2, H - 18, 13, 'rgba(255,255,255,.92)', 'center');
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
