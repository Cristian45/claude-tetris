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

// Synchronous default so render.js always has something to draw with even
// before the persisted preference is applied from ui.js's bootstrap.
Skins.active = Skins.registry.retro;
