/**
 * Context Assembler — Portfolio Intelligence Bridge (Signals-Enriched)
 * --------------------------------------------------------------------
 * Deterministic:
 * - Portfolio authority
 * - Signals interface
 * - Valuation authority
 *
 * No scoring, no reasoning, no forecasting.
 * Data bridge only.
 */

import { loadLatestSnapshot } from "../snapshots/latestSnapshotResolver.js";
import { valuePortfolio } from "../portfolio/portfolioValuation.js";
import { assembleSignalsContext } from "./signalInterface.js";

/* helper — supports array OR object signals */
function indexSignalsBySymbol(signalsV1) {
  const map = {};

  if (!signalsV1) return map;

  // case 1 — array
  if (Array.isArray(signalsV1)) {
    for (const s of signalsV1) {
      if (!s?.symbol) continue;
      map[s.symbol] = s;
    }
    return map;
  }

  // case 2 — object keyed by symbol
  if (typeof signalsV1 === "object") {
    for (const symbol of Object.keys(signalsV1)) {
      map[symbol] = signalsV1[symbol];
    }
  }

  return map;
}

/**
 * assembleIntelligenceContext
 * Returns enriched intelligence-ready portfolio context.
 */
export async function assembleIntelligenceContext() {
  const snapshot = loadLatestSnapshot();

  if (!snapshot?.holdings) {
    return {
      contextAvailable: false,
      portfolioValue: 0,
      positions: [],
      totals: null,
      source: "no-snapshot"
    };
  }

  /* valuation authority */
  const valuation = await valuePortfolio(
    snapshot.holdings.map(h => ({
      symbol: h.symbol,
      qty: h.qty ?? h.quantity ?? 0,
      assetClass:
        h.symbol === "BTC" || h.symbol === "ETH"
          ? "crypto"
          : "equity",
      totalCostBasis: h.totalCostBasis ?? 0,
      currency: "USD"
    }))
  );

  const basePositions = valuation?.positions || [];

  /* signals authority */
  const signalsCtx = await assembleSignalsContext();
  const signalsBySymbol = indexSignalsBySymbol(signalsCtx?.signalsV1);

  /* ENRICH POSITIONS — append-only */
  const enrichedPositions = basePositions.map(p => {
    const s = signalsBySymbol[p.symbol] || {};

    return {
      ...p,

      /* technical surface */
      technicals: s.technicals || null,

      /* signal primitives */
      signalDirection: s.direction || null,
      signalStrength: s.strength ?? null,
      signalConfidence: s.confidence ?? null,

      /* action intelligence hints */
      actionHint: s.actionHint || null,
      materiality: s.materiality ?? null,

      /* risk overlays */
      riskContext: signalsCtx?.riskSnapshot || null,

      /* conviction inputs */
      convictionInputs: {
        strength: s.strength ?? 0,
        confidence: s.confidence ?? 0,
        materiality: s.materiality ?? 0
      }
    };
  });

  return Object.freeze({
    contextAvailable: true,
    portfolioValue: valuation?.totals?.liveValue || 0,
    positions: enrichedPositions,
    totals: valuation?.totals || null,
    fetchedAt: valuation?.fetchedAt || null,
    signalsAvailable: signalsCtx?.available || false,
    source: "portfolio+signals-authority"
  });
}
