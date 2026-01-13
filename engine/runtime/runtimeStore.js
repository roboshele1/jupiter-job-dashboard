// engine/runtime/runtimeStore.js
// In-memory, immutable snapshot store

const store = {
  lastUpdated: null,
  snapshots: {}
};

export function writeSnapshot(key, value) {
  store.snapshots[key] = Object.freeze(value);
  store.lastUpdated = Date.now();
}

export function readSnapshot(key) {
  return store.snapshots[key] || null;
}

export function getRuntimeHealth() {
  return {
    lastUpdated: store.lastUpdated,
    keys: Object.keys(store.snapshots)
  };
}
