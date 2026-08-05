'use strict';

// Pause-menu unit: fills #pause-overlay's SLOT-A1 (in-menu content) and
// SLOT-A2 (start-screen starting-level selector), and overwrites
// Hooks.onPauseRequested / Hooks.onResume (currently ui.js's defaults).

const MIN_START_LEVEL = 1;
const MAX_START_LEVEL = 15;

const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const toggleControlsBtn = document.getElementById('toggle-controls-btn');
const pauseControlsList = document.getElementById('pause-controls-list');
const pauseLevelSelect = document.getElementById('pause-level-select');
const startLevelSelect = document.getElementById('start-level-select');

function populateLevelSelect(select) {
  for (let i = MIN_START_LEVEL; i <= MAX_START_LEVEL; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    select.appendChild(opt);
  }
}

function syncLevelSelects(value) {
  if (pauseLevelSelect) pauseLevelSelect.value = value;
  if (startLevelSelect) startLevelSelect.value = value;
}

function onLevelSelectChange(e) {
  const value = Number(e.target.value);
  Storage.set('startLevel', value);
  syncLevelSelects(value);
}

populateLevelSelect(pauseLevelSelect);
populateLevelSelect(startLevelSelect);
syncLevelSelects(Storage.get('startLevel', 1));

pauseLevelSelect.addEventListener('change', onLevelSelectChange);
startLevelSelect.addEventListener('change', onLevelSelectChange);

// Resumes gameplay exactly like ui.js's defaultTogglePause resume branch:
// hide the overlay, unlock input, restart the loop from "now".
function resumeGame() {
  if (!paused) return;
  paused = false;
  pauseOverlay.classList.add('hidden');
  setInputLock(false);
  lastTime = performance.now();
  loop(lastTime);
  Hooks.onResume && Hooks.onResume();
}

// Opens the rich pause menu: cancel the frame, show the overlay, lock input
// so gameplay keys can't leak through while the menu has focus.
function openPauseMenu() {
  if (gameOver || paused) return;
  paused = true;
  cancelAnimationFrame(animId);
  pauseControlsList.classList.add('hidden');
  pauseOverlay.classList.remove('hidden');
  setInputLock(true);
}

// "Reiniciar" inside the pause menu: unlock input then let init() fully
// reset state (it already hides #pause-overlay and restarts the loop).
function restartFromPauseMenu() {
  setInputLock(false);
  init();
}

resumeBtn.addEventListener('click', resumeGame);
pauseRestartBtn.addEventListener('click', restartFromPauseMenu);
toggleControlsBtn.addEventListener('click', () => {
  pauseControlsList.classList.toggle('hidden');
});

Hooks.onPauseRequested = () => {
  if (gameOver) return;
  if (paused) resumeGame();
  else openPauseMenu();
};
