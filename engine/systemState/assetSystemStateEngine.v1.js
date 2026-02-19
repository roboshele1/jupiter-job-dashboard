// assetSystemStateEngine.v1.js
// deterministic asset posture engine

export function buildAssetSystemStateV1({ holdings = [], signalsBySymbol = {}, portfolioContext = {} }) {
  return (holdings || []).map(h => {
    const sig = signalsBySymbol[h.symbol] || {};

    let actionHint = "Hold — maintain and monitor";

    if (sig.confidence >= 0.75 && sig.materiality === "HIGH") {
      actionHint = "Accumulate";
    }

    if (sig.riskContext === "ELEVATED") {
      actionHint = "De-risk / monitor closely";
    }

    return {
      symbol: h.symbol,
      confidence: sig.confidence ?? "N/A",
      materiality: sig.materiality ?? "NORMAL",
      growthImpact: sig.growthImpact ?? "UNKNOWN",
      riskContext: sig.riskContext ?? "NORMAL",
      actionHint
    };
  });
}
