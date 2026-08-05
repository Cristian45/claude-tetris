'use strict';

// Skin registry. render.js always draws through Skins.active, so adding a
// skin here never requires touching render.js.
const Skins = {
  registry: {},
  active: null,
  register(name, skin) {
    this.registry[name] = skin;
  },
  apply(name) {
    const resolved = this.registry[name] ? name : 'retro';
    const skin = this.registry[resolved];
    this.active = skin;
    Storage.set('skin', resolved);
    document.body.className = skin.cssClass || '';
    const board = document.getElementById('board');
    const nextCanvas = document.getElementById('next-canvas');
    if (board) board.style.background = skin.bg;
    if (nextCanvas) nextCanvas.style.background = skin.bg;
  },
};

Skins.register('retro', {
  cssClass: 'skin-retro',
  bg: '#1a1a25',
  gridColor: '#22222e',
  palette: [
    null,
    '#4dd0e1', // I - cyan
    '#ffd54f', // O - yellow
    '#ba68c8', // T - purple
    '#81c784', // S - green
    '#e57373', // Z - red
    '#7986cb', // J - indigo
    '#ffb74d', // L - orange
  ],
  drawBlock(context, x, y, colorIndex, size, alpha) {
    if (!colorIndex) return;
    context.globalAlpha = alpha ?? 1;
    context.fillStyle = this.palette[colorIndex];
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    context.globalAlpha = 1;
  },
});

Skins.register('neon', {
  cssClass: 'skin-neon',
  bg: '#000000',
  gridColor: '#141428',
  palette: [
    null,
    '#00f6ff', // I - cyan
    '#faff00', // O - yellow
    '#ff00e6', // T - magenta
    '#39ff14', // S - green
    '#ff2b2b', // Z - red
    '#4d6bff', // J - blue
    '#ff9500', // L - orange
  ],
  drawBlock(context, x, y, colorIndex, size, alpha) {
    if (!colorIndex) return;
    const color = this.palette[colorIndex];
    context.globalAlpha = alpha ?? 1;
    context.shadowBlur = 14;
    context.shadowColor = color;
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.shadowBlur = 0;
    context.fillStyle = 'rgba(255,255,255,0.25)';
    context.fillRect(x * size + 1, y * size + 1, size - 2, 3);
    context.globalAlpha = 1;
  },
});

Skins.register('pastel', {
  cssClass: 'skin-pastel',
  bg: '#f5f0fa',
  gridColor: '#e0d8ea',
  palette: [
    null,
    '#a8dadc', // I
    '#ffe8a3', // O
    '#d8b4e2', // T
    '#b8e0b8', // S
    '#f4a6a6', // Z
    '#b0c4f0', // J
    '#f7c99e', // L
  ],
  drawBlock(context, x, y, colorIndex, size, alpha) {
    if (!colorIndex) return;
    context.globalAlpha = alpha ?? 1;
    const px = x * size + 1;
    const py = y * size + 1;
    const w = size - 2;
    const h = size - 2;
    const r = Math.min(6, w / 3);
    context.fillStyle = this.palette[colorIndex];
    context.beginPath();
    if (context.roundRect) {
      context.roundRect(px, py, w, h, r);
    } else {
      context.moveTo(px + r, py);
      context.arcTo(px + w, py, px + w, py + h, r);
      context.arcTo(px + w, py + h, px, py + h, r);
      context.arcTo(px, py + h, px, py, r);
      context.arcTo(px, py, px + w, py, r);
      context.closePath();
    }
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.35)';
    context.beginPath();
    if (context.roundRect) {
      context.roundRect(px, py, w, Math.max(2, h * 0.35), r);
    } else {
      context.rect(px, py, w, Math.max(2, h * 0.35));
    }
    context.fill();
    context.globalAlpha = 1;
  },
});

Skins.register('pixel', {
  cssClass: 'skin-pixel',
  bg: '#12121a',
  gridColor: '#26263a',
  palette: [
    null,
    '#4dd0e1', // I - cyan
    '#ffd54f', // O - yellow
    '#ba68c8', // T - purple
    '#81c784', // S - green
    '#e57373', // Z - red
    '#7986cb', // J - indigo
    '#ffb74d', // L - orange
  ],
  drawBlock(context, x, y, colorIndex, size, alpha) {
    if (!colorIndex) return;
    context.globalAlpha = alpha ?? 1;
    const px = x * size + 1;
    const py = y * size + 1;
    const w = size - 2;
    const h = size - 2;
    context.fillStyle = this.palette[colorIndex];
    context.fillRect(px, py, w, h);
    // repeating checkerboard texture on top of the base fill, for a
    // pixel-art / dithered look instead of a flat block.
    const cell = Math.max(2, Math.floor(w / 4));
    for (let sy = 0; sy < h; sy += cell) {
      for (let sx = 0; sx < w; sx += cell) {
        const light = ((sx / cell) + (sy / cell)) % 2 === 0;
        context.fillStyle = light ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
        context.fillRect(px + sx, py + sy, Math.min(cell, w - sx), Math.min(cell, h - sy));
      }
    }
    context.strokeStyle = 'rgba(0,0,0,0.35)';
    context.lineWidth = 1;
    context.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
    context.globalAlpha = 1;
  },
});

// Synchronous default so render.js always has something to draw with even
// before the persisted preference is applied from ui.js's bootstrap.
Skins.active = Skins.registry.retro;

// Wires up the skin-selector controls in both SLOT-C1 (start screen) and
// SLOT-C2 (sidebar), keeping them in sync with each other. Uses a delegated
// click listener so it works regardless of DOM insertion order, and syncs
// the "active" highlight on DOMContentLoaded — which fires only after every
// script tag (including ui.js's Skins.apply(Storage.get(...)) bootstrap
// call) has run, so Skins.active is already resolved by then.
function renderSkinSelectors() {
  document.querySelectorAll('.skin-option').forEach(btn => {
    const isActive = Skins.registry[btn.dataset.skin] === Skins.active;
    btn.classList.toggle('active', isActive);
  });
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.skin-option');
  if (!btn) return;
  Skins.apply(btn.dataset.skin);
  renderSkinSelectors();
});

document.addEventListener('DOMContentLoaded', renderSkinSelectors);
