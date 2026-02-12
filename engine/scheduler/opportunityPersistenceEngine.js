/**
 * JUPITER — OPPORTUNITY PERSISTENCE ENGINE
 *
 * Tracks recurring top-ranked assets across 30-min digest cycles.
 *
 * If an asset appears repeatedly:
 * → escalate to CAPITAL ALLOCATION PRIORITY
 *
 * Deterministic. No bias.
 */

const MEMORY = new Map();

// number of digest appearances required
const PERSISTENCE_THRESHOLD = 3;

// decay window — if not seen again, confidence fades
const DECAY_LIMIT = 6;

function updatePersistence(opportunities = []) {

  const nowSeen = new Set(opportunities.map(o => o.symbol));

  // update appearances
  opportunities.forEach(o => {
    const existing = MEMORY.get(o.symbol) || { hits: 0, lastSeen: 0 };

    MEMORY.set(o.symbol, {
      hits: existing.hits + 1,
      lastSeen: 0
    });
  });

  // decay unseen
  MEMORY.forEach((v, symbol) => {
    if (!nowSeen.has(symbol)) {
      v.lastSeen += 1;
      if (v.lastSeen > DECAY_LIMIT) {
        MEMORY.delete(symbol);
      } else {
        MEMORY.set(symbol, v);
      }
    }
  });

  // determine escalation
  const escalations = [];

  MEMORY.forEach((v, symbol) => {
    if (v.hits >= PERSISTENCE_THRESHOLD) {
      escalations.push({
        symbol,
        level: "CAPITAL_ALLOCATION_PRIORITY",
        hits: v.hits
      });
    }
  });

  return escalations;
}

module.exports = Object.freeze({
  updatePersistence
});
