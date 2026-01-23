// renderer/insights/portfolioGrowthIntelligenceEngine.js
// PORTFOLIO GROWTH INTELLIGENCE (read-only, deterministic)
// -------------------------------------------------------
// Pure mathematical analysis. No IPC. No side effects.

function asNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function runPortfolioGrowthIntelligence(input = {}) {
  const startingValue = asNumber(input.startingValue, 0);
  const targetValue = asNumber(input.targetValue, 0);
  const horizonMonths = asNumber(input.horizonMonths, 0);

  const expectedReturnPct = asNumber(input.expectedReturnPct, 0);
  const aggressiveReturnPct = asNumber(input.aggressiveReturnPct, 0);

  let requiredCAGR = 0;

  if (startingValue > 0 && targetValue > 0 && horizonMonths > 0) {
    requiredCAGR =
      (Math.pow(targetValue / startingValue, 12 / horizonMonths) - 1) * 100;
  }

  let feasibility = "EXTREME";
  let interpretation =
    "The required return is historically uncommon and implies elevated risk.";

  if (requiredCAGR <= expectedReturnPct) {
    feasibility = "FEASIBLE";
    interpretation =
      "The target is achievable within normal long-term return expectations.";
  } else if (requiredCAGR <= aggressiveReturnPct) {
    feasibility = "OUT_OF_BOUNDS";
    interpretation =
      "The target requires returns above expectations and implies higher risk.";
  }

  return {
    requiredCAGR,
    feasibility,
    interpretation,
    guarantees: {
      deterministic: true,
      readOnly: true,
      portfolioScoped: true,
      noAdvice: true,
    },
  };
}
