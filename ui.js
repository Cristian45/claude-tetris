'use strict';

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const pauseOverlay = document.getElementById('pause-overlay');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

// Set while a modal (pause menu, etc.) is open so accidental keypresses
// don't reach gameplay when the player returns focus to the board.
let inputLocked = false;

function setInputLock(locked) {
  inputLocked = locked;
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

// Baseline pause behavior — kept working even before the pause-menu unit
// lands. That unit overwrites Hooks.onPauseRequested/onResume with a richer
// implementation built on the same #pause-overlay element.
function defaultTogglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    pauseOverlay.classList.add('hidden');
    lastTime = performance.now();
    loop(lastTime);
    Hooks.onResume && Hooks.onResume();
  } else {
    cancelAnimationFrame(animId);
    pauseOverlay.classList.remove('hidden');
  }
}

// Baseline game-over screen — kept working even before the highscores unit
// lands. That unit overwrites Hooks.onGameOver to add the name entry / top-5
// list on top of this same #overlay element.
function defaultShowGameOver(payload) {
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${payload.score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

Hooks.onPauseRequested = defaultTogglePause;
Hooks.onGameOver = defaultShowGameOver;

document.addEventListener('keydown', e => {
  if (!startScreen.classList.contains('hidden')) return;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    Hooks.onPauseRequested && Hooks.onPauseRequested();
    return;
  }
  if (paused || gameOver || inputLocked) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  Hooks.onStart && Hooks.onStart();
  init();
});

Skins.apply(Storage.get('skin', 'retro'));
