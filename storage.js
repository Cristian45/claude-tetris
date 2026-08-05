'use strict';

// Namespaced localStorage wrapper. Guards against private-mode / quota errors.
const Storage = {
  prefix: 'tetris.',
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // private mode or quota exceeded — ignore, preference just won't persist
    }
  },
};
