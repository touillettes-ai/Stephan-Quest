'use strict';
/* main.js : démarrage, détection de l'appareil et commandes tactiles */

/* Boutons tactiles affichés selon la scène (scene.touchMode) : [libellé, touche simulée, style] */
const TOUCH_LAYOUTS = {
  move:  { left: [['◀', 'ArrowLeft'], ['▶', 'ArrowRight']], right: [['⤒', 'Space', 'big']], top: [['⏸', 'Escape', 'pill']] },
  broom: { left: [['◀', 'ArrowLeft'], ['▶', 'ArrowRight']], right: [['BALAI', 'KeyE', 'act big'], ['⤒', 'Space']], top: [['⏸', 'Escape', 'pill']] },
  dance: { row: [['◀', 'ArrowLeft', 'sq'], ['▼', 'ArrowDown', 'sq'], ['▲', 'ArrowUp', 'sq'], ['▶', 'ArrowRight', 'sq']] },
  cut:   { br: [['Passer ⏭', 'Escape', 'pill']] },
  back:  { bl: [['← Retour', 'Escape', 'pill']] },
  pause: { mid: [['Reprendre', 'Enter', 'pill'], ['Recommencer', 'KeyR', 'pill'], ['Menu', 'KeyM', 'pill']] },
  menu:  {},
};
const TouchUI = {
  mode: null,
  press(code, btn, on) {
    if (on) { if (!Input.down[code]) Input.pressed[code] = true; Input.down[code] = true; Sfx.unlock(); } else Input.down[code] = false;
    btn.classList.toggle('on', on);
  },
  build(mode) {
    const box = document.getElementById('touch'), lay = TOUCH_LAYOUTS[mode] || {};
    box.innerHTML = ''; this.mode = mode;
    for (const g in lay) {
      const row = document.createElement('div'); row.className = 'g g-' + g;
      for (const [label, code, style] of lay[g]) {
        const b = document.createElement('button'); b.className = 'tb ' + (style || ''); b.textContent = label;
        const down = e => { e.preventDefault(); this.press(code, b, true); }, up = e => { e.preventDefault(); this.press(code, b, false); };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
        row.appendChild(b);
      }
      box.appendChild(row);
    }
    box.style.display = Object.keys(lay).length ? 'block' : 'none';
  },
  sync(game) {                                                    // appelé à chaque image : adapte l'écran à l'appareil et à la scène
    document.body.classList.toggle('touch', Device.touch);
    const mode = Device.touch ? ((game.scene && game.scene.touchMode) || 'menu') : 'none';
    if (mode !== this.mode) { if (mode === 'none') { document.getElementById('touch').style.display = 'none'; this.mode = mode; } else this.build(mode); }
  },
};

window.addEventListener('load', () => {
  Device.init();
  Input.init();
  const canvas = document.getElementById('c');
  const game = new Game(canvas);
  window.__game = game;
  game.afterFrame = TouchUI.sync.bind(TouchUI);
  game.go(new TitleScene(game));
  game.start();

  // un clic / un tap sur l'écran = "Entrée" (dialogues, fins de niveau) ; la position sert aux menus (scène avec ownTap)
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect();
    Input.tap = { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    if (!(game.scene && game.scene.ownTap)) Input.pressed.Enter = true;
    Sfx.unlock();
  });

  // plein écran (téléphone) + verrouillage en paysage quand c'est possible
  const fs = document.getElementById('fs');
  if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) fs.style.display = 'none';
  fs.addEventListener('click', () => {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    Promise.resolve(p).then(() => { try { screen.orientation.lock('landscape'); } catch (e) { /* pas grave */ } }).catch(() => {});
  });
  window.addEventListener('contextmenu', e => { if (Device.touch) e.preventDefault(); });
});
