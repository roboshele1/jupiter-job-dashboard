/**
 * SCENARIO_STRESS_ENGINE
 * =====================
 * Phase G4.2 — Deterministic stress scenarios (math-only)
 *
 * PURPOSE
 * -------
 * - Stress-test growth assumptions without randomness
 * - Quantify impact of:
 *   • Lower CAGR
 *   • Delayed growth
 *   • Drawdown + recovery
 *
 * NON-GOALS
 * ---------
 * - No advice
 * - No forecasting
 * - No execution
 * - No mutation
 */

export const SCENARIO_STRESS_ENGINE_CONTRACT = {
  name: "SCENARIO_STRESS_ENGINE",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "ENGINE",
};

export function runScenarioStressEngine({
  startingValue,
  baseCAGR,
  months,
  stress = {},
} = {}) {
  if (
    typeof startingValue !== "number" ||
    typeof baseCAGR !== "number" ||
    typeof months !== "number"
  ) {
    return {
      contract: SCENARIO_STRESS_ENGINE_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  const years = months / 12;

  /* -----------------------------
     Stress 1 — Lower CAGR
  ----------------------------- */
  const stressedCAGR =
    typeof stress.lowerCAGR === "number"
      ? stress.lowerCAGR
      : baseCAGR * 0.75;

  const valueWithLowerCAGR =
    startingValue * Math.pow(1 + stressedCAGR, years);

  /* -----------------------------
     Stress 2 — Delayed Growth
  ----------------------------- */
  const delayYears = stress.delayYears || 0;
  const effectiveYears = Math.max(years - delayYears, 0);

  const valueWithDelay =
    startingValue * Math.pow(1 + baseCAGR, effectiveYears);

  /* -----------------------------
     Stress 3 — Drawdown + Recovery
  ----------------------------- */
  const drawdownPct =
    typeof stress.drawdownPct === "number"
      ? stress.drawdownPct
      : 0.30;

  const drawdownValue = startingValue * (1 - drawdownPct);

  const recoveryYears =
    typeof stress.recoveryYears === "number"
      ? stress.recoveryYears
      : years;

  const recoveredValue =
    drawdownValue * Math.pow(1 + baseCAGR, recoveryYears);

  return {
    contract: SCENARIO_STRESS_ENGINE_CONTRACT.name,
    status: "READY",
    outputs: {
      base: {
        startingValue,
        baseCAGR,
        years,
      },

      lowerCAGRStress: {
        stressedCAGR,
        finalValue: Math.round(valueWithLowerCAGR),
      },

      delayStress: {
        delayYears,
        finalValue: Math.round(valueWithDelay),
      },

      drawdownStress: {
        drawdownPct,
        postDrawdownValue: Math.round(drawdownValue),
        recoveredValue: Math.round(recoveredValue),
      },
    },
    explanations: [
      "Lower CAGR stress applies a reduced growth rate deterministically.",
      "Delay stress removes early compounding years.",
      "Drawdown stress models capital loss followed by recovery compounding.",
      "No randomness or behavioral assumptions were used.",
    ],
    timestamp: Date.now(),
  };
}
