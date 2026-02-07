// engine/signalsSnapshotEngine.js
// Signals Snapshot History — Delta authority (EXTENDED, LOCK-SAFE)
//
// Responsibilities:
// - Preserve Signals V2 confidence delta tracking (unchanged)
// - Append Portfolio Technical Signals as a parallel, non-conflicting channel
// - Deterministic, read-only, engine-only
//
// Invariants:
// - Existing Signals V2 behavior is untouched
// - Technical signals NEVER override confidence signals
// - Both channels may coexist in the same snapshot

let lastSnapshot = null;

const CONFIDENCE_ORDER = { Low: 1, Medium: 2, High: 3 };

/* =========================
   HELPERS — EXISTING LOGIC
   ========================= */

function computeDelta(currentRank, previousRank) {
  if (previousRank == null) return "→";
  if (currentRank > previousRank) return "↑";
  if (currentRank < previousRank) return "↓";
  return "→";
}

/* =========================
   NORMALIZATION
   ========================= */

function normalizeSignalsV2(snapshot) {
  if (!Array.isArray(snapshot?.signals)) return snapshot;

  const normalizedSignals = snapshot.signals.map((s) => {
    const prev = lastSnapshot?.signalsV2?.signals?.find(
      (p) => p.symbol === s.symbol
    );

    return {
      ...s,
      delta: computeDelta(
        s.confidenceRank,
        prev?.confidenceRank
      ),
    };
  });

  return {
    ...snapshot,
    signals: normalizedSignals,
  };
}

function normalizePortfolioTechnicalSignals(techSnapshot) {
  if (!techSnapshot?.signals) return null;

  const filtered = Object.values(techSnapshot.signals).filter(
    (s) => s.state && s.state !== "HOLD"
  );

  return {
    contract: techSnapshot.contract,
    asOf: techSnapshot.asOf,
    surfaced: filtered.length > 0,
    signals: filtered,
  };
}

/* =========================
   PUBLIC API
   ========================= */

function recordSnapshot(snapshot) {
  const next = {
    timestamp: snapshot.timestamp ?? Date.now(),

    // -------- Signals V2 (unchanged semantics)
    signalsV2: snapshot.signals
      ? normalizeSignalsV2(snapshot)
      : lastSnapshot?.signalsV2 ?? null,

    // -------- Portfolio Technical Signals (append-only)
    portfolioTechnicalSignals:
      snapshot.portfolioTechnicalSignals
        ? normalizePortfolioTechnicalSignals(
            snapshot.portfolioTechnicalSignals
          )
        : lastSnapshot?.portfolioTechnicalSignals ?? null,
  };

  lastSnapshot = next;
  return Object.freeze(next);
}

module.exports = Object.freeze({ recordSnapshot });
