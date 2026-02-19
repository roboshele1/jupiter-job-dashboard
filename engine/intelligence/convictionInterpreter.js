/**
 * Conviction Interpreter — Institutional Blended Model
 * ----------------------------------------------------
 * Deterministic, read-only interpretation layer.
 *
 * Inputs:
 * - systemState (awareness, decision, signals, risk, assetSystemState)
 * - positions (valuation + signal-enriched portfolio positions)
 *
 * Model:
 * - 40% portfolio performance vs cost basis
 * - 30% technical signal strength/materiality
 * - 30% trajectory alignment (risk + system posture)
 *
 * NO trading.
 * NO execution.
 * Interpretation only.
 */

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

/* ===============================
   PORTFOLIO PERFORMANCE FACTOR
   =============================== */
function portfolioFactor(p) {
  const pct = Number(p?.deltaPct) || 0;

  // normalize roughly between -100% → +100%
  const normalized = clamp((pct + 100) / 200);
  return normalized;
}

/* ===============================
   TECHNICAL FACTOR
   =============================== */
function technicalFactor(p) {
  const strength = Number(p?.convictionInputs?.strength) || 0;
  const confidence = Number(p?.convictionInputs?.confidence) || 0;
  const materiality = Number(p?.convictionInputs?.materiality) || 0;

  // simple blended tech surface
  return clamp((strength * 0.5) + (confidence * 0.3) + (materiality * 0.2));
}

/* ===============================
   TRAJECTORY / SYSTEM FACTOR
   =============================== */
function trajectoryFactor(systemState) {
  let score = 0.5;

  if (systemState?.decision?.systemPosture === "PRESSURED") {
    score -= 0.2;
  }

  if (systemState?.risk?.regime === "RISK_OFF") {
    score -= 0.2;
  }

  if (systemState?.signals?.available) {
    score += 0.1;
  }

  return clamp(score);
}

/* ===============================
   FINAL CONVICTION SCORE
   =============================== */
function computeConvictionScore(p, systemState) {
  const portfolio = portfolioFactor(p);
  const technical = technicalFactor(p);
  const trajectory = trajectoryFactor(systemState);

  return clamp(
    portfolio * 0.4 +
    technical * 0.3 +
    trajectory * 0.3
  );
}

/* ===============================
   STANCE CLASSIFICATION
   =============================== */
function classifyStance(score) {
  if (score >= 0.75) return "HIGH_CONVICTION_BUILD";
  if (score >= 0.55) return "BUILD";
  if (score >= 0.40) return "HOLD";
  return "DEFENSIVE";
}

/* ===============================
   PRESSURE CLASSIFICATION
   =============================== */
function classifyPressure(systemState) {
  if (systemState?.decision?.systemPosture === "PRESSURED") {
    return "ELEVATED";
  }
  if (systemState?.risk?.regime === "RISK_OFF") {
    return "HIGH";
  }
  return "NORMAL";
}

/* ===============================
   PUBLIC INTERFACE
   =============================== */
export function interpretConviction({ systemState, positions }) {
  if (!systemState || !Array.isArray(positions)) {
    return {
      available: false,
      convictions: [],
      systemConviction: "UNKNOWN"
    };
  }

  const convictions = positions.map(p => {
    const score = computeConvictionScore(p, systemState);

    return {
      symbol: p.symbol,
      stance: classifyStance(score),
      pressure: classifyPressure(systemState),
      score
    };
  });

  const avg =
    convictions.reduce((acc, c) => acc + c.score, 0) /
    (convictions.length || 1);

  return {
    available: true,
    convictions,
    systemConviction:
      avg >= 0.65
        ? "ACCELERATING_BUILD"
        : avg >= 0.45
        ? "STABLE_BUILD"
        : "DEFENSIVE_POSITIONING"
  };
}
