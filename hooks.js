'use strict';

// Extension points other modules plug into. Owned by the refactor — feature
// modules assign to these fields, they don't edit this file.
const Hooks = {
  onGameOver: null,      // (payload: { score, lines, level, maxCombo, maxLinesAtOnce }) => void
  onLinesCleared: null,  // (cleared: number) => void
  onPauseRequested: null,// () => void
  onResume: null,        // () => void
  onStart: null,         // () => void
};
