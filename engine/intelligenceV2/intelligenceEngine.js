// engine/intelligenceV2/intelligenceEngine.js
// V2 Shadow Intelligence — Node-only
// ---------------------------------
// HARD RULES:
// - Pure functions only
// - No imports
// - No async
// - No I/O
// - No side effects
// - Deterministic output
// - Read-only reasoning layer

export function explain(payload = {}) {
  const { scope, subject } = payload;
  const timestamp = Date.now();

  if (scope === "market") {
    if (subject === "BTC") {
      return {
        scope,
        subject,
        explanation:
          "Bitcoin is classified as VOLATILE due to elevated variance and sensitivity to risk-on macro conditions.",
        factors: [
          "price variance",
          "risk-on sentiment",
          "crypto liquidity sensitivity"
        ],
        confidence: "LOW",
        timestamp
      };
    }

    return {
      scope,
      subject,
      explanation:
        "Market context reflects mixed macro conditions with no dominant directional regime.",
      factors: ["macro dispersion", "cross-asset divergence"],
      confidence: "LOW",
      timestamp
    };
  }

  if (scope === "portfolio") {
    return {
      scope,
      subject,
      explanation:
        "Portfolio posture reflects concentration across correlated assets rather than isolated single-name risk.",
      factors: ["asset concentration", "correlation overlap"],
      confidence: "MEDIUM",
      timestamp
    };
  }

  return {
    scope,
    subject,
    explanation: "Unsupported intelligence scope.",
    factors: [],
    confidence: "LOW",
    timestamp
  };
}
