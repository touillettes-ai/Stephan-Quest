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
function limbO(ctx, x, y, ang, len, w, c) { limb(ctx, x, y, ang, len, w + 1.8, shade(c, -0.55)); limb(ctx, x, y, ang, len, w, c); }
function stripeLimb(ctx, x, y, ang, len, w, c) {       // bandes perpendiculaires sur une manche
  if (!ctx.setLineDash) return;
  ctx.save(); ctx.setLineDash([2.4, 2.4]); ctx.lineCap = 'butt'; ctx.strokeStyle = c; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ang) * len, y + Math.cos(ang) * len); ctx.stroke(); ctx.restore();
}
function hand(ctx, x, y, skin) { circ(ctx, x, y, 3.9, shade(skin, -0.5)); circ(ctx, x, y, 3.1, skin); }
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
const HEAD_SCALE = 1.35;   // grosseur de la tête (style « chibi ») : 1 = ancien dessin
const CHAR_SCALE = 1.2;   // taille d'affichage globale des personnages
function drawCharacter(ctx, ch, x, y, a) {
  a = a || {};
  const f = a.facing || 1, st = a.state || 'idle', t = a.t || 0, sc = (ch.scale || 1) * CHAR_SCALE;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (!a.noShadow) ell(ctx, 0, 0, 13 * sc, 3.5 * sc, 'rgba(0,0,0,.18)');
  // squash & stretch (a.squash : < 1 écrasé, > 1 étiré) + petits mouvements « mignons » au repos, en marchant, en dansant
  let sq = a.squash === undefined ? 1 : a.squash;
  if (a.squash === undefined) { if (st === 'idle') sq = 1 + Math.sin(t * 2.2) * 0.012; else if (st === 'walk') sq = 1 + (Math.abs(Math.sin(t * 11)) - 0.5) * 0.05; else if (st === 'sit') sq = 1 + Math.sin(t * 1.6) * 0.01; }
  ctx.scale(f * sc / Math.sqrt(sq), sc * sq);
  if (st === 'cheer') ctx.rotate(Math.sin(t * 7) * 0.05);
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
  const hipY = -17 + low;                    // jambes raccourcies (corps plus petit, tête plus grosse)

  // jambes
  if (sit) {
    limbO(ctx, -1, hipY, 1.45, 14, 7, shade(bot, -0.2)); limbO(ctx, 13, hipY + 1.6, 0, 5, 7, shade(bot, -0.2));
    limbO(ctx, 1, hipY, 1.45, 14, 7, bot);               limbO(ctx, 15, hipY + 1.6, 0, 5, 7, bot);
    rr(ctx, 13, -3, 10, 5, 2.5, shoe, shade(shoe, 0.35), 0.8); rect(ctx, 14, 1.2, 8, 1.2, '#e8e8e8');
  } else {
    limbO(ctx, -2.5, hipY, lR, 17, 7, shade(bot, -0.2));
    if (ch.socks) limbO(ctx, -2.5 + Math.sin(lR) * 9, hipY + Math.cos(lR) * 9, lR, 8, 7, shade(ch.socks, -0.2));
    rr(ctx, -2.5 + Math.sin(lR) * 17 - 3, hipY + Math.cos(lR) * 17 - 3, 10, 6, 3, shade(shoe, -0.1), shade(shoe, 0.35), 0.8);
    limbO(ctx, 2.5, hipY, lL, 17, 7, bot);
    if (ch.socks) limbO(ctx, 2.5 + Math.sin(lL) * 9, hipY + Math.cos(lL) * 9, lL, 8, 7, ch.socks);
    rr(ctx, 2.5 + Math.sin(lL) * 17 - 3, hipY + Math.cos(lL) * 17 - 3, 10, 6, 3, shoe, shade(shoe, 0.35), 0.8);
    rect(ctx, 2.5 + Math.sin(lL) * 17 - 2, hipY + Math.cos(lL) * 17 + 1.6, 8, 1.2, '#e8e8e8');
  }

  ctx.translate(0, 4);                       // torse, bras et tête
  // bras arrière + torse
  const shY = -39 + low + bob;
  limbO(ctx, -1, shY, aL, 17, 5.5, shade(top, -0.25));
  if (ch.stripes) stripeLimb(ctx, -1, shY, aL, 17, 5.5, ch.stripes);
  hand(ctx, -1 + Math.sin(aL) * 17, shY + Math.cos(aL) * 17, shade(skin, -0.1));
  rr(ctx, -9, -43 + low + bob, 18, 24, 6, top, shade(top, -0.55), 1.2);
  rr(ctx, -7, -41 + low + bob, 3.5, 17, 1.7, shade(top, 0.16));
  if (ch.stripes) { ctx.save(); rr(ctx, -9, -43 + low + bob, 18, 24, 6); ctx.clip(); for (let yy = -43; yy < -19; yy += 5) rect(ctx, -9, yy + low + bob, 18, 2.6, ch.stripes); ctx.restore(); }
  rect(ctx, -9, -21.5 + low + bob, 18, 2.6, shade(bot, -0.3));
  if (ch.spots) for (const [sx, sy] of [[-5, -38], [2, -40], [-2, -33], [5, -35], [-6, -28], [1, -27], [5, -24]]) { circ(ctx, sx, sy + low + bob, 1.7, ch.spots); circ(ctx, sx, sy + low + bob, 0.7, shade(top, 0.1)); }
  if (ch.pocket) { rect(ctx, 2, -37 + low + bob, 5, 5, shade(top, -0.12)); line(ctx, 3.5, -37 + low + bob, 3.5, -40 + low + bob, '#2f7fd1', 1); }
  if (!ch.vest && !ch.tie && !ch.pocket) for (let i = 0; i < 3; i++) circ(ctx, 4, -37 + i * 5.5 + low + bob, 0.9, shade(top, -0.35));
  if (ch.vest) { rr(ctx, -9, -43 + low + bob, 18, 24, 6, ch.vest); rect(ctx, -9, -31 + low + bob, 18, 3, '#e9e9e9'); }
  if (ch.tie) poly(ctx, [[-1.5, -42 + low + bob], [3.5, -42 + low + bob], [4.5, -29 + low + bob], [1, -26 + low + bob], [-2.5, -29 + low + bob]], ch.tie);
  if (ch.collar) poly(ctx, [[-4, -43 + low + bob], [5, -43 + low + bob], [1, -38 + low + bob]], ch.collar);
  if (ch.badge) {
    const q = low + bob;
    line(ctx, -3.5, -43 + q, 1, -29 + q, ch.badge, 1.1); line(ctx, 5, -43 + q, 1, -29 + q, ch.badge, 1.1);
    rr(ctx, -2, -29 + q, 6, 7.5, 1, '#fff', ch.badge, 1); rect(ctx, -1, -27.5 + q, 4, 1.4, ch.badge); rect(ctx, -1, -25 + q, 3, 1, '#9aa'); }
  // bras avant
  limbO(ctx, 1, shY, aR, 17, 5.5, top);
  if (ch.stripes) stripeLimb(ctx, 1, shY, aR, 17, 5.5, ch.stripes);
  hand(ctx, 1 + Math.sin(aR) * 17, shY + Math.cos(aR) * 17, skin);

  // tête (grosse tête, ancrée sur les épaules)
  const hx = 1, hy = -53 + low + bob, hc = ch.hair || '#333', hs = ch.hairStyle || 'short';
  let hr = 0, hdy = 0;                        // la tête suit le corps avec un léger retard : balancement, hochement, rebond
  switch (st) {
    case 'idle': hr = Math.sin(t * 1.7) * 0.04; hdy = Math.sin(t * 2.2 - 0.6) * 0.5; break;
    case 'walk': hr = Math.sin(t * 11 - 0.9) * 0.07 - 0.02; hdy = Math.sin(t * 22 - 0.8) * 0.7; break;
    case 'jump': hr = -0.1; break;
    case 'fall': hr = 0.1; hdy = -1; break;
    case 'cheer': hr = Math.sin(t * 7) * 0.1; break;
    case 'wave': hr = Math.sin(t * 5) * 0.06; break;
    case 'sit': hr = Math.sin(t * 1.3) * 0.035; break;
    case 'hurt': hr = Math.sin(t * 30) * 0.08; break;
  }
  if (a.talking) hr += Math.sin(t * 9) * 0.035;
  ctx.save(); ctx.translate(hx, hy + 11 + hdy); ctx.rotate(hr); ctx.scale(HEAD_SCALE, HEAD_SCALE); ctx.translate(-hx, -(hy + 11));
  if (hs === 'long') rr(ctx, hx - 13, hy - 6, 10, 26, 5, hc);
  if (hs === 'bun') circ(ctx, hx - 8, hy - 12, 5.5, hc);
  rect(ctx, hx - 3, hy + 6, 7, 8, shade(skin, -0.14));
  circ(ctx, hx, hy, 10.7, shade(skin, -0.5));
  circ(ctx, hx, hy, 10, skin);
  circ(ctx, hx - 9.5, hy + 1, 2.6, shade(skin, -0.08));
  ctx.fillStyle = hc;
  const cap = ch.cap || '#c0392b';
  switch (hs) {
    case 'bald':  rr(ctx, hx - 10.8, hy - 3, 4, 6.5, 2, hc); break;
    case 'short': case 'long': case 'bun':
      ctx.beginPath(); ctx.arc(hx, hy - 2.5, 10.8, Math.PI, 6.2832); ctx.closePath(); ctx.fill();
      rr(ctx, hx - 10.8, hy - 2.5, 4.5, 9, 2.2, hc); break;
    case 'curly':
      ctx.beginPath(); ctx.arc(hx, hy - 2.5, 10.8, Math.PI, 6.2832); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 6; i++) circ(ctx, hx - 9 + i * 3.6, hy - 11 + Math.sin(i * 1.7) * 1.5, 4.2, hc);
      rr(ctx, hx - 10.8, hy - 2.5, 4.5, 9, 2.2, hc); break;
    case 'cap':
      ctx.beginPath(); ctx.arc(hx, hy - 2.5, 11, Math.PI, 6.2832); ctx.closePath(); ctx.fillStyle = cap; ctx.fill();
      rr(ctx, hx + 2, hy - 6, 13, 4, 2, shade(cap, -0.2));
      rr(ctx, hx - 10.8, hy - 2.5, 4, 6, 2, hc); break;
    case 'cowboy':
      ctx.beginPath(); ctx.arc(hx, hy - 2.5, 10.8, Math.PI, 6.2832); ctx.closePath(); ctx.fill(); rr(ctx, hx - 10.8, hy - 2.5, 4.5, 9, 2.2, hc);
      rr(ctx, hx - 16, hy - 9, 32, 3.8, 1.9, '#8a5a2b', '#4a2e12', 1); rr(ctx, hx - 8.5, hy - 20, 17, 12.5, 5, '#a8702f', '#4a2e12', 1); rect(ctx, hx - 8.5, hy - 12.5, 17, 2.4, '#4a2e12'); break;
    case 'helmet':
      ctx.beginPath(); ctx.arc(hx, hy - 2, 11.6, Math.PI, 6.2832); ctx.closePath(); ctx.fillStyle = '#f4c20d'; ctx.fill();
      rr(ctx, hx - 12.5, hy - 3.5, 25, 3.5, 1.5, '#d9a800');
      rect(ctx, hx - 1, hy - 13, 2.5, 9, '#d9a800'); break;
  }
  if (ch.bunny) {
    for (const [dx, rot] of [[-5, -0.2], [2, 0.25]]) { ctx.save(); ctx.translate(hx + dx, hy - 8); ctx.rotate(rot); rr(ctx, -3.4, -22, 6.8, 22, 3.4, ch.bunny, shade(ch.bunny, -0.5), 1); rr(ctx, -1.6, -19, 3.2, 15, 1.6, '#f4a6b8'); ctx.restore(); }
    circ(ctx, -11, -26 + low + bob, 5.5, shade(ch.bunny, -0.5)); circ(ctx, -11, -26 + low + bob, 4.7, ch.bunny);
  }
  if (ch.headset) {
    ctx.strokeStyle = '#2a2d36'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx - 1, hy - 1, 10.8, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    circ(ctx, hx - 9.5, hy + 1.5, 3.6, '#2a2d36'); circ(ctx, hx - 9.5, hy + 1.5, 1.6, '#e0453a');
    line(ctx, hx - 9.5, hy + 5, hx + 2, hy + 9, '#2a2d36', 1.4); circ(ctx, hx + 3, hy + 9, 1.8, '#2a2d36');
  }
  if (hs !== 'bald' && hs !== 'helmet' && hs !== 'cap' && hs !== 'cowboy') {
    ctx.strokeStyle = shade(hc, -0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx, hy - 2.5, 10.8, Math.PI, 6.2832); ctx.stroke();
    ctx.strokeStyle = shade(hc, 0.3); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(hx, hy - 2.5, 8, Math.PI + 0.5, 6.2832 - 1.5); ctx.stroke();
  }
  // visage : grands yeux, humeur (a.mood : happy | laugh | surprised | angry | sad), joues rondes
  const mood = a.mood || (st === 'hurt' ? 'surprised' : st === 'cheer' ? 'laugh' : 'happy');
  const blink = (t % 4) < 0.12 || mood === 'laugh';
  const ex1 = hx + 3.2, ex2 = hx + 8.6, ey = hy + 1.0;
  circ(ctx, hx + 10.2, hy + 3.4, 1.3, shade(skin, -0.08));
  if (ch.bunny) circ(ctx, hx + 10.5, hy + 3.4, 1.9, '#f4a6b8');
  for (const ex of [ex1, ex2]) {
    if (blink) { ctx.strokeStyle = '#222'; ctx.lineWidth = 1.3; ctx.beginPath(); if (mood === 'laugh') ctx.arc(ex, ey + 1.4, 2.1, Math.PI * 1.1, Math.PI * 1.9); else { ctx.moveTo(ex - 2, ey); ctx.lineTo(ex + 2, ey); } ctx.stroke(); }
    else {
      const big = mood === 'surprised' ? 1.12 : 1;
      ell(ctx, ex, ey, 2.5 * big, 3.1 * big, '#fff'); circ(ctx, ex + 0.7, ey + 0.3, (mood === 'surprised' ? 1.6 : 2.0), '#1a1a1a');
      circ(ctx, ex + 1.5, ey - 0.8, 0.85, '#fff'); circ(ctx, ex - 0.3, ey + 1.3, 0.45, '#fff');
    }
  }
  const bc = shade(hc, -0.15);
  if (mood === 'angry') { line(ctx, ex1 - 2.4, ey - 5.8, ex1 + 2.2, ey - 3.9, bc, 1.5); line(ctx, ex2 - 2.2, ey - 3.9, ex2 + 2.6, ey - 5.8, bc, 1.5); }
  else if (mood === 'sad') { line(ctx, ex1 - 2.4, ey - 3.9, ex1 + 2.2, ey - 5.6, bc, 1.4); line(ctx, ex2 - 2.2, ey - 5.6, ex2 + 2.6, ey - 3.9, bc, 1.4); }
  else { const up = mood === 'surprised' ? -1.8 : 0; line(ctx, ex1 - 2.4, ey - 5.2 + up, ex1 + 2.2, ey - 5.5 + up, bc, 1.4); line(ctx, ex2 - 2.2, ey - 5.5 + up, ex2 + 2.6, ey - 5.2 + up, bc, 1.4); }
  if (ch.lashes && !blink) for (const ex of [ex1, ex2]) line(ctx, ex + 2, ey - 2.5, ex + 3.4, ey - 3.5, '#1a1a1a', 0.9);
  if (ch.earring) { if (ch.hoop) { ctx.strokeStyle = ch.earring; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(hx - 9.5, hy + 6.5, 2.8, 0, 6.2832); ctx.stroke(); } else circ(ctx, hx - 9.5, hy + 4.6, 1.6, ch.earring); }
  if (!ch.beard) ell(ctx, hx + 6.8, hy + 5.8, 2.9, 1.8, 'rgba(255,110,125,.36)');
  if (ch.glasses) {
    const gc = ch.glassColor || '#1a1a1a';
    if (ch.glassShape === 'rect') {
      for (const ex of [ex1, ex2 + 0.6]) rr(ctx, ex - 3.7, ey - 3.2, 7.4, 6.4, 1.8, 'rgba(255,255,255,.25)', gc, 1.5);
      line(ctx, ex1 + 3.7, ey - 1, ex2 - 3.1, ey - 1, gc, 1.3); line(ctx, ex1 - 3.7, ey - 1, hx - 9, ey - 1.5, gc, 1.3);
    } else {
      for (const ex of [ex1, ex2 + 0.6]) { circ(ctx, ex, ey, 3.6, 'rgba(255,255,255,.22)'); ctx.strokeStyle = gc; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(ex, ey, 3.6, 0, 6.2832); ctx.stroke(); }
      line(ctx, ex1 + 3.6, ey, ex2 - 3, ey, gc, 1.3);
      line(ctx, ex1 - 3.6, ey, hx - 9, ey - 0.5, gc, 1.3);
    }
  }
  if (ch.beard) {                                // barbe arrondie avec pattes
    ctx.beginPath(); ctx.moveTo(hx - 9.8, hy + 0.5); ctx.quadraticCurveTo(hx - 11, hy + 12.5, hx, hy + 12.8); ctx.quadraticCurveTo(hx + 11, hy + 12.5, hx + 9.8, hy + 3.8);
    ctx.quadraticCurveTo(hx + 6, hy + 5.6, hx + 2.5, hy + 4.6); ctx.quadraticCurveTo(hx - 4, hy + 5.2, hx - 9.8, hy + 0.5); ctx.closePath(); ctx.fillStyle = hc; ctx.fill();
    ctx.strokeStyle = shade(hc, 0.25); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hx - 5, hy + 9); ctx.quadraticCurveTo(hx, hy + 11, hx + 5, hy + 9.2); ctx.stroke();
  }
  if (ch.mustache) rr(ctx, hx + 2.5, hy + 4.8, 8, 2.8, 1.3, hc);
  const mx = hx + 6.6, my = hy + 6.2;
  if (a.talking) ell(ctx, mx, my + 1.2, 2.3, 1.2 + Math.abs(Math.sin(t * 14)) * 1.9, '#7a2b2b');
  else if (mood === 'laugh') { ctx.beginPath(); ctx.arc(mx, my - 0.6, 3.1, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#7a2b2b'; ctx.fill(); ell(ctx, mx, my + 1.7, 1.7, 0.9, '#e8707a'); }
  else if (mood === 'surprised') ell(ctx, mx, my + 1, 1.8, 2.4, '#7a2b2b');
  else if (!ch.beard || mood === 'angry' || mood === 'sad') {
    ctx.strokeStyle = ch.lips || '#8a4040'; ctx.lineWidth = ch.lips ? 1.5 : 1.2; ctx.beginPath();
    if (mood === 'angry') { ctx.moveTo(mx - 2, my + 1.4); ctx.lineTo(mx + 2.2, my + 0.6); }
    else if (mood === 'sad') ctx.arc(mx, my + 2.6, 2.4, Math.PI + 0.3, 6.2832 - 0.3);
    else ctx.arc(mx, my - 1.4, 2.8, 0.25, Math.PI - 0.25);
    ctx.stroke();
  }
  ctx.restore();   // fin du bloc tête
  ctx.restore();

  if (a.emote) {
    const ex = x, ey = y - 87 * sc + Math.sin((a.t || 0) * 4) * 2;
    const word = String(a.emote).length > 2, bw = word ? 4.2 * String(a.emote).length + 7 : 32;
    rr(ctx, ex - bw / 2, ey - 22, bw, 24, 9, '#fff', '#333', 1.5);
    poly(ctx, [[ex - 4, ey + 1], [ex + 4, ey + 1], [ex, ey + 8]], '#fff');
    txt(ctx, a.emote, ex, word ? ey - 6 : ey - 4, word ? 8.5 : 16, '#222', 'center');
  }
}

/* Buste pour la boîte de dialogue */
function drawPortrait(ctx, ch, x, y, w, h, t, talking, mood) {
  ctx.save();
  rr(ctx, x, y, w, h, 12, '#2d3a63');
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const sc = (ch.scale || 1) * CHAR_SCALE, s = h / 38 / sc;      // tête toujours à la même taille dans le cadre
  ctx.translate(x + w / 2 - 3, y + h * 0.62);
  ctx.scale(s, s);
  drawCharacter(ctx, ch, 0, 49 * sc, { state: 'idle', t: t, talking: talking, noShadow: true, mood: mood });
  ctx.restore();
  rr(ctx, x, y, w, h, 12, null, '#8fa6ff', 2);
}

/* ============================================================
   OBJETS À RAMASSER   (centrés sur x,y)
   ============================================================ */
function drawItem(ctx, kind, x, y, s, t, v) {
  s = s || 1; v = v || 1; t = t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (String(kind).startsWith('npc:')) { drawCharacter(ctx, CHARS[kind.slice(4)], 0, 16, { facing: -1, state: 'idle', t: t }); ctx.restore(); return; }
  switch (kind) {
    case 'tapas':
      ell(ctx, 0, 6, 15, 5.5, '#f5f5f5'); ell(ctx, 0, 5, 11, 3.5, '#ddd'); circ(ctx, -7, 0, 4.6, '#4f8a3a'); circ(ctx, -7, 0, 1.8, '#d6402f'); rr(ctx, -1, -5, 8, 8, 2, '#f2c94c'); circ(ctx, 6, 0, 3.6, '#e8878f');
      line(ctx, -9, -9, 8, 1, '#8d6e3f', 1.4); break;
    case 'ticketbl':
      ctx.rotate(-0.14); rr(ctx, -14, -10, 28, 20, 3, '#fffdf4', '#3a4b5f', 1.5); rect(ctx, -14, -10, 6, 20, '#e0a030');
      line(ctx, -4, -4, 10, -4, '#7a8aa0', 1.6); line(ctx, -4, 1, 7, 1, '#7a8aa0', 1.6); circ(ctx, 9, 6, 2.2, '#d6402f'); break;
    case 'ballon':
      circ(ctx, 0, 0, 11, '#f4f4f4'); ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 6.2832); ctx.stroke();
      poly(ctx, [[0, -5], [4.8, -1.5], [3, 4], [-3, 4], [-4.8, -1.5]], '#2a2a2a'); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; line(ctx, Math.cos(a) * 5, Math.sin(a) * 5, Math.cos(a) * 10, Math.sin(a) * 10, '#333', 1.1); } break;
    case 'carotte':
      ctx.rotate(-0.6); poly(ctx, [[-5, -10], [5, -10], [0, 15]], '#f08a1e'); for (let i = 0; i < 3; i++) line(ctx, -3 + i, -5 + i * 5, 3 - i, -5 + i * 5, '#c2620e', 1.2);
      for (const a of [-0.5, 0, 0.5]) { ctx.save(); ctx.translate(0, -10); ctx.rotate(a); ell(ctx, 0, -6, 2.6, 6.5, '#4fa84a'); ctx.restore(); } break;
    case 'chocolat':
      ell(ctx, 0, 0, 9.5, 12.5, (v || 1) % 2 ? '#7a4a2a' : '#c0392b'); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = -8; i <= 8; i += 4) ctx.lineTo(i, ((i / 4) & 1 ? -2.5 : 2.5)); ctx.stroke(); ell(ctx, -3.5, -6, 2.2, 3.4, 'rgba(255,255,255,.55)'); break;
    case 'papier':
      ctx.rotate(-0.12); rr(ctx, -9, -12, 18, 24, 2, '#fff', '#8a8f99', 1.2); poly(ctx, [[3, -12], [9, -12], [9, -6]], '#d0d4dc');
      for (let i = 0; i < 4; i++) line(ctx, -5, -6 + i * 4.5, 5, -6 + i * 4.5, '#9aa3b2', 1.2);
      circ(ctx, 3, 6, 4, 'rgba(220,40,40,.85)'); break;
    case 'malette':
      rr(ctx, -5, -15, 10, 7, 3, null, '#333', 2.2); rr(ctx, -15, -9, 30, 22, 4, '#c0392b', '#7a1f16', 1.5);
      rect(ctx, -15, 0, 30, 2.2, '#7a1f16'); rr(ctx, -4, -2.5, 8, 6, 1.5, '#ffd23f'); rect(ctx, -1, -9, 2, 6, '#fff'); rect(ctx, -4, -6, 8, 2, '#fff'); break;
    case 'bureau':
      rr(ctx, -22, 0, 44, 5, 2, '#c9a46a'); rect(ctx, -19, 5, 4, 11, '#8d6e3f'); rect(ctx, 15, 5, 4, 11, '#8d6e3f');
      rr(ctx, -16, -15, 20, 15, 2, '#222'); rr(ctx, -14, -13, 16, 11, 1, '#7cc0ff'); txt(ctx, 'B', -6, -4, 9, '#fff', 'center');
      rr(ctx, 8, -8, 10, 8, 2, '#3a4b5f'); rect(ctx, 11, 0, 4, 3, '#666'); break;
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
    case 'slip':
      poly(ctx, [[-12, -8], [12, -8], [12, -1], [5, 10], [-5, 10], [-12, -1]], '#d64045'); rect(ctx, -12, -8, 24, 4, '#fff');
      for (let i = -6; i <= 6; i += 6) line(ctx, i, -3, i, 6, '#fff', 1.3); break;
    case 'tshirt':
      poly(ctx, [[-6, -11], [6, -11], [15, -4], [11, 2], [8, -1], [8, 11], [-8, 11], [-8, -1], [-11, 2], [-15, -4]], '#3aa5d6'); rect(ctx, -6, -11, 12, 2.5, '#2a7fa6');
      txt(ctx, 'GTAR', 0, 6, 6, '#fff', 'center'); break;
    case 'pantalon':
      poly(ctx, [[-9, -12], [9, -12], [11, 12], [2.5, 12], [0, 0], [-2.5, 12], [-11, 12]], '#3a4660'); rect(ctx, -9, -12, 18, 3, '#222');
      line(ctx, 0, 0, 0, -9, '#2a3348', 1.2); break;
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
const ITEM_KINDS = ['tapas', 'ticketbl', 'ballon', 'carotte', 'chocolat', 'papier', 'malette', 'bureau', 'maki', 'sushi', 'brochette', 'logi', 'ticket', 'slip', 'tshirt', 'pantalon', 'entrecote', 'frites', 'biere', 'cadeau', 'plat', 'cafe', 'courrier', 'star'];

/* ============================================================
   ENNEMIS / OBSTACLES   (pieds en y, centrés sur x)
   ============================================================ */
const WAITER = { name: 'Serveur', skin: '#e8b88a', hair: '#222', hairStyle: 'short', top: '#f4f4f4', bottom: '#1b1b1b', tie: '#111' };
const HAZARDS = {
  chair:  { w: 30, h: 36, speed: 55, fly: false, label: 'Chaise de bureau' },
  valise: { w: 32, h: 28, speed: 70, fly: false, label: 'Valise' },
  waiter: { w: 22, h: 52, speed: 50, fly: false, label: 'Serveur pressé' },
  mail:   { w: 30, h: 22, speed: 60, fly: true,  label: 'Mail urgent' },
  bug:    { w: 30, h: 22, speed: 62, fly: false, label: 'Bug' },
  virus:  { w: 28, h: 28, speed: 60, fly: true,  label: 'Virus' },
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
    case 'bug': {
      const lg = Math.sin(t * 14) * 3;
      for (const dx of [-9, 0, 9]) { line(ctx, dx, -8, dx - 4 + lg, -1, '#222', 2); line(ctx, dx, -8, dx + 4 - lg, -1, '#222', 2); }
      ell(ctx, 0, -12, 15, 10, '#d6402f'); line(ctx, 0, -22, 0, -2, '#222', 1.5);
      for (const [bx, by] of [[-7, -14], [6, -14], [-5, -8], [8, -9]]) circ(ctx, bx, by, 2.2, '#222');
      circ(ctx, dir * 14, -11, 6.5, '#222'); eyes(ctx, dir * 14, -12, dir, 2.4); break; }
    case 'virus': {
      const pul = 1 + Math.sin(t * 8) * 0.07;
      for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 + t; line(ctx, Math.cos(an) * 10 * pul, -14 + Math.sin(an) * 10 * pul, Math.cos(an) * 16 * pul, -14 + Math.sin(an) * 16 * pul, '#1f5a2b', 3); circ(ctx, Math.cos(an) * 16 * pul, -14 + Math.sin(an) * 16 * pul, 2.4, '#e03a3a'); }
      circ(ctx, 0, -14, 11 * pul, '#2d7a3a'); circ(ctx, 0, -14, 11 * pul, 'rgba(0,0,0,0)');
      circ(ctx, -4, -16, 3, '#ffeaea'); circ(ctx, 4, -16, 3, '#ffeaea'); circ(ctx, -4 + dir, -16, 1.5, '#a80000'); circ(ctx, 4 + dir, -16, 1.5, '#a80000');
      rect(ctx, -5, -9, 10, 2.5, '#111'); for (let i = -3; i <= 3; i += 3) rect(ctx, i - 0.5, -9, 1, 2.5, '#fff'); break; }
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
function drawArrow(ctx, x, y, lane, fill, size, ring) {          // lane : 0 gauche · 1 bas · 2 haut · 3 droite
  const a = [Math.PI, Math.PI / 2, -Math.PI / 2, 0][lane], s = size || 26;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  const pts = [[s, 0], [0, -s], [0, -s * 0.45], [-s, -s * 0.45], [-s, s * 0.45], [0, s * 0.45], [0, s]];
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = ring || '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
}
function drawBroom(ctx, x, y, ang, len) {                 // manche du balai depuis (x,y) dans la direction ang
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
  line(ctx, x, y, ex, ey, '#8d6e3f', 3.6);
  ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang);
  poly(ctx, [[-2, -3.5], [20, -12], [20, 12], [-2, 3.5]], '#e8c44a'); for (let i = -2; i <= 2; i++) line(ctx, 2, i * 2, 20, i * 4.6, '#b58a1c', 1); rect(ctx, -3, -4, 5, 8, '#555');
  ctx.restore();
}
function drawTicketHDR(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.22 - i * 0.05; rr(ctx, 14 + i * 12, -9, 16, 18, 3, '#ff6a4a'); } ctx.globalAlpha = 1;
  ctx.rotate(Math.sin(t * 9) * 0.12); rr(ctx, -22, -14, 44, 28, 4, '#d6402f', '#fff', 2); rect(ctx, -22, -14, 7, 28, '#8a1f14');
  txt(ctx, 'HDR', 4, 6, 14, '#fff', 'center'); ctx.restore();
}
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
    case 'cheval': {
      ctx.save(); if (p.face === -1) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
      for (const dx of [-30, -16, 14, 28]) rr(ctx, x + dx - 5, y - 26, 10, 26, 5, '#f4e3ef', '#c79ab8', 1.5);
      rr(ctx, x - 42, y - 56, 84, 36, 18, '#fbeaf5', '#c79ab8', 2); rr(ctx, x + 24, y - 90, 20, 46, 10, '#fbeaf5', '#c79ab8', 2);
      ell(ctx, x + 40, y - 88, 18, 11, '#fbeaf5'); ctx.strokeStyle = '#c79ab8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + 40, y - 88, 18, 11, 0, 0, 6.2832); ctx.stroke();
      circ(ctx, x + 36, y - 92, 2.4, '#222'); circ(ctx, x + 50, y - 86, 1.6, '#c79ab8'); poly(ctx, [[x + 28, y - 98], [x + 33, y - 108], [x + 38, y - 98]], '#fbeaf5');
      for (let i = 0; i < 4; i++) rr(ctx, x + 20 - i * 3, y - 96 + i * 9, 6, 10, 3, '#f2c94c');
      rr(ctx, x - 30, y - 60, 10, 5, 2, '#7ad0ff'); ctx.restore(); break; }
    case 'ecran':
      rr(ctx, x - 70, y - 150, 140, 104, 8, '#1d2230', '#8fa6ff', 4); ctx.globalAlpha = 0.65 + 0.15 * Math.sin(t * 5); rr(ctx, x - 62, y - 142, 124, 88, 4, '#0b6a52'); ctx.globalAlpha = 1;
      for (let i = 0; i < 6; i++) line(ctx, x - 52, y - 130 + i * 13, x - 52 + 30 + hash(i * 7) * 70, y - 130 + i * 13, '#8dffd0', 3); rect(ctx, x - 8, y - 46, 16, 16, '#444'); rr(ctx, x - 34, y - 32, 68, 8, 3, '#555'); break;
    case 'balai':
      drawBroom(ctx, x, y - 70, 1.45, 62); break;
    case 'tascarottes': {
      for (let i = 0; i < 26; i++) { const row = Math.floor(i / 6), col = i % 6, w = 6 - row; const dx = (col - (w - 1) / 2) * 11 + (hash(i * 3) - 0.5) * 8, dy = row * 14 + (hash(i * 7) - 0.5) * 4; if (col < w) drawItem(ctx, 'carotte', x + dx, y - 12 - dy, 1.25, t, i); }
      break; }
    case 'scene':
      rr(ctx, x - p.w / 2, y - 30, p.w, 30, 4, '#3a2a22'); rect(ctx, x - p.w / 2, y - 30, p.w, 6, '#8a6a4a'); for (let i = 0; i < p.w / 60; i++) rect(ctx, x - p.w / 2 + 12 + i * 60, y - 22, 36, 3, 'rgba(255,255,255,.12)'); break;
    case 'foule':
      for (let r = 0; r < 3; r++) for (let i = -1; i < 24; i++) {
        const hx = i * 42 + (r % 2) * 21 + hash(r * 50 + i) * 8, hy = 518 + r * 14 + Math.abs(Math.sin(t * (p.cheer ? 9 : 2) + i + r)) * (p.cheer ? -10 : -1.5);
        const col = ['#2a2f45', '#3a2f2f', '#2f3f3a', '#44304a', '#3f3a2a'][Math.floor(hash(r * 50 + i + 9) * 5)], sh = 1 + r * 0.08;
        ell(ctx, hx, hy + 16 * sh, 17 * sh, 13 * sh, col); circ(ctx, hx, hy, 11 * sh, shade(col, 0.1));
        if (p.cheer && hash(i + r) > 0.5) { line(ctx, hx - 14 * sh, hy + 8, hx - 18 * sh, hy - 14, shade(col, 0.1), 5); line(ctx, hx + 14 * sh, hy + 8, hx + 18 * sh, hy - 14, shade(col, 0.1), 5); }
      } break;
    case 'longtable': {
      const w = p.w || 360;
      rect(ctx, x - w / 2 + 12, y - 22, 9, 22, '#5a3a1e'); rect(ctx, x + w / 2 - 21, y - 22, 9, 22, '#5a3a1e');
      rr(ctx, x - w / 2 + 4, y - 34, w - 8, 14, 3, '#6e4726'); rr(ctx, x - w / 2, y - 42, w, 9, 4, '#a8733c'); rect(ctx, x - w / 2 + 4, y - 42, w - 8, 3, '#c79058');
      for (const dx of [-0.38, -0.2, 0.2, 0.38]) { rr(ctx, x + w * dx - 8, y - 46, 16, 5, 1, '#fff'); } break; }
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
  crise:     { floor: '#5e4a58', floorTop: '#c46a6a', plat: '#8a3a3a', platTop: '#ff6a5a', label: 'Open space en crise' },
  circuit:   { floor: '#0a2a20', floorTop: '#c9a24a', plat: '#14543c', platTop: '#d9b64a', label: 'Carte mère' },
  pi:        { floor: '#2b2238', floorTop: '#5a4a6b', plat: '#7a5a3a', platTop: '#b98f52', label: 'Salle PI' },
  reunion:   { floor: '#3b2f45', floorTop: '#6a5580', plat: '#7a5a3a', platTop: '#b98f52', label: 'Salle de réunion' },
  bar:       { floor: '#241638', floorTop: '#ff4fa3', plat: '#4b2a1a', platTop: '#ff9a3c', label: 'Le bar' },
};
function drawTile(ctx, theme, kind, px, py, topExposed, tx, ty) {
  const T = THEMES[theme] || THEMES.openspace;
  if (kind === '=') {
    rect(ctx, px + 3, py + 14, TILE - 2, 6, 'rgba(0,0,0,.13)'); rect(ctx, px + 6, py + 20, TILE - 6, 4, 'rgba(0,0,0,.07)');     // ombre portée sur le décor
    rect(ctx, px, py, TILE, 14, shade(T.plat, -0.28)); rect(ctx, px, py, TILE, 11, T.plat);
    rect(ctx, px, py, TILE, 4, T.platTop); rect(ctx, px, py + 4, TILE, 1, shade(T.platTop, -0.3)); rect(ctx, px + 2, py + 1, TILE - 5, 1.5, 'rgba(255,255,255,.4)');
    circ(ctx, px + TILE / 2, py + 8, 1.4, 'rgba(0,0,0,.28)'); rect(ctx, px, py + 11, TILE, 1, 'rgba(255,255,255,.12)');
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
    case 'circuit':   rect(ctx, px + 8 + ((tx & 1) ? 10 : 0), py, 2, TILE, 'rgba(212,175,55,.3)'); rect(ctx, px, py + 20, TILE, 2, 'rgba(212,175,55,.22)'); circ(ctx, px + 9 + ((tx & 1) ? 10 : 0), py + 21, 2.4, 'rgba(255,230,120,.4)'); break;
  }
  ctx.globalAlpha = 0.16; rect(ctx, px, py + 14, TILE, 18, '#000'); ctx.globalAlpha = 1;               // le bas du bloc s'assombrit
  if (topExposed) { rect(ctx, px, py, TILE, theme === 'charlies' ? 3 : 5, T.floorTop); rect(ctx, px, py + (theme === 'charlies' ? 3 : 5), TILE, 2, 'rgba(0,0,0,.22)'); rect(ctx, px, py, TILE, 1, 'rgba(255,255,255,.4)'); if (theme === 'bar') { ctx.globalAlpha = 0.35; rect(ctx, px, py - 2, TILE, 2, '#ff4fa3'); ctx.globalAlpha = 1; } }
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
function drawSkull(ctx, x, y, s, c) {
  circ(ctx, x, y - 2 * s, 6 * s, c); rr(ctx, x - 3.6 * s, y + 2 * s, 7.2 * s, 5 * s, 1.5 * s, c);
  circ(ctx, x - 2.4 * s, y - 2 * s, 1.7 * s, '#12060a'); circ(ctx, x + 2.4 * s, y - 2 * s, 1.7 * s, '#12060a'); poly(ctx, [[x - 0.8 * s, y + 0.6 * s], [x + 0.8 * s, y + 0.6 * s], [x, y + 2 * s]], '#12060a');
  for (let i = -1; i <= 1; i++) rect(ctx, x + i * 2 * s - 0.3 * s, y + 4.4 * s, 0.7 * s, 2.6 * s, '#12060a');
}
BG.crise = (ctx, cx, t) => {
  BG.openspace(ctx, cx, t);
  par(cx, 0.55, 200, (x, i) => {                       // écrans piratés + gyrophares sur les bureaux
    const bx = x + 20, by = FLOOR_Y - 58, on = Math.floor(t * 3 + i) % 2 === 0;
    if (hash(i * 5) > 0.35 || true) {
      rr(ctx, bx + 33, by - 33, 28, 18, 2, on ? '#2a0508' : '#12060a');
      drawSkull(ctx, bx + 47, by - 26, 0.9, on ? '#ff5a5a' : '#ffd0d0');
    }
    if (i % 2 === 0) { const k = 0.5 + 0.5 * Math.sin(t * 9 + i); rr(ctx, bx + 76, by - 3, 14, 3, 1, '#444'); circ(ctx, bx + 83, by - 6, 6, k > 0.5 ? '#ff3030' : '#a01818'); ctx.globalAlpha = 0.25 * k; circ(ctx, bx + 83, by - 6, 18, '#ff3030'); ctx.globalAlpha = 1; }
  });
  par(cx, 0.3, 300, (x, i) => {                        // gyrophares au plafond, faisceaux qui tournent
    const bx = x + 150, by = 30, a = t * 3.2 + i * 1.7;
    rr(ctx, bx - 15, by - 4, 30, 8, 2, '#3a3d46');
    ctx.save(); ctx.translate(bx, by - 6); ctx.rotate(a);
    poly(ctx, [[0, 0], [300, -46], [300, 46]], 'rgba(255,40,40,.16)'); ctx.rotate(Math.PI); poly(ctx, [[0, 0], [300, -46], [300, 46]], 'rgba(255,40,40,.16)'); ctx.restore();
    const k = 0.5 + 0.5 * Math.sin(a * 2); ctx.globalAlpha = 0.3 + 0.3 * k; circ(ctx, bx, by - 6, 22, '#ff3030'); ctx.globalAlpha = 1;
    rr(ctx, bx - 9, by - 18, 18, 14, 7, k > 0.5 ? '#ff4040' : '#b01c1c');
  });
  par(cx, 0.4, 1000, (x, i) => {                       // bandeau d'alerte
    rr(ctx, x + 520, 296, 150, 36, 6, '#2a0508', '#ff4040', 3); txt(ctx, 'ALERTE CYBER', x + 595, 311, 14, '#ff6a6a', 'center'); txt(ctx, 'CVE-2026-3569-8569', x + 595, 326, 10, '#ffd0d0', 'center');
  });
  ctx.fillStyle = 'rgba(210,0,0,' + (0.07 + 0.05 * Math.sin(t * 6)) + ')'; ctx.fillRect(0, 0, W, H);
};
BG.circuit = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#04201a', '#0a3a2a');
  par(cx, 0.2, 80, (x) => { rect(ctx, x, 0, 1, H, 'rgba(0,255,150,.05)'); });
  for (let y = 30; y < H; y += 60) rect(ctx, 0, y, W, 1, 'rgba(0,255,150,.05)');
  par(cx, 0.3, 360, (x, i) => {                                    // pistes de cuivre + impulsions
    const y0 = 70 + hash(i * 3) * 330, dx = 60 + hash(i * 5) * 100;
    ctx.strokeStyle = 'rgba(212,175,55,.38)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 40, y0); ctx.lineTo(x + dx, y0); ctx.lineTo(x + dx + 70, y0 + 70 * (i % 2 ? 1 : -1)); ctx.lineTo(x + 380, y0 + 70 * (i % 2 ? 1 : -1)); ctx.stroke();
    circ(ctx, x - 40, y0, 8, 'rgba(212,175,55,.45)'); circ(ctx, x - 40, y0, 3.5, '#04201a');
    const k = (t * 90 + i * 70) % 440; circ(ctx, x - 40 + k, y0 + (k > dx + 40 ? Math.min(70, k - dx - 40) * (i % 2 ? 1 : -1) : 0), 3.2, '#9affd8');
  });
  par(cx, 0.5, 420, (x, i) => {                                    // puces
    const cxp = x + 70, cyp = 110 + hash(i * 11) * 180, w = 120, h = 80;
    for (let k = 0; k < 7; k++) { rect(ctx, cxp + 8 + k * 16, cyp - 8, 6, 8, '#b9a050'); rect(ctx, cxp + 8 + k * 16, cyp + h, 6, 8, '#b9a050'); }
    for (let k = 0; k < 5; k++) { rect(ctx, cxp - 8, cyp + 8 + k * 14, 8, 6, '#b9a050'); rect(ctx, cxp + w, cyp + 8 + k * 14, 8, 6, '#b9a050'); }
    rr(ctx, cxp, cyp, w, h, 5, '#10161c', '#2a3a44', 2); txt(ctx, ['CPU', 'RAM', 'GPU', 'I/O'][i & 3], cxp + w / 2, cyp + h / 2 + 6, 18, '#3a5a66', 'center');
    circ(ctx, cxp + 12, cyp + 12, 3, Math.floor(t * 3 + i) % 2 ? '#5dff9a' : '#1d5a38');
  });
  par(cx, 0.7, 210, (x, i) => { if (hash(i * 9) > 0.5) { rr(ctx, x + 40, FLOOR_Y - 46, 22, 46, 5, '#2a3a52'); rect(ctx, x + 40, FLOOR_Y - 40, 22, 4, '#c9a24a'); ell(ctx, x + 51, FLOOR_Y - 46, 11, 4, '#4a5a72'); } });
};
BG.pi = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#1c2038', '#0c0f20');
  rr(ctx, 230, 38, 500, 230, 8, '#0f2742', '#8fa6ff', 5); txt(ctx, 'DERNIER PI', 480, 110, 44, '#ffe08a', 'center'); txt(ctx, 'PI PLANNING · Delivery Team', 480, 150, 20, '#cfd8ff', 'center');
  for (let i = 0; i < 5; i++) rr(ctx, 270, 180 + i * 16, 80 + hash(i * 3) * 280, 8, 3, '#2f7fd1');
  rect(ctx, 0, 0, 80, FLOOR_Y, '#7a1e2e'); rect(ctx, W - 80, 0, 80, FLOOR_Y, '#7a1e2e'); rect(ctx, 0, 0, W, 26, '#5e1522');
  for (let i = 0; i < 4; i++) { rect(ctx, 14 + i * 16, 0, 3, FLOOR_Y, 'rgba(0,0,0,.25)'); rect(ctx, W - 80 + 14 + i * 16, 0, 3, FLOOR_Y, 'rgba(0,0,0,.25)'); }
  for (const lx of [260, 480, 700]) { ctx.save(); ctx.translate(lx, 0); ctx.globalAlpha = 0.1 + 0.04 * Math.sin(t * 2 + lx); poly(ctx, [[-6, 0], [6, 0], [90, FLOOR_Y], [-90, FLOOR_Y]], '#fff6c8'); ctx.restore(); }
};
BG.reunion = (ctx, cx, t) => {
  vgrad(ctx, 0, H, '#707f9c', '#454f68');
  for (let k = 0; k < 3; k++) { const wx = 30 + k * 310; if (k === 1) continue; rr(ctx, wx, 60, 240, 190, 6, '#a9d3f2', '#e6edf5', 6); for (let b = 0; b < 6; b++) rect(ctx, wx + 10 + b * 38, 250 - 40 - hash(k * 9 + b) * 90, 30, 40 + hash(k * 9 + b) * 90, '#86a9c8'); }
  rr(ctx, 330, 54, 300, 180, 6, '#f6f8fb', '#2a2f3a', 5); txt(ctx, 'CELLULE DE CRISE', 480, 98, 22, '#c0392b', 'center'); for (let i = 0; i < 4; i++) { rr(ctx, 360, 118 + i * 24, 120 + hash(i) * 120, 10, 4, '#aab4c4'); }
  rr(ctx, 790, 70, 130, 36, 6, '#1d222c'); txt(ctx, 'SALLE MOZART', 855, 94, 14, '#ffe08a', 'center'); txt(ctx, '♪', 70, 44, 26, 'rgba(255,255,255,.35)', 'center');
  rect(ctx, 0, FLOOR_Y - 150, W, 6, 'rgba(0,0,0,.15)');
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
const MOTE_COLOR = { circuit: '#9affd8', crise: '#ff9a9a', bar: '#ffb8f0', pi: '#ffe9a8', reunion: '#e8eefc', japonais: '#fff2c4', charlies: '#ffe6b0', gastro: '#ffe9a8' };
function drawMotes(ctx, cx, t, name) {                           // petites poussières de lumière qui flottent
  ctx.fillStyle = MOTE_COLOR[name] || '#ffffff';
  for (let i = 0; i < 24; i++) {
    const sp = 5 + hash(i + 9) * 11, x = ((hash(i) * (W + 80) - cx * (0.12 + hash(i + 4) * 0.2) + t * sp) % (W + 80) + (W + 80)) % (W + 80) - 40;
    const y = hash(i + 3) * (H - 70) + Math.sin(t * 0.7 + i * 1.7) * 14, r = 1 + hash(i + 5) * 2.2;
    ctx.globalAlpha = (0.10 + 0.16 * (0.5 + 0.5 * Math.sin(t * 1.3 + i))) * (name === 'openspace' || name === 'train' ? 0.8 : 1.4);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawBackground(ctx, name, cx, cy, t) { (BG[name] || BG.openspace)(ctx, cx || 0, t || 0); drawMotes(ctx, cx || 0, t || 0, name); }
