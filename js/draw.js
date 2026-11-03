'use strict';
/* ============================================================
   draw.js : tout le dessin (personnages, objets, ennemis, décors)
   Aucune image externe : tout est dessiné en code.
   ============================================================ */
const FONT = '"Trebuchet MS","Segoe UI",Verdana,sans-serif';

/* ---------- primitives ---------- */
function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function circ(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
function ell(ctx, x, y, rx, ry, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.fill(); }
function rr(ctx, x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, c, w) {
  ctx.strokeStyle = c; ctx.lineWidth = w || 1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function limb(ctx, x, y, ang, len, w, c) {
  line(ctx, x, y, x + Math.sin(ang) * len, y + Math.cos(ang) * len, c, w);
}
function poly(ctx, pts, fill) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => clamp(Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)), 0, 255);
  return '#' + ((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
}
function txt(ctx, s, x, y, size, color, align, weight, font) {
  ctx.font = (weight || 'bold') + ' ' + size + 'px ' + (font || FONT);
  ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
function wrapText(ctx, text, maxW, size) {
  ctx.font = 'bold ' + size + 'px ' + FONT;
  const out = []; let cur = '';
  for (const w of text.split(' ')) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; } else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}

/* ============================================================
   PERSONNAGES
   Un personnage = un petit objet de configuration :
   { skin, hair, hairStyle, top, bottom, shoe, tie, vest, glasses,
     mustache, beard, cap, scale }
   hairStyle : 'short' | 'bald' | 'long' | 'bun' | 'curly' | 'cap' | 'helmet'
   état (state) : idle walk jump fall wave cheer sit hurt
   ============================================================ */
function drawCharacter(ctx, ch, x, y, a) {
  a = a || {};
  const f = a.facing || 1, st = a.state || 'idle', t = a.t || 0, sc = ch.scale || 1;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (!a.noShadow) ell(ctx, 0, 0, 13 * sc, 3.5 * sc, 'rgba(0,0,0,.18)');
  ctx.scale(f * sc, sc * (a.squash || 1));
  if (a.alpha !== undefined) ctx.globalAlpha = a.alpha;
  if (a.rot) { ctx.translate(0, -26); ctx.rotate(a.rot); ctx.translate(0, 26); }

  let bob = 0, aL = 0.1, aR = -0.1, lL = 0, lR = 0, low = 0, sit = false;
  switch (st) {
    case 'idle':  bob = Math.sin(t * 2.2) * 0.8; break;
    case 'walk': { const s = Math.sin(t * 11); lL = s * 0.8; lR = -s * 0.8; aL = -s * 0.7; aR = s * 0.7; bob = -Math.abs(s) * 1.8; break; }
    case 'jump':  lL = 0.6; lR = -0.35; aL = -2.5; aR = 2.5; break;
    case 'fall':  lL = 0.25; lR = -0.25; aL = -1.5; aR = 1.5; break;
    case 'wave':  aR = 2.7 + Math.sin(t * 10) * 0.35; break;
    case 'cheer': aL = -2.7; aR = 2.7; bob = -Math.abs(Math.sin(t * 7)) * 5; lL = 0.12; lR = -0.12; break;
    case 'sit':   sit = true; low = 10; aR = 1.05; aL = 0.9; bob = Math.sin(t * 1.6) * 0.5; break;
    case 'hurt':  aL = -2.2; aR = 2.2; lL = 0.4; lR = -0.4; break;
  }
  const skin = ch.skin || '#f0c8a0', top = ch.top || '#2f6db5', bot = ch.bottom || '#2c3440', shoe = ch.shoe || '#1b1b1b';
  const hipY = -21 + low;

  // jambes
  if (sit) {
    limb(ctx, -1, hipY, 1.45, 14, 7, shade(bot, -0.2)); limb(ctx, 13, hipY + 1.6, 0, 9, 7, shade(bot, -0.2));
    limb(ctx, 1, hipY, 1.45, 14, 7, bot);               limb(ctx, 15, hipY + 1.6, 0, 9, 7, bot);
    rr(ctx, 13, -3, 10, 5, 2.5, shoe);
  } else {
    limb(ctx, -2.5, hipY, lR, 21, 7, shade(bot, -0.2));
    rr(ctx, -2.5 + Math.sin(lR) * 21 - 3, hipY + Math.cos(lR) * 21 - 3, 10, 6, 3, shade(shoe, -0.1));
    limb(ctx, 2.5, hipY, lL, 21, 7, bot);
    rr(ctx, 2.5 + Math.sin(lL) * 21 - 3, hipY + Math.cos(lL) * 21 - 3, 10, 6, 3, shoe);
  }

  // bras arrière + torse
  const shY = -39 + low + bob;
  limb(ctx, -1, shY, aL, 17, 5.5, shade(top, -0.25));
  circ(ctx, -1 + Math.sin(aL) * 17, shY + Math.cos(aL) * 17, 3, shade(skin, -0.1));
  rr(ctx, -9, -43 + low + bob, 18, 24, 6, top);
  if (ch.vest) { rr(ctx, -9, -43 + low + bob, 18, 24, 6, ch.vest); rect(ctx, -9, -31 + low + bob, 18, 3, '#e9e9e9'); }
  if (ch.tie) poly(ctx, [[-1.5, -42 + low + bob], [3.5, -42 + low + bob], [4.5, -29 + low + bob], [1, -26 + low + bob], [-2.5, -29 + low + bob]], ch.tie);
  if (ch.collar) poly(ctx, [[-4, -43 + low + bob], [5, -43 + low + bob], [1, -38 + low + bob]], ch.collar);
  // bras avant
  limb(ctx, 1, shY, aR, 17, 5.5, top);
  circ(ctx, 1 + Math.sin(aR) * 17, shY + Math.cos(aR) * 17, 3, skin);

  // tête
  const hx = 1, hy = -53 + low + bob, hc = ch.hair || '#333', hs = ch.hairStyle || 'short';
  if (hs === 'long') rr(ctx, hx - 13, hy - 6, 10, 26, 5, hc);
  if (hs === 'bun') circ(ctx, hx - 8, hy - 12, 5.5, hc);
  circ(ctx, hx, hy, 10, skin);
  circ(ctx, hx - 9.5, hy + 1, 2.6, shade(skin, -0.08));
  ctx.fillStyle = hc;
  const cap = ch.cap || '#c0392b';
  switch (hs) {
    case 'bald':  rect(ctx, hx - 10.5, hy - 3, 3.5, 7, hc); break;
    case 'short': case 'long': case 'bun':
      ctx.beginPath(); ctx.arc(hx, hy - 2.5, 10.8, Math.PI, 6.2832); ctx.closePath(); ctx.fill();
      rect(ctx, hx - 10.8, hy - 2.5, 4.5, 9, hc); break;
    case 'curly':
      ctx.beginPath(); ctx.arc(hx, hy - 2.5, 10.8, Math.PI, 6.2832); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 6; i++) circ(ctx, hx - 9 + i * 3.6, hy - 11 + Math.sin(i * 1.7) * 1.5, 4.2, hc);
      rect(ctx, hx - 10.8, hy - 2.5, 4.5, 9, hc); break;
    case 'cap':
      ctx.beginPath(); ctx.arc(hx, hy - 2.5, 11, Math.PI, 6.2832); ctx.closePath(); ctx.fillStyle = cap; ctx.fill();
      rr(ctx, hx + 2, hy - 6, 13, 4, 2, shade(cap, -0.2));
      rect(ctx, hx - 10.8, hy - 2.5, 4, 6, hc); break;
    case 'helmet':
      ctx.beginPath(); ctx.arc(hx, hy - 2, 11.6, Math.PI, 6.2832); ctx.closePath(); ctx.fillStyle = '#f4c20d'; ctx.fill();
      rr(ctx, hx - 12.5, hy - 3.5, 25, 3.5, 1.5, '#d9a800');
      rect(ctx, hx - 1, hy - 13, 2.5, 9, '#d9a800'); break;
  }
  // visage
  const blink = (t % 4) < 0.12;
  const ex1 = hx + 3.5, ex2 = hx + 8, ey = hy + 0.8;
  circ(ctx, hx + 10, hy + 2.5, 1.8, shade(skin, -0.07));
  if (blink) { line(ctx, ex1 - 1.4, ey, ex1 + 1.4, ey, '#222', 1.2); line(ctx, ex2 - 1.4, ey, ex2 + 1.4, ey, '#222', 1.2); }
  else { circ(ctx, ex1, ey, 1.5, '#222'); circ(ctx, ex2, ey, 1.5, '#222'); }
  if (ch.glasses) {
    ctx.strokeStyle = ch.glassColor || '#222'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(ex1, ey, 3.2, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(ex2, ey, 3.2, 0, 6.2832); ctx.stroke();
    line(ctx, ex1 + 3.2, ey, ex2 - 3.2, ey, ch.glassColor || '#222', 1.1);
    line(ctx, ex1 - 3.2, ey, hx - 9, ey - 0.5, ch.glassColor || '#222', 1.1);
  }
  if (ch.beard) { ctx.beginPath(); ctx.arc(hx, hy + 1.5, 10.4, 0.2, Math.PI - 0.2); ctx.closePath(); ctx.fillStyle = hc; ctx.fill(); }
  if (ch.mustache) rr(ctx, hx + 2.5, hy + 3.4, 8, 2.8, 1.3, hc);
  if (a.talking) ell(ctx, hx + 6.5, hy + 7, 2.3, 1.2 + Math.abs(Math.sin(t * 14)) * 1.7, '#7a2b2b');
  else if (!ch.beard) { ctx.strokeStyle = '#8a4040'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx + 6.5, hy + 4.2, 2.8, 0.25, Math.PI - 0.25); ctx.stroke(); }
  ctx.restore();

  if (a.emote) {
    const ex = x, ey = y - 80 * sc + Math.sin((a.t || 0) * 4) * 2;
    rr(ctx, ex - 16, ey - 22, 32, 24, 9, '#fff', '#333', 1.5);
    poly(ctx, [[ex - 4, ey + 1], [ex + 4, ey + 1], [ex, ey + 8]], '#fff');
    txt(ctx, a.emote, ex, ey - 4, 16, '#222', 'center');
  }
}

/* Buste pour la boîte de dialogue */
function drawPortrait(ctx, ch, x, y, w, h, t, talking) {
  ctx.save();
  rr(ctx, x, y, w, h, 12, '#2d3a63');
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const s = h / 29;
  ctx.translate(x + w / 2 - 3, y + h * 0.46);
  ctx.scale(s, s);
  drawCharacter(ctx, ch, 0, 53, { state: 'idle', t: t, talking: talking, noShadow: true });
  ctx.restore();
  rr(ctx, x, y, w, h, 12, null, '#8fa6ff', 2);
}

/* ============================================================
   OBJETS À RAMASSER   (centrés sur x,y)
   ============================================================ */
function drawItem(ctx, kind, x, y, s, t, v) {
  s = s || 1; v = v || 1; t = t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (kind) {
    case 'maki':
      circ(ctx, 0, 0, 12, '#1d2a22'); circ(ctx, 0, 0, 9.5, '#fbf7ec');
      circ(ctx, 0, 0, 4.6, v % 2 ? '#ef6a4c' : '#7bbf5a'); circ(ctx, -3, -4, 2, 'rgba(255,255,255,.6)'); break;
    case 'sushi':
      rr(ctx, -12, 1, 24, 10, 5, '#fbf7ec'); rr(ctx, -13, -7, 26, 11, 5, '#f2855a');
      for (let i = -8; i <= 8; i += 6) line(ctx, i, -6, i + 2, 2, '#ffd2bd', 1.2);
      rect(ctx, -2.5, -7, 5, 18, '#1d2a22'); break;
    case 'brochette':
      ctx.rotate(-0.5); line(ctx, -16, 0, 16, 0, '#d9b27a', 2.4);
      for (let i = -1; i <= 1; i++) { rr(ctx, i * 9 - 5, -5.5, 10, 11, 3.5, i === 0 ? '#6aa84f' : '#a4511c'); rr(ctx, i * 9 - 3.5, -4.2, 4, 3, 1.5, 'rgba(255,255,255,.35)'); }
      break;
    case 'logi': {
      const m = v % 3;
      if (m === 0) { rr(ctx, -13, -9, 26, 18, 3, '#2f7fd1', '#fff', 2); line(ctx, -7, -2, 7, -2, '#fff', 2); line(ctx, -7, 3, 3, 3, '#fff', 2); }
      else if (m === 1) { poly(ctx, [[0, -13], [15, 0], [0, 13], [-15, 0]], '#e08a2e'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); txt(ctx, '?', 0, 5, 14, '#fff', 'center'); }
      else { rr(ctx, -14, -8, 28, 16, 8, '#3aa56b', '#fff', 2); line(ctx, -6, 0, 6, 0, '#fff', 2); poly(ctx, [[6, -3.5], [11, 0], [6, 3.5]], '#fff'); }
      break; }
    case 'ticket':
      rr(ctx, -14, -9, 28, 18, 3, '#fffdf6', '#c0392b', 2); rect(ctx, -14, -9, 8, 18, '#c0392b');
      for (let i = 0; i < 5; i++) rect(ctx, -1 + i * 3.4, 2, i % 2 ? 1.2 : 2, 5, '#333');
      line(ctx, 0, -4, 10, -4, '#999', 2); break;
    case 'entrecote':
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.bezierCurveTo(-14, -13, 10, -14, 14, -4); ctx.bezierCurveTo(16, 8, 2, 12, -8, 9); ctx.bezierCurveTo(-13, 7, -14, 4, -14, 0);
      ctx.fillStyle = '#8c4a2b'; ctx.fill(); ctx.strokeStyle = '#e9c9a0'; ctx.lineWidth = 2.4; ctx.stroke();
      for (let i = -2; i <= 2; i++) line(ctx, i * 5 - 3, -6, i * 5 + 3, 6, '#4a2112', 1.8); break;
    case 'frites':
      for (let i = 0; i < 7; i++) rr(ctx, -9 + i * 3, -12 - (i % 3) * 3, 2.8, 14, 1, '#f4c542');
      poly(ctx, [[-11, -2], [11, -2], [8, 11], [-8, 11]], '#d63a2f'); rect(ctx, -9, 2, 18, 2.4, '#fff'); break;
    case 'biere':
      rr(ctx, -8, -8, 16, 19, 3, '#f2b632', '#fff', 1.2);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(10, 2, 5, -1.3, 1.3); ctx.stroke();
      circ(ctx, -4, -9, 4, '#fff'); circ(ctx, 1, -11, 4.6, '#fff'); circ(ctx, 6, -8, 3.6, '#fff'); break;
    case 'cadeau':
      rr(ctx, -12, -6, 24, 17, 2, '#d64045'); rect(ctx, -2.5, -6, 5, 17, '#ffe08a'); rect(ctx, -12, 1, 24, 4, '#ffe08a');
      circ(ctx, -4, -9, 4.4, '#ffe08a'); circ(ctx, 4, -9, 4.4, '#ffe08a'); circ(ctx, 0, -8, 2.4, '#d9a800'); break;
    case 'plat':
      circ(ctx, 0, 0, 13, '#f7f7f7'); circ(ctx, 0, 0, 13, 'rgba(0,0,0,0)'); ctx.strokeStyle = '#c9b27a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.2832); ctx.stroke();
      circ(ctx, -3, 1, 3.6, '#e8604c'); circ(ctx, 4, -2, 2.6, '#7bbf5a'); circ(ctx, 2, 4, 2, '#f4c542'); break;
    case 'cafe':
      rr(ctx, -8, -4, 15, 14, 3, '#fff', '#555', 1.4); ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(9, 3, 4, -1.3, 1.3); ctx.stroke();
      rect(ctx, -7, -3, 13, 4, '#6b3e26');
      ctx.strokeStyle = 'rgba(120,120,120,.6)'; ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(i * 3, -6); ctx.quadraticCurveTo(i * 3 + 3 * Math.sin(t * 3 + i), -11, i * 3, -15); ctx.stroke(); } break;
    case 'courrier':
      rr(ctx, -14, -9, 28, 18, 2, '#f5f5f5', '#555', 1.5); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-14, -9); ctx.lineTo(0, 2); ctx.lineTo(14, -9); ctx.stroke(); break;
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, an = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = '#e09a00'; ctx.lineWidth = 1.5; ctx.stroke(); break; }
    default:
      rr(ctx, -10, -10, 20, 20, 4, '#ff66aa', '#fff', 2); txt(ctx, '?', 0, 6, 16, '#fff', 'center');
  }
  ctx.restore();
}
const ITEM_KINDS = ['maki', 'sushi', 'brochette', 'logi', 'ticket', 'entrecote', 'frites', 'biere', 'cadeau', 'plat', 'cafe', 'courrier', 'star'];

/* ============================================================
   ENNEMIS / OBSTACLES   (pieds en y, centrés sur x)
   ============================================================ */
const WAITER = { name: 'Serveur', skin: '#e8b88a', hair: '#222', hairStyle: 'short', top: '#f4f4f4', bottom: '#1b1b1b', tie: '#111' };
const HAZARDS = {
  chair:  { w: 30, h: 36, speed: 55, fly: false, label: 'Chaise de bureau' },
  valise: { w: 32, h: 28, speed: 70, fly: false, label: 'Valise' },
  waiter: { w: 22, h: 52, speed: 50, fly: false, label: 'Serveur pressé' },
  mail:   { w: 30, h: 22, speed: 60, fly: true,  label: 'Mail urgent' },
};
function eyes(ctx, x, y, dir, gap) {
  for (const sx of [-1, 1]) {
    const ex = x + sx * gap;
    circ(ctx, ex, y, 3.4, '#fff'); circ(ctx, ex + dir * 1.2, y + 0.6, 1.7, '#111');
    // sourcils froncés
    line(ctx, ex - 3.6, y - 5.2 + (sx > 0 ? 2 : 0), ex + 3.6, y - 5.2 + (sx > 0 ? 0 : 2), '#111', 1.6);
  }
}
function drawHazard(ctx, type, x, y, t, dir, squash) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, squash ? 0.3 : 1);
  dir = dir || 1;
  switch (type) {
    case 'chair': {
      ctx.strokeStyle = '#444'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const a of [-1, -0.5, 0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(a * 13, -4); ctx.stroke(); circ(ctx, a * 13, -3, 2.8, '#222'); }
      rect(ctx, -2, -20, 4, 12, '#666');
      rr(ctx, -14, -27, 28, 8, 3, '#e0553c'); rr(ctx, -11, -48, 22, 22, 6, '#3a4b5f');
      eyes(ctx, 0, -37, dir, 5); break; }
    case 'valise':
      rr(ctx, -15, -26, 30, 22, 4, '#8a5a34', '#5a3a1e', 1.5); rect(ctx, -15, -17, 30, 3, '#5a3a1e');
      rr(ctx, -5, -31, 10, 6, 2, null, '#333', 2); circ(ctx, -10, -3, 3, '#222'); circ(ctx, 10, -3, 3, '#222');
      eyes(ctx, 0, -20, dir, 5); break;
    case 'waiter': {
      drawCharacter(ctx, WAITER, 0, 0, { facing: dir, state: 'walk', t: t, noShadow: false });
      ell(ctx, dir * 15, -58, 11, 2.6, '#cfcfcf'); circ(ctx, dir * 15, -63, 4, '#f2b632'); rect(ctx, dir * 15 - 1, -68, 2, 4, '#ddd');
      line(ctx, dir * 6, -62, dir * 14, -52, '#cfcfcf', 1); break; }
    case 'mail': {
      const fl = Math.sin(t * 16) * 5;
      ell(ctx, -17, -14 - fl, 8, 4, '#dfe9f5'); ell(ctx, 17, -14 - fl, 8, 4, '#dfe9f5');
      rr(ctx, -14, -22, 28, 20, 2, '#f5f5f5', '#555', 1.5);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-14, -22); ctx.lineTo(0, -12); ctx.lineTo(14, -22); ctx.stroke();
      circ(ctx, 10, -5, 4, '#e03a3a'); txt(ctx, '!', 10, -2, 8, '#fff', 'center');
      eyes(ctx, 0, -9, dir, 5); break; }
  }
  ctx.restore();
}

/* ============================================================
   ÉLÉMENTS DE DÉCOR INTERACTIFS : porte, café, ressort
   ============================================================ */
function drawDoor(ctx, x, y, open, t, label) {
  rr(ctx, x - 22, y - 70, 44, 70, 4, '#4a3b2f');
  rr(ctx, x - 17, y - 65, 34, 65, 3, open ? '#fff3b0' : '#6b5646');
  if (open) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4); circ(ctx, x, y - 35, 38, '#fff3b0'); ctx.globalAlpha = 1; poly(ctx, [[x - 17, y - 65], [x - 5, y - 60], [x - 5, y - 4], [x - 17, y]], '#8a6e50'); }
  else { circ(ctx, x + 10, y - 32, 2.5, '#d9b34a'); }
  if (label) { rr(ctx, x - 36, y - 92, 72, 18, 5, '#222'); txt(ctx, label, x, y - 79, 10, '#ffe08a', 'center'); }
}
function drawCoffeeMachine(ctx, x, y, on, t) {
  rr(ctx, x - 13, y - 46, 26, 46, 4, '#37404d'); rr(ctx, x - 10, y - 42, 20, 14, 3, '#10151c');
  circ(ctx, x - 5, y - 35, 2.2, on ? '#5de27a' : '#e05a4a'); circ(ctx, x + 3, y - 35, 2.2, '#888');
  rect(ctx, x - 8, y - 22, 16, 3, '#111'); rr(ctx, x - 5, y - 18, 10, 10, 2, '#fff');
  if (on) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 2, y - 22); ctx.quadraticCurveTo(x - 6 + 3 * Math.sin(t * 4), y - 32, x - 2, y - 40); ctx.stroke(); }
  txt(ctx, 'CAFÉ', x, y - 1, 7, '#ffe08a', 'center');
}
function drawSpring(ctx, x, y, squash) {
  const h = 12 - squash * 6;
  rr(ctx, x - 13, y - h - 4, 26, 5, 2, '#e8453c'); rr(ctx, x - 10, y - 3, 20, 3, 1, '#444');
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 4; i++) ctx.lineTo(x + (i % 2 ? 7 : -7), y - 3 - (h - 1) * i / 4); ctx.stroke();
}

/* ============================================================
   ACCESSOIRES de cinématique (posés au sol, y = sol)
   ============================================================ */
function drawProp(ctx, p, t) {
  const x = p.x, y = p.y;
  switch (p.kind) {
    case 'desk':
      rr(ctx, x - 44, y - 34, 88, 8, 2, '#c9a46a'); rect(ctx, x - 40, y - 26, 5, 26, '#8d6e3f'); rect(ctx, x + 35, y - 26, 5, 26, '#8d6e3f');
      rr(ctx, x - 15, y - 58, 30, 22, 2, '#222'); rr(ctx, x - 13, y - 56, 26, 17, 1, '#7cc0ff'); rect(ctx, x - 3, y - 36, 6, 4, '#555');
      rr(ctx, x - 14, y - 38, 28, 4, 1, '#ddd'); break;
    case 'chair':
      rr(ctx, x - 9, y - 52, 18, 26, 5, '#3a4b5f'); rr(ctx, x - 13, y - 28, 26, 7, 3, '#e0553c'); rect(ctx, x - 2, y - 22, 4, 16, '#666');
      line(ctx, x - 12, y - 3, x + 12, y - 3, '#444', 3); break;
    case 'table': {
      const col = p.color || '#fff';
      ell(ctx, x, y - 36, 48, 10, shade(col, -0.1)); ell(ctx, x, y - 38, 48, 10, col);
      poly(ctx, [[x - 48, y - 37], [x + 48, y - 37], [x + 38, y], [x - 38, y]], shade(col, -0.05));
      if (p.check) { ctx.save(); ctx.beginPath(); ctx.moveTo(x - 48, y - 37); ctx.lineTo(x + 48, y - 37); ctx.lineTo(x + 38, y); ctx.lineTo(x - 38, y); ctx.closePath(); ctx.clip();
        for (let i = -6; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) & 1) rect(ctx, x + i * 9, y - 38 + j * 7, 9, 7, p.check); ctx.restore();
        ell(ctx, x, y - 38, 48, 10, col); ctx.save(); ctx.beginPath(); ctx.ellipse(x, y - 38, 48, 10, 0, 0, 6.2832); ctx.clip();
        for (let i = -6; i < 6; i++) for (let j = -2; j < 2; j++) if ((i + j) & 1) rect(ctx, x + i * 8, y - 38 + j * 5, 8, 5, p.check); ctx.restore(); }
      for (const dx of (p.plates === undefined ? [-22, 22] : p.plates)) { ell(ctx, x + dx, y - 40, 11, 3.5, '#f3f3f3'); ell(ctx, x + dx, y - 41, 6, 1.8, '#ddd'); }
      if (p.candle) { rect(ctx, x - 2, y - 52, 4, 12, '#f5ecd0'); circ(ctx, x, y - 56 + Math.sin(t * 9) * 0.6, 3, '#ffb347'); }
      break; }
    case 'whiteboard': {
      const n = p.pieces === undefined ? 6 : p.pieces;
      rr(ctx, x - 90, y - 60, 180, 120, 6, '#f7f9fb', '#9aa7b5', 4);
      const nodes = [[-62, -36, 'r'], [-6, -36, 'd'], [50, -36, 'r'], [-62, 12, 'r'], [-6, 12, 'o'], [50, 12, 'r']];
      for (let i = 0; i < 6; i++) {
        const [nx, ny, k] = nodes[i];
        ctx.globalAlpha = i < n ? 1 : 0.18;
        if (k === 'r') rr(ctx, x + nx - 22, y + ny - 11, 44, 22, 3, '#2f7fd1', '#fff', 1);
        else if (k === 'd') poly(ctx, [[x + nx, y + ny - 15], [x + nx + 24, y + ny], [x + nx, y + ny + 15], [x + nx - 24, y + ny]], '#e08a2e');
        else rr(ctx, x + nx - 22, y + ny - 11, 44, 22, 11, '#3aa56b');
        if (i < 5) { line(ctx, x + nx + (k === 'd' ? 24 : 22), y + ny, x + nx + 34, y + ny, '#556', 1.5); }
      }
      ctx.globalAlpha = 1; rect(ctx, x - 50, y + 60, 6, 40, '#777'); rect(ctx, x + 44, y + 60, 6, 40, '#777'); break; }
    case 'banner': {
      const w = p.w || 520;
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y + 26, x + w / 2, y); ctx.stroke();
      rr(ctx, x - w / 2 + 20, y + 4, w - 40, 38, 8, '#e0334c', '#ffd23f', 3);
      txt(ctx, p.text || CONFIG.banner, x, y + 30, 22, '#fff', 'center'); break; }
    case 'cake':
      rr(ctx, x - 36, y - 20, 72, 20, 4, '#f7d9c4'); rr(ctx, x - 28, y - 38, 56, 18, 4, '#f4b6c2'); rect(ctx, x - 36, y - 24, 72, 5, '#fff');
      for (const dx of [-16, 0, 16]) { rect(ctx, x + dx - 1.5, y - 52, 3, 14, '#6ab0ff'); ctx.globalAlpha = 0.9; ell(ctx, x + dx, y - 56 + Math.sin(t * 10 + dx) * 0.7, 3, 5, '#ffb347'); ctx.globalAlpha = 1; }
      break;
    case 'dchair':   // chaise de restaurant
      rr(ctx, x - 6, y - 56, 12, 32, 3, '#7a4a2a'); rr(ctx, x - 17, y - 26, 34, 6, 2, '#8d5a34');
      rect(ctx, x - 15, y - 20, 4, 20, '#6b3f26'); rect(ctx, x + 11, y - 20, 4, 20, '#6b3f26'); break;
    case 'stool':
      rr(ctx, x - 13, y - 36, 26, 7, 3, '#b3261e'); rect(ctx, x - 2, y - 29, 4, 29, '#aaa'); line(ctx, x - 12, y - 2, x + 12, y - 2, '#aaa', 3); break;
    case 'counter':
      rr(ctx, x - 80, y - 60, 160, 60, 4, '#5a3a24'); rect(ctx, x - 82, y - 64, 164, 8, '#8a5a34');
      for (let i = 0; i < 3; i++) rr(ctx, x - 60 + i * 50, y - 52, 40, 44, 3, '#46301e'); break;
    case 'door':
      drawDoor(ctx, x, y, p.open !== false, t, p.label); break;
    case 'seat':  // siège de train
      rr(ctx, x - 22, y - 62, 44, 62, 8, '#2c5d9e'); rr(ctx, x - 26, y - 26, 52, 22, 6, '#3a74be'); rr(ctx, x - 14, y - 76, 28, 16, 6, '#e8edf5'); break;
    default:
      if (ITEM_KINDS.includes(p.kind)) drawItem(ctx, p.kind, x, y - (p.lift === undefined ? 14 : p.lift), p.scale || 1.4, t, p.v);
  }
}

/* ============================================================
   THÈMES (couleurs des blocs de sol / plateformes)
   ============================================================ */
const THEMES = {
  openspace: { floor: '#6f7f93', floorTop: '#9fb0c4', plat: '#b98f52', platTop: '#dcb77a', label: 'Open space' },
  train:     { floor: '#59616d', floorTop: '#8a93a0', plat: '#9aa4b2', platTop: '#cfd6e0', label: 'Train' },
  japonais:  { floor: '#a68a5b', floorTop: '#cdb888', plat: '#6b3f26', platTop: '#9a6038', label: 'Restaurant japonais' },
  charlies:  { floor: '#2a2a2a', floorTop: '#f1ece0', plat: '#8b2c22', platTop: '#d9503f', label: "Charlie's" },
  gastro:    { floor: '#2a1f1a', floorTop: '#c9a24a', plat: '#e9e4d8', platTop: '#c9a24a', label: 'Restaurant gastro' },
  bar:       { floor: '#241638', floorTop: '#ff4fa3', plat: '#4b2a1a', platTop: '#ff9a3c', label: 'Le bar' },
};
function drawTile(ctx, theme, kind, px, py, topExposed, tx, ty) {
  const T = THEMES[theme] || THEMES.openspace;
  if (kind === '=') {
    rr(ctx, px, py, TILE, 12, 3, T.plat); rect(ctx, px, py, TILE, 4, T.platTop);
    rect(ctx, px, py + 12, TILE, 2, 'rgba(0,0,0,.12)');
    return;
  }
  let base = T.floor;
  if (theme === 'charlies') base = ((tx + ty) & 1) ? '#f1ece0' : '#222';
  rect(ctx, px, py, TILE, TILE, base);
  switch (theme) {
    case 'openspace': rect(ctx, px + TILE - 1, py, 1, TILE, 'rgba(0,0,0,.12)'); rect(ctx, px, py + TILE - 1, TILE, 1, 'rgba(0,0,0,.12)'); break;
    case 'train':     rect(ctx, px, py + 15, TILE, 2, 'rgba(0,0,0,.2)'); circ(ctx, px + 5, py + 5, 1.5, 'rgba(255,255,255,.25)'); circ(ctx, px + TILE - 5, py + 5, 1.5, 'rgba(255,255,255,.25)'); break;
    case 'japonais':  rect(ctx, px, py + TILE - 2, TILE, 2, '#6e5833'); rect(ctx, px + 15, py, 2, TILE, 'rgba(110,88,51,.4)'); break;
    case 'gastro':    rect(ctx, px, py + TILE - 1, TILE, 1, 'rgba(201,162,74,.35)'); rect(ctx, px + ((ty & 1) ? 8 : 20), py, 1, TILE, 'rgba(0,0,0,.35)'); break;
    case 'bar':       rect(ctx, px, py + TILE - 1, TILE, 1, 'rgba(255,79,163,.25)'); break;
  }
  if (topExposed) { rect(ctx, px, py, TILE, theme === 'charlies' ? 3 : 5, T.floorTop); if (theme === 'bar') { ctx.globalAlpha = 0.35; rect(ctx, px, py - 2, TILE, 2, '#ff4fa3'); ctx.globalAlpha = 1; } }
}

/* ============================================================
   DÉCORS (parallaxe) — réutilisables par les niveaux et cinématiques
   ============================================================ */
function par(cx, f, period, fn) {            // répète fn(screenX, index) avec parallaxe f
  const off = cx * f, first = Math.floor(off / period) - 1, n = Math.ceil(W / period) + 3;
  for (let i = first; i < first + n; i++) fn(i * period - off, i);
}
function vgrad(ctx, y0, y1, c0, c1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); }

function landscape(ctx, x, y, w, h, scroll) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#79b8f0'); g.addColorStop(1, '#d6ecfb'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  circ(ctx, x + w * 0.75, y + 40, 18, '#fff6c2');
  // collines lointaines
  ctx.fillStyle = '#9cc8a2'; ctx.beginPath(); ctx.moveTo(x, y + h);
  for (let i = 0; i <= w; i += 8) ctx.lineTo(x + i, y + h - 60 + Math.sin((i + scroll * 0.12) * 0.018) * 18);
  ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.fillStyle = '#6fae78'; ctx.beginPath(); ctx.moveTo(x, y + h);
  for (let i = 0; i <= w; i += 8) ctx.lineTo(x + i, y + h - 34 + Math.sin((i + scroll * 0.3) * 0.03 + 2) * 10);
  ctx.lineTo(x + w, y + h); ctx.fill();
  // arbres
  for (let k = 0; k < 6; k++) { const tx = x + mod(k * 90 - scroll * 0.7, w + 90) - 20; poly(ctx, [[tx, y + h - 20], [tx + 14, y + h - 62], [tx + 28, y + h - 20]], '#3f8a4f'); rect(ctx, tx + 12, y + h - 20, 5, 12, '#6b4a2a'); }
  // poteaux
  for (let k = 0; k < 3; k++) { const px = x + mod(k * 160 - scroll * 1.8, w + 160) - 30; rect(ctx, px, y + 10, 5, h - 10, '#5a4a3a'); rect(ctx, px - 8, y + 24, 21, 3, '#5a4a3a'); }
  ctx.restore();
}

const BG = {};
BG.openspace = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#e9eff5', '#cbd7e2');
  par(cx, 0.15, 380, (x, i) => {
    const wx = x + 20, wy = 36, ww = 330, wh = 250;
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    const sg = ctx.createLinearGradient(0, wy, 0, wy + wh); sg.addColorStop(0, '#86c0fa'); sg.addColorStop(1, '#e2f1ff'); ctx.fillStyle = sg; ctx.fillRect(wx, wy, ww, wh);
    for (let k = 0; k < 9; k++) {
      const bh = 50 + hash(i * 10 + k) * 140, bw = 30 + hash(i * 7 + k) * 22, bx = wx + k * 38 - 6;
      rect(ctx, bx, wy + wh - bh, bw, bh, k % 2 ? '#8ea9c4' : '#a3b9cf');
      for (let r = 0; r < bh / 16 - 1; r++) for (let c = 0; c < bw / 12 - 1; c++) if (hash(i * 100 + k * 13 + r * 3 + c) > 0.55) rect(ctx, bx + 5 + c * 12, wy + wh - bh + 8 + r * 16, 6, 8, '#d6e6f5');
    }
    ctx.restore();
    ctx.strokeStyle = '#f7fafc'; ctx.lineWidth = 8; ctx.strokeRect(wx, wy, ww, wh); rect(ctx, wx + ww / 2 - 3, wy, 6, wh, '#f7fafc');
  });
  par(cx, 0.3, 260, (x) => { rr(ctx, x + 40, 6, 150, 9, 4, '#fff'); ctx.globalAlpha = 0.14; rect(ctx, x + 50, 15, 130, 40, '#fff'); ctx.globalAlpha = 1; });
  par(cx, 0.4, 1000, (x, i) => { if (i % 2 === 0) { rr(ctx, x + 300, 300, 120, 80, 5, '#f7f9fb', '#9aa7b5', 3); for (let k = 0; k < 3; k++) rr(ctx, x + 312 + k * 36, 318 + (k % 2) * 18, 28, 16, 3, '#2f7fd1'); line(ctx, x + 340, 326, x + 348, 326, '#556', 1.5); } });
  par(cx, 0.55, 200, (x, i) => {
    const bx = x + 20, by = FLOOR_Y - 58;
    if (hash(i * 5) > 0.35) { circ(ctx, bx + 52, by - 22, 9, '#a6b6c6'); rr(ctx, bx + 40, by - 14, 24, 26, 8, '#a6b6c6'); }
    rr(ctx, bx, by, 96, 8, 2, '#b5c2cf'); rect(ctx, bx + 4, by + 8, 5, 50, '#a3b0bd'); rect(ctx, bx + 87, by + 8, 5, 50, '#a3b0bd');
    rr(ctx, bx + 30, by - 36, 34, 24, 3, '#6f7f93'); rr(ctx, bx + 33, by - 33, 28, 18, 2, hash(i * 3) > 0.5 ? '#9fd0ff' : '#c4dcf2');
  });
  par(cx, 0.7, 640, (x) => { rr(ctx, x + 200, FLOOR_Y - 34, 26, 34, 4, '#8b6a4a'); for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x + 213, FLOOR_Y - 34); ctx.rotate(-1.2 + k * 0.6); ell(ctx, 0, -22, 6, 20, '#4fa36b'); ctx.restore(); } });
};
BG.train = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#dfe3e9', '#c3cad4');
  const sc = t * 150 + cx * 0.3;
  par(cx, 0.9, 340, (x) => {
    landscape(ctx, x + 30, 60, 280, 200, sc);
    ctx.strokeStyle = '#f2f4f7'; ctx.lineWidth = 10; ctx.strokeRect(x + 30, 60, 280, 200);
    rect(ctx, x + 168, 60, 6, 200, '#f2f4f7');
  });
  rect(ctx, 0, 262, W, 14, '#aeb6c2');
  par(cx, 0.9, 340, (x) => { rr(ctx, x + 20, 20, 300, 14, 4, '#9aa4b2'); for (let k = 0; k < 4; k++) rr(ctx, x + 40 + k * 70, 4, 52, 20, 5, k % 2 ? '#3d6fa8' : '#a55a3a'); });
  rect(ctx, 0, 276, W, FLOOR_Y - 276, '#c9d0da');
  par(cx, 0.9, 340, (x) => { rect(ctx, x + 20, 292, 300, 6, '#b3bcc9'); });
  par(cx, 0.9, 170, (x) => { rr(ctx, x + 12, FLOOR_Y - 110, 56, 70, 10, '#2c5d9e'); rr(ctx, x + 22, FLOOR_Y - 124, 36, 18, 7, '#e8edf5'); rr(ctx, x + 6, FLOOR_Y - 60, 72, 20, 6, '#3a74be'); });
  rect(ctx, 0, FLOOR_Y - 8, W, 8, 'rgba(0,0,0,.08)');
};
BG.japonais = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#3a281d', '#241810');
  par(cx, 0.45, 280, (x) => { rect(ctx, x + 20, 90, 240, 320, '#f4ecd6'); ctx.strokeStyle = '#7b5a35'; ctx.lineWidth = 4; ctx.strokeRect(x + 20, 90, 240, 320);
    for (let i = 1; i < 4; i++) rect(ctx, x + 20 + i * 60 - 1.5, 90, 3, 320, '#7b5a35'); for (let j = 1; j < 6; j++) rect(ctx, x + 20, 90 + j * 53 - 1.5, 240, 3, '#7b5a35'); });
  par(cx, 0.45, 840, (x) => { ctx.globalAlpha = 0.55; ctx.strokeStyle = '#8c5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 40, 400); ctx.bezierCurveTo(x + 120, 300, x + 180, 340, x + 260, 190); ctx.stroke(); for (let k = 0; k < 9; k++) circ(ctx, x + 70 + k * 22, 330 - k * 15 + Math.sin(k * 3) * 14, 7, '#f7b6c8'); ctx.globalAlpha = 1; });
  // tapis roulant (kaiten)
  rr(ctx, 0, 352, W, 16, 3, '#2a2a2a'); rect(ctx, 0, 368, W, 8, '#554');
  for (let i = 0; i < W / 84 + 3; i++) { const px = mod(i * 84 + t * 38 - cx * 0.6, W + 168) - 84, colors = ['#f2855a', '#e8604c', '#7bbf5a', '#f4c542']; ell(ctx, px, 349, 20, 5, '#f3f3f3'); ell(ctx, px, 345, 12, 5, colors[i % 4]); }
  par(cx, 0.35, 190, (x, i) => { const sw = Math.sin(t * 1.4 + i) * 3; line(ctx, x + 60 + sw * 0.3, 0, x + 60 + sw, 76, '#ccc', 1.5); ell(ctx, x + 60 + sw, 96, 20, 24, '#d4352c'); for (let k = -1; k <= 1; k++) ctx.strokeStyle = 'rgba(0,0,0,.18)', ctx.lineWidth = 1.2, ctx.beginPath(), ctx.ellipse(x + 60 + sw, 96, Math.abs(k) * 10 + 1, 24, 0, 0, 6.2832), ctx.stroke(); rect(ctx, x + 50 + sw, 70, 20, 4, '#222'); rect(ctx, x + 50 + sw, 118, 20, 4, '#222'); });
  par(cx, 0.8, 210, (x, i) => { for (let k = 0; k < 5; k++) { const sw = Math.sin(t * 1.1 + i + k) * 1.5; rect(ctx, x + k * 22, 0, 18, 46 + (k % 2) * 8 + sw, k % 2 ? '#f4f4f4' : '#c5362d'); } });
  par(cx, 0.7, 300, (x) => { rr(ctx, x + 40, FLOOR_Y - 48, 70, 10, 2, '#7a4a2a'); rect(ctx, x + 48, FLOOR_Y - 38, 6, 38, '#5a3a22'); rect(ctx, x + 96, FLOOR_Y - 38, 6, 38, '#5a3a22'); circ(ctx, x + 140, FLOOR_Y - 18, 16, '#d4352c'); circ(ctx, x + 140, FLOOR_Y - 18, 11, '#e8604c'); rect(ctx, x + 136, FLOOR_Y - 4, 8, 4, '#222'); });
};
BG.charlies = (ctx, cx, t) => {
  rect(ctx, 0, 0, W, H, '#9a3328');
  par(cx, 0.3, 64, (x) => { for (let r = 0; r < 18; r++) { const off = (r % 2) * 32; for (let k = -1; k < 2; k++) rect(ctx, x + off + k * 64, r * 24, 62, 22, ((r + k) & 1) ? '#a8392d' : '#8f2f25'); } });
  rect(ctx, 0, 0, W, 54, '#7c231a');
  par(cx, 0.3, 120, (x, i) => { poly(ctx, [[x, 0], [x + 60, 0], [x + 60, 40], [x + 30, 54], [x, 40]], i % 2 ? '#f4efe3' : '#c5362d'); poly(ctx, [[x + 60, 0], [x + 120, 0], [x + 120, 40], [x + 90, 54], [x + 60, 40]], i % 2 ? '#c5362d' : '#f4efe3'); });
  par(cx, 0.4, 560, (x) => { rr(ctx, x + 80, 110, 280, 150, 8, '#24332b', '#8a5a34', 8); ctx.font = 'italic bold 22px "Comic Sans MS","Segoe Print",cursive'; txt(ctx, 'ENTRECÔTE', x + 220, 156, 26, '#f4efe3', 'center', 'bold', '"Comic Sans MS","Segoe Print",cursive'); txt(ctx, 'FRITES À VOLONTÉ', x + 220, 192, 18, '#ffe08a', 'center', 'bold', '"Comic Sans MS","Segoe Print",cursive'); txt(ctx, 'dessert maison', x + 220, 226, 16, '#f4efe3', 'center', 'bold', '"Comic Sans MS","Segoe Print",cursive'); });
  par(cx, 0.4, 560, (x) => { for (const [dx, dy] of [[400, 120], [450, 160]]) { rr(ctx, x + dx, dy, 44, 54, 3, '#f4efe3', '#6b4a2a', 4); rect(ctx, x + dx + 6, dy + 6, 32, 42, '#caa88a'); } });
  par(cx, 0.5, 280, (x) => { ctx.globalAlpha = 0.18; circ(ctx, x + 140, 150, 60, '#ffcf70'); ctx.globalAlpha = 1; rect(ctx, x + 138, 90, 4, 28, '#2a2a2a'); poly(ctx, [[x + 124, 138], [x + 156, 138], [x + 148, 116], [x + 132, 116]], '#f2c24a'); });
  rect(ctx, 0, 330, W, 150, '#2f4a3a'); rect(ctx, 0, 326, W, 6, '#8a5a34');
  par(cx, 0.6, 250, (x) => { drawProp(ctx, { kind: 'table', x: x + 125, y: FLOOR_Y - 4, color: '#f4efe3', check: '#c5362d', plates: [-20, 20] }, t); rr(ctx, x + 60, FLOOR_Y - 90, 14, 60, 4, '#5a3a22'); rr(ctx, x + 176, FLOOR_Y - 90, 14, 60, 4, '#5a3a22'); });
  par(cx, 0.55, 700, (x) => { rr(ctx, x + 200, 66, 200, 40, 8, '#1a1a1a'); txt(ctx, "CHARLIE'S", x + 300, 96, 28, '#ff4a3d', 'center'); ctx.globalAlpha = 0.25; txt(ctx, "CHARLIE'S", x + 300, 96, 28, '#ff9a8d', 'center'); ctx.globalAlpha = 1; });
};
BG.gastro = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#12101a', '#2a2030');
  par(cx, 0.2, 440, (x, i) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x + 40, 60, 140, 300); ctx.clip(); vgrad(ctx, 60, 360, '#0b1330', '#3a2f5a'); circ(ctx, x + 140, 120, 14, '#f2eac8');
    for (let k = 0; k < 7; k++) { const bh = 40 + hash(i * 9 + k) * 90; rect(ctx, x + 40 + k * 20, 360 - bh, 18, bh, '#171a30'); for (let r = 0; r < bh / 14; r++) if (hash(k * 7 + r + i) > 0.5) rect(ctx, x + 45 + k * 20, 366 - bh + r * 14, 4, 5, '#ffd98a'); }
    ctx.restore(); ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 6; ctx.strokeRect(x + 40, 60, 140, 300);
  });
  par(cx, 0.45, 440, (x) => { rect(ctx, x + 230, 40, 5, 330, 'rgba(201,162,74,.5)'); rect(ctx, x + 400, 40, 5, 330, 'rgba(201,162,74,.5)'); rr(ctx, x + 246, 140, 140, 100, 4, '#2c2438', '#c9a24a', 5); circ(ctx, x + 316, 190, 26, '#b3405a'); circ(ctx, x + 340, 170, 18, '#e8b04a'); });
  par(cx, 0.3, 500, (x, i) => { const fl = Math.sin(t * 7 + i) * 0.1; line(ctx, x + 250, 0, x + 250, 60, '#c9a24a', 2); ell(ctx, x + 250, 70, 56, 12, '#c9a24a'); ell(ctx, x + 250, 66, 50, 8, '#e2c06a');
    for (let k = -2; k <= 2; k++) { const px = x + 250 + k * 22; line(ctx, px, 74, px, 90 + Math.abs(k) * 2, 'rgba(255,255,255,.55)', 2); circ(ctx, px, 62, 3, '#ffd98a'); ctx.globalAlpha = 0.25 + fl; circ(ctx, px, 60, 9, '#ffd98a'); ctx.globalAlpha = 1; } });
  par(cx, 0.8, 480, (x) => { rect(ctx, x + 0, 0, 36, 400, '#6a1e2e'); for (let k = 0; k < 4; k++) rect(ctx, x + 6 + k * 8, 0, 3, 400, 'rgba(0,0,0,.25)'); });
  par(cx, 0.6, 270, (x) => { drawProp(ctx, { kind: 'table', x: x + 135, y: FLOOR_Y - 4, color: '#f7f4ec', candle: true, plates: [-24, 24] }, t); ell(ctx, x + 135 + 24, FLOOR_Y - 46, 9, 5, '#d8d8d8'); circ(ctx, x + 135 + 24, FLOOR_Y - 50, 7, 'rgba(220,220,220,.9)'); });
};
BG.bar = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#150a28', '#2f1655');
  // faisceaux lumineux
  ctx.globalAlpha = 0.09;
  for (let k = 0; k < 4; k++) { const a = Math.sin(t * 0.9 + k * 1.7) * 0.5, bx = 120 + k * 230; poly(ctx, [[bx, 0], [bx + 40, 0], [bx + 40 + Math.sin(a) * 260 + 60, 470], [bx - 80 + Math.sin(a) * 260, 470]], ['#ff4fa3', '#4fd2ff', '#ffd23f', '#9b6bff'][k]); }
  ctx.globalAlpha = 1;
  par(cx, 0.1, 960, (x) => { // boule à facettes
    line(ctx, x + 480, 0, x + 480, 70, '#aaa', 2); circ(ctx, x + 480, 100, 32, '#c9cfe0');
    for (let a = 0; a < 20; a++) { const an = a * 0.63 + t * 1.5, rx = Math.cos(an) * 30; if (Math.sin(an) > -0.2) rect(ctx, x + 480 + rx - 3, 78 + (a % 5) * 11, 6, 6, a % 3 ? '#fff' : '#8fb4ff'); }
    for (let a = 0; a < 14; a++) { const an = a * 1.9 + t * 0.8; ctx.globalAlpha = 0.5; circ(ctx, x + 480 + Math.cos(an) * 380, 200 + Math.sin(an * 1.3) * 120, 6, ['#ff4fa3', '#4fd2ff', '#ffd23f'][a % 3]); ctx.globalAlpha = 1; }
  });
  par(cx, 0.35, 120, (x, i) => { const colors = ['#ff4fa3', '#4fd2ff', '#ffd23f', '#9b6bff', '#5de27a']; poly(ctx, [[x, 0], [x + 36, 0], [x + 18, 40 + (i % 2) * 8]], colors[mod(i, 5)]); });
  par(cx, 0.4, 1100, (x) => { ctx.globalAlpha = 0.85; txt(ctx, 'BAR', x + 120, 150, 44, '#ff4fa3', 'center'); ctx.globalAlpha = 0.3; txt(ctx, 'BAR', x + 120, 150, 44, '#fff', 'center'); ctx.globalAlpha = 1; });
  par(cx, 0.5, 380, (x) => { rect(ctx, x + 40, 290, 300, 6, '#6b4a2a'); rect(ctx, x + 40, 220, 300, 6, '#6b4a2a'); const cols = ['#4fd2ff', '#5de27a', '#ffd23f', '#ff4fa3', '#b98cff'];
    for (let k = 0; k < 9; k++) { rr(ctx, x + 52 + k * 31, 250, 12, 40, 4, cols[k % 5]); rect(ctx, x + 56 + k * 31, 238, 4, 14, cols[k % 5]); rr(ctx, x + 50 + k * 31, 180, 12, 40, 4, cols[(k + 2) % 5]); rect(ctx, x + 54 + k * 31, 168, 4, 14, cols[(k + 2) % 5]); } });
  par(cx, 0.7, 520, (x) => { drawProp(ctx, { kind: 'counter', x: x + 130, y: FLOOR_Y - 4 }, t); for (const dx of [0, 200]) drawProp(ctx, { kind: 'stool', x: x + 270 + dx, y: FLOOR_Y - 4 }, t); });
};
function drawBackground(ctx, name, cx, cy, t) { (BG[name] || BG.openspace)(ctx, cx || 0, t || 0); }
