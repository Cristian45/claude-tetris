# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A classic Tetris implementation in vanilla JavaScript, HTML5 Canvas, and CSS. No dependencies, no build step, no package manager — the whole game is `index.html`, `style.css`, and eight small global `<script>` files (no ES modules, no bundler).

## Running the game

There is no build/lint/test tooling in this repo. To run it:

```bash
open index.html          # macOS, just opens the file directly
# or serve it locally:
python3 -m http.server 8000
npx serve .
php -S localhost:8000
```

Then visit `http://localhost:8000` if using a server. Any change to a `.js` file, `style.css`, or `index.html` is picked up on browser refresh — no compilation involved.

## Architecture

Game logic used to live in a single `game.js`; it's now split into eight files, all plain global `<script>`s (no classes, no build-time modules) loaded in this order from `index.html`:

| File | Responsibility |
|---|---|
| `hooks.js` | The `Hooks` registry — named extension points (`onGameOver`, `onLinesCleared`, `onPauseRequested`, `onResume`, `onStart`) that other modules assign functions to. Declares the fields only; nothing else should edit this file. |
| `storage.js` | `Storage.get(key, fallback)` / `Storage.set(key, value)` — namespaced (`tetris.*`) `localStorage` wrapper, safe under private-mode/quota errors. |
| `skins.js` | `Skins` registry (`Skins.register(name, skin)`, `Skins.apply(name)`, `Skins.active`). A skin is `{ cssClass, bg, gridColor, palette, drawBlock(context, x, y, colorIndex, size, alpha) }`. Ships the `retro` skin (today's look). |
| `render.js` | `draw()`, `drawGrid()`, `drawNext()`, and the two canvas contexts. Always draws through `Skins.active`, so new skins never require editing this file. |
| `core.js` | The game model and loop: `board`, `PIECES`, `collide()`, `rotateCW()`, `tryRotate()`, `merge()`, `clearLines()`, `ghostY()`, `hardDrop()`/`softDrop()`, `lockPiece()`, `spawn()`, `endGame()`, `loop()`, `init()`. Also declares `Stats = { combo, maxCombo, maxLinesAtOnce }`, reset each `init()`. |
| `ui.js` | HUD (`updateHUD()`), the `#overlay`/`#pause-overlay`/`#start-screen` DOM refs, the `keydown` listener, `setInputLock(bool)` (gates gameplay keys while a modal is open), and baseline default implementations for `Hooks.onPauseRequested`/`onResume`/`onGameOver` (simple show/hide of the overlays — feature modules overwrite these with richer behavior). |
| `pausemenu.js` | Owns the pause-menu UI built inside `#pause-overlay`; overwrites `Hooks.onPauseRequested`/`onResume`. |
| `highscores.js` | Owns the local top-5 leaderboard built inside `#overlay` (game over) and `#start-screen`; overwrites `Hooks.onGameOver`. |

Key mechanics (unchanged from before the split):

- **Board model**: `board` is a `ROWS × COLS` matrix (`createBoard()`); each cell is `0` (empty) or a piece color index `1–7`.
- **Pieces**: `PIECES` holds the 7 tetromino shapes as square matrices; `randomPiece()` picks one and instantiates `{ type, shape, x, y }`. Rotation is done by matrix transpose+reverse in `rotateCW()`, not by predefined rotation states.
- **Collision**: `collide(shape, ox, oy)` is the single source of truth for whether a shape placed at an offset is valid (out of bounds or overlapping locked cells). Used by movement, rotation, ghost-piece projection, and spawn-collision (game over) checks.
- **Wall kicks**: `tryRotate()` rotates then tries offsets `[0, -1, 1, -2, 2]` via `collide()` until one fits.
- **Locking a piece**: `lockPiece()` → `merge()` (writes the piece into `board`) → `clearLines()` (scans bottom-up, splices full rows, unshifts empty ones at top, updates score/level/dropInterval, fires `Hooks.onLinesCleared`) → `spawn()` (promotes `next` to `current`, generates a new `next`, checks spawn collision to trigger `endGame()`, which fires `Hooks.onGameOver`).
- **Game loop**: `loop(ts)` runs via `requestAnimationFrame`, accumulates elapsed time in `dropAccum`, and advances the piece down one row (or locks it) once `dropAccum >= dropInterval`. `draw()` is called every frame regardless.
- **Ghost piece**: `ghostY()` projects the current piece straight down until it would collide, and `draw()` renders it at low alpha.
- **Scoring/leveling**: line clears use `LINE_SCORES = [0, 100, 300, 500, 800]` × `level`; hard drop adds 2 pts/row dropped, soft drop adds 1 pt/row. Level = `floor(lines / 10) + 1`; `dropInterval = max(100, 1000 - (level-1)*90)` ms. `init()` reads the starting level from `Storage.get('startLevel', 1)` instead of hardcoding `1`.
- **Rendering**: two canvases — `#board` (main play field) and `#next-canvas` (preview). All block drawing goes through `Skins.active.drawBlock()`, so the visual theme is swappable without touching `render.js`.
- **Input**: a single `keydown` listener in `ui.js` switches on `e.code` (arrows, `KeyX` for rotate, `Space` for hard drop, `KeyP`/`Escape` for pause) and is gated by `paused`/`gameOver`/`inputLocked` state.
- **Pause vs. Game Over**: these are now two separate overlay elements — `#pause-overlay` and `#overlay` — so the pause-menu and highscores units don't collide on the same DOM. `restartBtn`/`init()` fully resets state without a page reload.
- **Start screen**: `#start-screen` is shown on load instead of auto-starting; clicking `#start-btn` hides it, fires `Hooks.onStart`, and calls `init()`.

`index.html` declares the DOM and marks numbered extension points as HTML comments (`<!-- SLOT-A1: ... -->`, etc.) that `pausemenu.js`/`highscores.js`/skin & combo work fill in. `style.css` is a dark/retro arcade theme with no build step (plain CSS, flexbox layout), with empty section comments reserved for the same features.

## Tuning constants (in `core.js`)

`COLS`, `ROWS`, `BLOCK` (cell size in px), `LINE_SCORES`, and the initial `dropInterval` formula are the main knobs; the color palette lives per-skin in `skins.js` instead of a single global `COLORS`. If `COLS`, `ROWS`, or `BLOCK` change, the `#board` canvas `width`/`height` in `index.html` must be updated to match (`COLS × BLOCK` and `ROWS × BLOCK`).
