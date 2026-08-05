# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A classic Tetris implementation in vanilla JavaScript, HTML5 Canvas, and CSS. No dependencies, no build step, no package manager — the whole game is three files: `index.html`, `style.css`, `game.js` (~300 lines).

## Running the game

There is no build/lint/test tooling in this repo. To run it:

```bash
open index.html          # macOS, just opens the file directly
# or serve it locally:
python3 -m http.server 8000
npx serve .
php -S localhost:8000
```

Then visit `http://localhost:8000` if using a server. Any change to `game.js`/`style.css`/`index.html` is picked up on browser refresh — no compilation involved.

## Architecture

All game logic lives in `game.js` as module-level state and functions (no classes, no build-time modules — everything is a global `<script>`). Key pieces:

- **Board model**: `board` is a `ROWS × COLS` matrix (`createBoard()`); each cell is `0` (empty) or a piece color index `1–7`.
- **Pieces**: `PIECES` holds the 7 tetromino shapes as square matrices; `randomPiece()` picks one and instantiates `{ type, shape, x, y }`. Rotation is done by matrix transpose+reverse in `rotateCW()`, not by predefined rotation states.
- **Collision**: `collide(shape, ox, oy)` is the single source of truth for whether a shape placed at an offset is valid (out of bounds or overlapping locked cells). Used by movement, rotation, ghost-piece projection, and spawn-collision (game over) checks.
- **Wall kicks**: `tryRotate()` rotates then tries offsets `[0, -1, 1, -2, 2]` via `collide()` until one fits.
- **Locking a piece**: `lockPiece()` → `merge()` (writes the piece into `board`) → `clearLines()` (scans bottom-up, splices full rows, unshifts empty ones at top, updates score/level/dropInterval) → `spawn()` (promotes `next` to `current`, generates a new `next`, checks spawn collision to trigger `endGame()`).
- **Game loop**: `loop(ts)` runs via `requestAnimationFrame`, accumulates elapsed time in `dropAccum`, and advances the piece down one row (or locks it) once `dropAccum >= dropInterval`. `draw()` is called every frame regardless.
- **Ghost piece**: `ghostY()` projects the current piece straight down until it would collide, and `draw()` renders it at low alpha.
- **Scoring/leveling**: line clears use `LINE_SCORES = [0, 100, 300, 500, 800]` × `level`; hard drop adds 2 pts/row dropped, soft drop adds 1 pt/row. Level = `floor(lines / 10) + 1`; `dropInterval = max(100, 1000 - (level-1)*90)` ms.
- **Rendering**: two canvases — `#board` (main play field, driven by `draw()`/`drawGrid()`/`drawBlock()`) and `#next-canvas` (preview, driven by `drawNext()`). All drawing goes through `drawBlock()` which handles color lookup, alpha (for the ghost piece), and a highlight strip.
- **Input**: a single `keydown` listener switches on `e.code` (arrows, `KeyX` for rotate, `Space` for hard drop, `KeyP` for pause) and is gated by `paused`/`gameOver` state.
- **Pause/Game Over**: both reuse the same `#overlay` DOM element with different title/score text (`togglePause()`, `endGame()`); `restartBtn` calls `init()` to fully reset state.

`index.html` just declares the DOM (board canvas, next-piece canvas, score/lines/level panel, overlay) and pulls in `style.css` and `game.js`. `style.css` is a dark/retro arcade theme with no build step (plain CSS, flexbox layout).

## Tuning constants (in `game.js`)

`COLS`, `ROWS`, `BLOCK` (cell size in px), `COLORS` (palette per piece type), `LINE_SCORES`, and the initial `dropInterval` are the main knobs. If `COLS`, `ROWS`, or `BLOCK` change, the `#board` canvas `width`/`height` in `index.html` must be updated to match (`COLS × BLOCK` and `ROWS × BLOCK`).
