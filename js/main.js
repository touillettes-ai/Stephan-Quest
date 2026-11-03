'use strict';
/* main.js : démarrage + commandes tactiles */
window.addEventListener('load', () => {
  Input.init();
  const canvas = document.getElementById('c');
  const game = new Game(canvas);
  window.__game = game;
  game.go(new TitleScene(game));
  game.start();

  // un clic / une touche sur l'écran = "Entrée" (dialogues, menus)
  canvas.addEventListener('pointerdown', () => { Input.pressed.Enter = true; Sfx.unlock(); });

  // boutons tactiles (affichés seulement sur téléphone / tablette)
  document.querySelectorAll('[data-key]').forEach(btn => {
    const code = btn.dataset.key;
    const press = e => { e.preventDefault(); if (!Input.down[code]) Input.pressed[code] = true; Input.down[code] = true; Sfx.unlock(); };
    const release = e => { e.preventDefault(); Input.down[code] = false; };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  });
});
