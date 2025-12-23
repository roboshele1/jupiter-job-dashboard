// renderer/services/snapshotAdapter.js
// Snapshot Adapter — READ ONLY
// Phase 5 — Renderer consumes backend snapshot ONLY
// LOCKED CONTRACT

export async function buildSnapshot() {
  try {
    const res = await fetch("http://localhost:3001/snapshot");
    if (!res.ok) throw new Error("Snapshot server unavailable");

    const live = await res.json();

    return {
      meta: {
        source: live.source,
        timestamp: live.timestamp,
      },
      prices: live.prices,
    };
  } catch (err) {
    return {
      meta: {
        source: "unavailable",
        timestamp: null,
      },
      prices: {},
      error: err.message,
    };
  }
}

