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
    if (this.fade > 0) { this.ctx.fillStyle = 'rgba(0,0,0,' + this.fade + ')'; this.ctx.fillRect(0, 0, W, H); }
    if (Sfx.muted) txt(this.ctx, 'SON COUPÉ (M)', W - 12, H - 10, 11, 'rgba(255,255,255,.6)', 'right');
  }
  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0); this.last = now;
    if (Input.pressed.KeyM && !(this.scene && this.scene.paused)) Sfx.muted = !Sfx.muted;
    this.update(dt); this.draw(); Input.endFrame();
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
  else game.go(new LevelScene(game, step, next, () => game.go(new ChapterSelect(game))));
}
const stepBg = s => (s && (s.bg || s.theme)) || 'openspace';

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
  enter() {
    const d = this.def, m = d.map;
    this.theme = d.theme || 'openspace'; this.bg = d.bg || this.theme;
    this.rows = m.length; this.cols = Math.max.apply(null, m.map(r => r.length));
    this.grid = m.map(r => r.padEnd(this.cols, '.').split(''));
    this.items = []; this.enemies = []; this.checks = []; this.springs = []; this.exit = null; this.start = { x: 48, y: FLOOR_Y };
    this.got = {}; this.need = {}; this.parts = [];
    const hz = d.hazards || ['chair', 'mail'];
    for (let ty = 0; ty < this.rows; ty++) for (let tx = 0; tx < this.cols; tx++) {
      const c = this.grid[ty][tx], cx = tx * TILE + TILE / 2, by = (ty + 1) * TILE;
      let clear = true;
      if (c === 'S') this.start = { x: cx, y: by };
      else if (c === 'X') this.exit = { x: cx, y: by, open: false };
      else if (c === 'C') this.checks.push({ x: cx, y: by, on: false });
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
    this.t = 0; this.falls = 0; this.done = false; this.doneT = 0; this.paused = false; this.toastMsg = null; this.exitWarn = 0;
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
  respawn() { const p = this.p; p.x = p.spawn.x; p.y = p.spawn.y; p.vx = 0; p.vy = 0; p.dead = 0; p.rot = 0; p.inv = 1.6; p.ground = false; this.snapCam(); }

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
      if (this.allDone() && this.exit && !this.exit.open) { this.exit.open = true; Sfx.play('door'); this.toast('Tout est là ! Cap sur la sortie →'); }
    }
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
  remaining() { let r = 0; for (const k in this.need) r += Math.max(0, this.need[k] - this.got[k]); return r; }
  allDone() { return this.remaining() === 0; }
  complete() { this.done = true; this.doneT = 0; Sfx.play('win'); burst(this.parts, this.exit.x, this.exit.y - 40, 70, CONFETTI, 380); }

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
      const bob = Math.sin(this.t * 3 + it.ph) * 3;
      ctx.globalAlpha = 0.22 + 0.1 * Math.sin(this.t * 4 + it.ph); circ(ctx, it.x, it.y + bob, 19, '#fff6b0'); ctx.globalAlpha = 1;
      drawItem(ctx, it.kind, it.x, it.y + bob, 1, this.t, it.v);
    }
    for (const e of this.enemies) if (!e.alive && e.squash > 0.5) continue; else drawHazard(ctx, e.type, e.x, e.y, e.t, e.dir, !e.alive);
    const p = this.p;
    if (!(p.inv > 0 && p.dead <= 0 && Math.floor(this.t * 14) % 2 === 0)) drawCharacter(ctx, CHARS.hero, p.x, p.y, { facing: p.face, state: p.state, t: p.t, rot: p.dead > 0 ? p.rot : 0, noShadow: p.dead > 0 });
    drawParticles(ctx, this.parts);
    ctx.restore();
    this.drawHUD(ctx);
  }
  drawHUD(ctx) {
    const keys = Object.keys(this.need), pw = 24 + keys.length * 98;
    rr(ctx, 12, 10, pw, 46, 12, 'rgba(14,18,34,.8)', 'rgba(143,166,255,.6)', 1.5);
    let x = 24;
    for (const k of keys) {
      drawItem(ctx, this.def.items[k - 1], x + 14, 33, 0.95, this.t, +k);
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
      txt(ctx, 'Entrée / Échap : reprendre   ·   R : recommencer   ·   M : retour au menu', W / 2, 270, 18, '#cfd8ff', 'center');
    }
  }
}

/* ============================================================
   Écrans : titre, sélection de chapitre, carte de chapitre, générique
   ============================================================ */
class TitleScene {
  constructor(game) { this.game = game; }
  enter() {
    this.t = 0; this.sel = 0; this.parts = [];
    this.cast = [['sophie', 560], ['karim', 640], ['chef', 720], ['nadia', 800], ['hero', 460]].map(([k, x], i) => ({ ch: CHARS[k], x, t: i * 0.7, st: k === 'hero' ? 'wave' : 'idle' }));
  }
  update(dt) {
    this.t += dt; for (const c of this.cast) c.t += dt; updateParticles(this.parts, dt);
    if (Math.random() < dt * 2) burst(this.parts, rnd(100, 860), 0, 3, CONFETTI, 30);
    if (Input.menuUp() || Input.menuDown()) { this.sel = 1 - this.sel; Sfx.play('blip'); }
    if (Input.confirm()) { Sfx.play('door'); if (this.sel === 0) runStep(this.game, 0, -1); else this.game.go(new ChapterSelect(this.game)); }
  }
  draw(ctx) {
    drawBackground(ctx, 'openspace', this.t * 40, 0, this.t);
    for (let x = 0; x < W; x += TILE) for (let y = FLOOR_Y; y < H; y += TILE) drawTile(ctx, 'openspace', '#', x, y, y === FLOOR_Y, x / TILE, y / TILE);
    for (const c of this.cast) drawCharacter(ctx, c.ch, c.x, FLOOR_Y, { facing: -1, state: c.st, t: c.t });
    drawParticles(ctx, this.parts);
    rr(ctx, 120, 60, 720, 150, 20, 'rgba(14,18,34,.86)', '#ffd23f', 4);
    txt(ctx, CONFIG.title, W / 2, 128, 64, '#ffd23f', 'center');
    txt(ctx, CONFIG.subtitle, W / 2, 175, 24, '#fff', 'center');
    ['Jouer', 'Choisir un chapitre'].forEach((s, i) => { const y = 270 + i * 50; rr(ctx, W / 2 - 180, y - 30, 360, 42, 12, this.sel === i ? '#ffd23f' : 'rgba(14,18,34,.8)'); txt(ctx, s, W / 2, y, 24, this.sel === i ? '#1a1a2e' : '#fff', 'center'); });
    txt(ctx, '← → (ou Q D) : bouger   ·   Espace (ou Z / ↑) : sauter   ·   Entrée : dialogues   ·   Échap : pause   ·   M : son', W / 2, H - 14, 14, 'rgba(255,255,255,.9)', 'center');
  }
}

class ChapterSelect {
  constructor(game) { this.game = game; }
  enter() { this.sel = 0; this.t = 0; }
  update(dt) {
    this.t += dt;
    if (Input.menuUp()) { this.sel = (this.sel + STORY.length - 1) % STORY.length; Sfx.play('blip'); }
    if (Input.menuDown()) { this.sel = (this.sel + 1) % STORY.length; Sfx.play('blip'); }
    if (Input.confirm()) runStep(this.game, this.sel, -1);
    if (Input.back()) this.game.go(new TitleScene(this.game));
  }
  draw(ctx) {
    const ch = STORY[this.sel], bg = stepBg(ch.steps[0]);
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
    const lv = ch.steps.filter(s => s.type === 'level').length, cs = ch.steps.filter(s => s.type === 'cutscene').length;
    txt(ctx, (THEMES[bg] ? THEMES[bg].label : bg), 770, 240, 18, '#cfd8ff', 'center'); txt(ctx, lv + ' niveau(x) · ' + cs + ' cinématique(s)', 770, 272, 16, '#cfd8ff', 'center');
    txt(ctx, '↑ ↓ : choisir   ·   Entrée : jouer   ·   Échap : retour', W / 2, H - 20, 15, '#fff', 'center');
  }
}

class ChapterCard {
  constructor(game, ch, onDone) { this.game = game; this.ch = ch; this.onDone = onDone; }
  enter() { this.t = 0; this.done = false; }
  update(dt) { this.t += dt; if (!this.done && (this.t > 2.6 || (this.t > 0.5 && Input.confirm()))) { this.done = true; this.onDone(); } }
  draw(ctx) {
    drawBackground(ctx, stepBg(this.ch.steps[0]), this.t * 25, 0, this.t);
    ctx.fillStyle = 'rgba(5,6,16,.78)'; ctx.fillRect(0, 0, W, H);
    const a = clamp(Math.min(this.t / 0.5, (2.6 - this.t) / 0.5), 0, 1); ctx.globalAlpha = a;
    txt(ctx, this.ch.day, W / 2, H / 2 - 10, 96, '#ffd23f', 'center'); txt(ctx, this.ch.title, W / 2, H / 2 + 40, 30, '#fff', 'center'); ctx.globalAlpha = 1;
  }
}

class CreditsScene {
  constructor(game) { this.game = game; }
  enter() { this.t = 0; this.parts = []; this.cast = [['sophie', 300], ['karim', 380], ['hero', 480], ['chef', 580], ['nadia', 660]].map(([k, x], i) => ({ ch: CHARS[k], x, t: i * 0.5 })); }
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
