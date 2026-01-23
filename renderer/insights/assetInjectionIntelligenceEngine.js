// renderer/insights/assetInjectionIntelligenceEngine.js
// ASSET INJECTION INTELLIGENCE (read-only, deterministic)
// ------------------------------------------------------
// Pure math. No IPC. No side effects.

function asNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function round2(x) {
  return Math.round(asNumber(x, 0) * 100) / 100;
}

function powSafe(base, exp) {
  const b = asNumber(base, 0);
  const e = asNumber(exp, 0);
  return Math.pow(b, e);
}

export function runAssetInjectionIntelligence(input = {}) {
  const symbol = String(input.symbol || "").trim().toUpperCase() || "UNKNOWN";

  const startingAmount = asNumber(input.startingAmount, 0);
  const targetAmount = asNumber(input.targetAmount, 0);

  // ✅ required by you: time horizon in months
  const horizonMonths = asNumber(input.horizonMonths, 0);

  const assumedCagrPct = asNumber(input.assumedCagrPct, 0);
  const r = assumedCagrPct / 100;
  const tYears = horizonMonths / 12;

  // Projected FV from startingAmount
  const projectedValue =
    startingAmount > 0 && horizonMonths > 0
      ? round2(startingAmount * powSafe(1 + r, tYears))
      : 0;

  // How much starting capital is mathematically required to hit targetAmount?
  const requiredStartingCapital =
    targetAmount > 0 && horizonMonths > 0
      ? round2(targetAmount / powSafe(1 + r, tYears))
      : 0;

  // Additional capital needed today (if startingAmount < requiredStartingCapital)
  const requiredAdditionalNow = round2(Math.max(0, requiredStartingCapital - startingAmount));

  // Gap at horizon if you do nothing beyond startingAmount
  const gapAtHorizon = round2(Math.max(0, targetAmount - projectedValue));

  const feasibility =
    gapAtHorizon <= 0 ? "ON_TRACK" : gapAtHorizon / Math.max(targetAmount, 1) <= 0.25 ? "CLOSE" : "OFF_TRACK";

  const interpretation =
    feasibility === "ON_TRACK"
      ? "At the assumed CAGR, the asset alone can reach the target."
      : feasibility === "CLOSE"
      ? "At the assumed CAGR, the asset is close but still short of the target."
      : "At the assumed CAGR, the asset is materially short of the target.";

  return {
    symbol,
    startingAmount,
    targetAmount,
    horizonMonths,
    assumedCagrPct,
    projectedValue,
    gapAtHorizon,
    requiredStartingCapital,
    requiredAdditionalNow,
    feasibility,
    interpretation,
    guarantees: {
      deterministic: true,
      readOnly: true,
      assetScoped: true,
      noAdvice: true,
    },
  };
}
