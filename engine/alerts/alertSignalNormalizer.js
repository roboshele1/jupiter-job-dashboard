// engine/alerts/alertSignalNormalizer.js
// Jupiter — Alert Signal Normalizer
// Purpose: unify Discovery, Portfolio, and Drift outputs into ONE action language

function normalizeAction({ discoveryAction, portfolioSignal, driftState }) {
  // Priority order:
  // 1) Portfolio reinforcement
  // 2) Discovery conviction
  // 3) Drift risk

  // ----------------------------
  // PORTFOLIO LANGUAGE
  // ----------------------------
  if (portfolioSignal) {
    if (portfolioSignal === "ACCUMULATE") return "ACCUMULATE";
    if (portfolioSignal === "HOLD STRENGTHENING") return "HOLD";
    if (portfolioSignal === "WEAKENING") return "TRIM WATCH";
  }

  // ----------------------------
  // DISCOVERY LANGUAGE
  // ----------------------------
  if (discoveryAction) {
    if (discoveryAction === "STRONG BUY") return "STRONG ACCUMULATE";
    if (discoveryAction === "BUY") return "ACCUMULATE";
    if (discoveryAction === "HOLD") return "HOLD";
  }

  // ----------------------------
  // DRIFT LANGUAGE
  // ----------------------------
  if (driftState) {
    if (driftState === "HIGH") return "RISK";
  }

  return "HOLD";
}

function normalizeSignals({
  discoverySignals = [],
  portfolioSignals = [],
  driftSignals = []
}) {
  const normalized = [];

  const portfolioMap = {};
  portfolioSignals.forEach(p => {
    portfolioMap[p.symbol] = p;
  });

  const driftMap = {};
  driftSignals.forEach(d => {
    driftMap[d.symbol] = d;
  });

  discoverySignals.forEach(d => {
    const portfolio = portfolioMap[d.symbol];
    const drift = driftMap[d.symbol];

    const finalAction = normalizeAction({
      discoveryAction: d.action,
      portfolioSignal: portfolio?.signal,
      driftState: drift?.severity
    });

    normalized.push({
      symbol: d.symbol,
      finalAction,
      conviction: d.conviction ?? portfolio?.conviction ?? 0,
      rank: d.rank ?? null,
      regime: d.regime ?? portfolio?.regime ?? "UNKNOWN",
      trajectory: d.trajectory ?? portfolio?.trajectory ?? null,
      source: portfolio ? "PORTFOLIO+DISCOVERY" : "DISCOVERY"
    });
  });

  // Include portfolio-only names not surfaced by discovery
  portfolioSignals.forEach(p => {
    if (!normalized.find(n => n.symbol === p.symbol)) {
      normalized.push({
        symbol: p.symbol,
        finalAction: normalizeAction({
          portfolioSignal: p.signal
        }),
        conviction: p.conviction ?? 0,
        rank: null,
        regime: p.regime ?? "UNKNOWN",
        trajectory: p.trajectory ?? null,
        source: "PORTFOLIO"
      });
    }
  });

  return normalized;
}

module.exports = {
  normalizeSignals
};
