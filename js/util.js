'use strict';
/* ============================================================
   util.js : constantes, entrées clavier/tactile, sons
   ============================================================ */
const W = 960, H = 544, TILE = 32, FLOOR_Y = 480;   // FLOOR_Y = sol des cinématiques et niveaux standard (ligne 15)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mod = (a, m) => ((a % m) + m) % m;
const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);

/* Détection de l'appareil : écran tactile (téléphone / tablette) ou ordinateur (clavier) */
const Device = {
  touch: false, primary: false,
  init() {
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const ipad = typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    this.touch = this.primary = coarse || /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || ipad;
    window.addEventListener('touchstart', () => { this.touch = true; }, { passive: true });                 // un portable tactile passe en mode tactile dès qu'on touche l'écran
    window.addEventListener('keydown', e => { if (!this.primary && !e.repeat) this.touch = false; });       // …et revient au clavier dès qu'on tape une touche
  },
};

const Input = {
  down: {}, pressed: {}, tap: null,
  init() {
    window.addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!this.down[e.code]) this.pressed[e.code] = true;
      this.down[e.code] = true;
      Sfx.unlock();
    });
    window.addEventListener('keyup', e => { this.down[e.code] = false; });
    window.addEventListener('blur', () => { this.down = {}; });
  },
  endFrame() { this.pressed = {}; this.tap = null; },
  _any(codes, src) { for (const c of codes) if (src[c]) return true; return false; },
  // KeyA / KeyD / KeyW = ZQSD sur AZERTY (positions physiques)
  left()        { return this._any(['ArrowLeft', 'KeyA'], this.down); },
  right()       { return this._any(['ArrowRight', 'KeyD'], this.down); },
  jumpHeld()    { return this._any(['Space', 'ArrowUp', 'KeyW'], this.down); },
  jumpPressed() { return this._any(['Space', 'ArrowUp', 'KeyW'], this.pressed); },
  confirm()     { return this._any(['Enter', 'NumpadEnter', 'Space'], this.pressed); },
  menuUp()      { return this._any(['ArrowUp', 'KeyW'], this.pressed); },
  menuDown()    { return this._any(['ArrowDown', 'KeyS'], this.pressed); },
  back()        { return this._any(['Escape'], this.pressed); },
};

/* Petits effets sonores synthétisés (aucun fichier audio nécessaire) */
const Sfx = {
  ctx: null, muted: false,
  unlock() {
    try {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch (e) { /* pas de son, pas grave */ }
  },
  tone(f, d, type, vol, slide, delay) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
      g.gain.setValueAtTime(vol || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) { /* ignore */ }
  },
  play(name) {
    switch (name) {
      case 'jump':   this.tone(300, .16, 'square', .045, 320); break;
      case 'coin':   this.tone(880, .08, 'square', .045); this.tone(1320, .14, 'square', .045, 0, .07); break;
      case 'hurt':   this.tone(320, .32, 'sawtooth', .06, -240); break;
      case 'stomp':  this.tone(200, .12, 'square', .06, -90); break;
      case 'spring': this.tone(240, .25, 'triangle', .07, 700); break;
      case 'check':  this.tone(660, .1, 'triangle', .06); this.tone(990, .18, 'triangle', .06, 0, .1); break;
      case 'door':   this.tone(392, .12, 'square', .05); this.tone(523, .12, 'square', .05, 0, .1); this.tone(784, .25, 'square', .05, 0, .2); break;
      case 'win':    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .2, 'square', .05, 0, i * .11)); break;
      case 'blip':   this.tone(430 + Math.random() * 140, .045, 'triangle', .03); break;
      case 'pop':    this.tone(500, .09, 'sine', .07, 500); break;
      case 'ding':   this.tone(1200, .35, 'sine', .06); break;
    }
  },
};
