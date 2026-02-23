/**
 * GLOBAL_MARKET_INTELLIGENCE_V1
 * Live regime signal derived from marketMonitorEngine.
 * Falls back to NEUTRAL if snapshot unavailable.
 */

import { getMarketMonitorSnapshot, getLastMarketMonitorSnapshot } from "../marketMonitorEngine.js";

function buildImplications(regimeState) {
  if (regimeState === "RISK_ON" || regimeState === "MILD_RISK_ON") {
    return {
      favoredAssets:   ["Equities", "Growth", "Crypto"],
      pressuredAssets: ["Cash", "Defensive"],
    };
  }
  if (regimeState === "RISK_OFF" || regimeState === "MILD_RISK_OFF") {
    return {
      favoredAssets:   ["Cash", "Defensive"],
      pressuredAssets: ["High Beta", "Speculative"],
    };
  }
  return {
    favoredAssets:   ["Selective Risk"],
    pressuredAssets: ["Indiscriminate Exposure"],
  };
}

function buildSignals(snapshot) {
  if (!snapshot) return {
    equityTrend: "UNKNOWN",
    volatility:  "UNKNOWN",
    rates:       "UNKNOWN",
    usd:         "UNKNOWN",
    cryptoBeta:  "UNKNOWN",
  };

  const spyMomentum = snapshot.indices?.SPY?.momentum ?? 0;
  const vixProxy    = snapshot.volatility?.vixProxy   ?? 0;
  const breadth     = snapshot.breadth?.sectorPctAboveOpen ?? 50;

  return {
    equityTrend: spyMomentum > 0.1 ? "UP" : spyMomentum < -0.1 ? "DOWN" : "FLAT",
    volatility:  vixProxy > 1.5 ? "HIGH" : vixProxy > 0.8 ? "ELEVATED" : "LOW",
    rates:       "UNKNOWN",   // not yet wired — requires macro data source
    usd:         "UNKNOWN",   // not yet wired
    cryptoBeta:  "HIGH",      // BTC correlation assumed high until decoupling detected
    breadthPct:  breadth,
  };
}

export async function getGlobalMarketIntelligence() {
  const timestamp = Date.now();

  let snapshot = getLastMarketMonitorSnapshot();

  // If no cached snapshot, fetch live now
  if (!snapshot) {
    try {
      snapshot = await getMarketMonitorSnapshot();
    } catch (err) {
      console.error("[marketIntelligence] Live fetch failed:", err.message);
    }
  }

  const regimeState  = snapshot?.regime?.signal  ?? "NEUTRAL";
  const regimeBasis  = snapshot?.regime?.basis    ?? "No live data";
  const confidence   = snapshot
    ? (regimeState === "RISK_ON" || regimeState === "RISK_OFF" ? 0.80 : 0.60)
    : 0.40;

  const signals     = buildSignals(snapshot);
  const implications = buildImplications(regimeState);

  return {
    contract: "GLOBAL_MARKET_INTELLIGENCE_V1",
    timestamp,
    regime: {
      state:      regimeState,
      confidence,
      basis:      regimeBasis,
      live:       !!snapshot,
    },
    signals,
    implications: {
      ...implications,
      notes: [regimeBasis],
    },
  };
}
