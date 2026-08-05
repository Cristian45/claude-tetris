'use strict';

// Highscores unit: fills #overlay's SLOT-B2 (name entry + top-5 list on game
// over) and #start-screen's SLOT-B1 (top-5 list + best combo / max lines),
// and overwrites Hooks.onGameOver (currently ui.js's default).

(function () {
  const MAX_ENTRIES = 5;
  const SCORES_KEY = 'highscores';
  const BEST_KEY = 'bestStats';

  function getScores() {
    return Storage.get(SCORES_KEY, []);
  }

  function saveScores(list) {
    Storage.set(SCORES_KEY, list);
  }

  function getBestStats() {
    return Storage.get(BEST_KEY, { maxCombo: 0, maxLinesAtOnce: 0 });
  }

  function saveBestStats(stats) {
    Storage.set(BEST_KEY, stats);
  }

  // Best combo / max single-clear line count are tracked as their own
  // all-time records, independent of whether a given game's score made the
  // top 5 — a huge combo with a modest score should still count.
  function updateBestStats(payload) {
    const best = getBestStats();
    const updated = {
      maxCombo: Math.max(best.maxCombo, payload.maxCombo || 0),
      maxLinesAtOnce: Math.max(best.maxLinesAtOnce, payload.maxLinesAtOnce || 0),
    };
    saveBestStats(updated);
    return updated;
  }

  function qualifies(score, list) {
    if (list.length < MAX_ENTRIES) return true;
    return score > list[list.length - 1].score;
  }

  function findCommentNode(root, text) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim() === text) return node;
    }
    return null;
  }

  function mountAfterComment(root, commentText, el) {
    const comment = findCommentNode(root, commentText);
    if (!comment || !comment.parentNode) return null;
    comment.parentNode.insertBefore(el, comment.nextSibling);
    return el;
  }

  const gameOverRoot = document.querySelector('#overlay .overlay-box');
  const startRoot = document.querySelector('#start-screen .overlay-box');

  const gameOverContainer = document.createElement('div');
  gameOverContainer.className = 'hs-gameover';
  mountAfterComment(gameOverRoot, 'SLOT-B2: name entry + top-5 list', gameOverContainer);

  const startContainer = document.createElement('div');
  startContainer.className = 'hs-start';
  mountAfterComment(startRoot, 'SLOT-B1: top-5 list + best combo / max lines', startContainer);

  function buildListEl(list, highlightIndex) {
    const wrap = document.createElement('div');
    wrap.className = 'hs-list';
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'hs-empty';
      empty.textContent = 'Sin records todavía';
      wrap.appendChild(empty);
      return wrap;
    }
    const ol = document.createElement('ol');
    list.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = 'hs-row';
      if (i === highlightIndex) li.classList.add('hs-row-highlight');
      const rank = document.createElement('span');
      rank.className = 'hs-rank';
      rank.textContent = `${i + 1}.`;
      const name = document.createElement('span');
      name.className = 'hs-name';
      name.textContent = entry.name || '---';
      const scoreEl = document.createElement('span');
      scoreEl.className = 'hs-score';
      scoreEl.textContent = (entry.score || 0).toLocaleString();
      li.appendChild(rank);
      li.appendChild(name);
      li.appendChild(scoreEl);
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
    return wrap;
  }

  function buildBestStatsEl(stats) {
    const wrap = document.createElement('div');
    wrap.className = 'hs-best-stats';
    const combo = document.createElement('span');
    combo.textContent = `Mejor combo: ${stats.maxCombo}`;
    const maxLines = document.createElement('span');
    maxLines.textContent = `Máx. líneas de una vez: ${stats.maxLinesAtOnce}`;
    wrap.appendChild(combo);
    wrap.appendChild(maxLines);
    return wrap;
  }

  function buildResetBtn() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hs-reset-btn';
    btn.textContent = 'Resetear records';
    btn.addEventListener('click', () => {
      if (!confirm('¿Seguro que quieres borrar todos los records?')) return;
      saveScores([]);
      saveBestStats({ maxCombo: 0, maxLinesAtOnce: 0 });
      renderStart();
      renderGameOver(lastPayload);
    });
    return btn;
  }

  // Payload from the most recent game over, kept so the reset button (on the
  // start screen) can refresh the game-over list too if it's still mounted.
  let lastPayload = null;

  // highlightIndex === undefined means "initial render for this game over":
  // decide whether to show the name-entry form. A defined highlightIndex
  // (including -1) means "just re-rendering the read-only list".
  function renderGameOver(payload, highlightIndex) {
    gameOverContainer.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'hs-title';
    title.textContent = 'RECORDS';
    gameOverContainer.appendChild(title);

    const list = getScores();
    const showForm = highlightIndex === undefined && payload && qualifies(payload.score, list);

    if (showForm) {
      const form = document.createElement('div');
      form.className = 'hs-form';

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 12;
      input.placeholder = 'Tu nombre';
      input.className = 'hs-name-input';
      input.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') saveBtn.click();
      });

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'hs-save-btn';
      saveBtn.textContent = 'Guardar';
      saveBtn.addEventListener('click', () => {
        const name = input.value.trim() || 'Jugador';
        const entry = {
          name,
          score: payload.score,
          lines: payload.lines,
          level: payload.level,
          combo: payload.maxCombo,
          maxLinesAtOnce: payload.maxLinesAtOnce,
          date: new Date().toISOString(),
        };
        const updated = getScores().concat([entry]);
        updated.sort((a, b) => b.score - a.score);
        updated.length = Math.min(updated.length, MAX_ENTRIES);
        saveScores(updated);
        const idx = updated.indexOf(entry);
        renderGameOver(payload, idx);
        renderStart();
      });

      form.appendChild(input);
      form.appendChild(saveBtn);
      gameOverContainer.appendChild(form);
    }

    gameOverContainer.appendChild(buildListEl(list, highlightIndex === undefined ? -1 : highlightIndex));
    gameOverContainer.appendChild(buildBestStatsEl(getBestStats()));
  }

  function renderStart() {
    startContainer.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'hs-title';
    title.textContent = 'RECORDS';
    startContainer.appendChild(title);

    startContainer.appendChild(buildListEl(getScores(), -1));
    startContainer.appendChild(buildBestStatsEl(getBestStats()));
    startContainer.appendChild(buildResetBtn());
  }

  Hooks.onGameOver = function (payload) {
    defaultShowGameOver(payload);
    updateBestStats(payload);
    lastPayload = payload;
    renderGameOver(payload);
    renderStart();
  };

  // Populate the start-screen list/stats immediately on page load, before any
  // game has been played this session.
  renderStart();
})();
