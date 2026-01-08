/**
 * DISCOVERY LAB — AUTONOMOUS SCAN (D14.3)
 * -------------------------------------
 * Adds FULL TELEMETRY VISIBILITY
 *
 * GOAL:
 * - Explain WHY nothing surfaced (not just that nothing surfaced)
 * - Preserve strict gates
 * - No execution, no mutation, no silent loosening
 */

const { buildDiscoveryUniverse } = require("./universe/buildDiscoveryUniverse.js");
const { runDiscoveryEngine } = require("./discoveryEngine.js");
const { rankDiscoveryResults } = require("./ranking/rankDiscoveryResults.js");
const {
  compareRegimeRankings,
} = require("./ranking/compareRegimeRankings.js");
const {
  analyzeRegimeDeltas,
} = require("./ranking/regimeDeltaAnalysis.js");

// -------------------------------
// CONFIG — CONTROLLED + PREVIEW
// -------------------------------
const SURFACING_CONFIG = Object.freeze({
  SURFACE_MIN_CONVICTION: 0.45,
  PREVIEW_MIN_CONVICTION: 0.35,
  MAX_SURFACED: 3,
  MAX_PREVIEW: 5,
});

// -------------------------------
// MAIN SCAN
// -------------------------------
async function runDiscoveryScan() {
  const telemetry = {
    universeRawCount: 0,
    universeNormalizedCount: 0,
    evaluatedCount: 0,
    rankedCount: 0,
    surfacedCount: 0,
    previewCount: 0,
    gating: {},
    notes: [],
  };

  // ---- BUILD UNIVERSE ----
  const rawUniverse = await buildDiscoveryUniverse();

  telemetry.universeRawCount =
    rawUniverse?.telemetry?.rawSnapshotCount ??
    rawUniverse?.universe?.length ??
    0;

  telemetry.gating.volumeFloorUsed =
    rawUniverse?.telemetry?.volumeFloorUsed ?? null;

  const universe = (rawUniverse?.universe || [])
    .map((u) => {
      if (typeof u === "string") return { symbol: u, tags: [] };
      if (u && typeof u.symbol === "string") {
        return { symbol: u.symbol, tags: u.tags || [] };
      }
      return null;
    })
    .filter(Boolean);

  telemetry.universeNormalizedCount = universe.length;

  if (telemetry.universeRawCount === 0) {
    telemetry.notes.push("Live market snapshot returned zero assets.");
  }

  if (telemetry.universeRawCount > 0 && universe.length === 0) {
    telemetry.notes.push(
      "All assets were filtered out during universe normalization."
    );
  }

  // ---- EVALUATE ----
  const evaluated = [];

  for (const asset of universe) {
    const result = await runDiscoveryEngine({
      symbol: asset.symbol,
      ownership: false,
    });

    evaluated.push(
      Object.freeze({
        ...result,
        tags: asset.tags,
      })
    );
  }

  telemetry.evaluatedCount = evaluated.length;

  if (evaluated.length === 0 && universe.length > 0) {
    telemetry.notes.push(
      "Universe populated but no assets produced evaluable discovery results."
    );
  }

  // ---- RANK ----
  const canonicalRanked = rankDiscoveryResults(evaluated);
  telemetry.rankedCount = canonicalRanked.length;

  // ---- SURFACING GATE (AUTHORITATIVE) ----
  const surfaced = canonicalRanked
    .filter(
      (r) =>
        r.conviction?.normalized >= SURFACING_CONFIG.SURFACE_MIN_CONVICTION &&
        r.decision?.decision !== "AVOID"
    )
    .slice(0, SURFACING_CONFIG.MAX_SURFACED);

  telemetry.surfacedCount = surfaced.length;

  telemetry.gating.surfacing = {
    minConviction: SURFACING_CONFIG.SURFACE_MIN_CONVICTION,
    blockedByAVOID: canonicalRanked.filter(
      (r) => r.decision?.decision === "AVOID"
    ).length,
  };

  if (canonicalRanked.length > 0 && surfaced.length === 0) {
    telemetry.notes.push(
      "Assets evaluated and ranked, but none passed the surfacing conviction gate."
    );
  }

  // ---- HUMAN-IN-THE-LOOP PREVIEW ----
  const preview = canonicalRanked
    .filter(
      (r) =>
        r.conviction?.normalized >=
          SURFACING_CONFIG.PREVIEW_MIN_CONVICTION &&
        r.conviction?.normalized <
          SURFACING_CONFIG.SURFACE_MIN_CONVICTION &&
        r.decision?.decision !== "AVOID"
    )
    .slice(0, SURFACING_CONFIG.MAX_PREVIEW)
    .map((r) =>
      Object.freeze({
        symbol: r.symbol,
        conviction: r.conviction,
        decision: r.decision,
        regime: r.regime,
        rank: r.rank,
        previewReason:
          "Near-miss: conviction below surfacing threshold. Human review only.",
      })
    );

  telemetry.previewCount = preview.length;

  if (canonicalRanked.length > 0 && preview.length === 0) {
    telemetry.notes.push(
      "No near-miss candidates met preview criteria."
    );
  }

  // ---- REGIME COMPARISON ----
  const comparativeByRegime = compareRegimeRankings(evaluated);
  const deltas = analyzeRegimeDeltas({
    canonical: canonicalRanked,
    comparativeByRegime,
  });

  return Object.freeze({
    canonical: surfaced,
    preview,
    comparativeByRegime,
    regimeDeltas: deltas,
    telemetry,
  });
}

module.exports = Object.freeze({
  runDiscoveryScan,
});
