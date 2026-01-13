/**
 * CAPITAL TRAJECTORY ENGINE V2
 * ============================
 * Purpose:
 * - Answer: “Given my actual capital, allocations, and time — what is mathematically possible?”
 * - Answer: “What conditions are REQUIRED to reach X in Y time?”
 * - Deterministic, portfolio-authoritative, UI-agnostic
 *
 * NON-GOALS:
 * - No execution
 * - No advice
 * - No forecasting guarantees
 * - No renderer assumptions
 */

import { runGrowthEngine } from "../growthEngine.js";

/* ======================================================
   HELPERS
====================================================== */

function classifyFeasibility(requiredCAGR, expectedReturn, aggressiveReturn) {
  if (requiredCAGR > aggressiveReturn) return "EXTREME";
  if (requiredCAGR > expectedReturn) return "OUT_OF_BOUNDS";
  return "FEASIBLE";
}

function compoundForward(value, annualCAGR, months) {
  const monthly = Math.pow(1 + annualCAGR, 1 / 12) - 1;
  let v = value;
  for (let i = 0; i < months; i++) v *= 1 + monthly;
  return Math.round(v);
}

/* ======================================================
   ENGINE
====================================================== */

export async function runCapitalTrajectoryV2({
  portfolioSnapshot,
  horizonMonths,
  assumptions = {},
  scenarios = {}
} = {}) {
  if (!portfolioSnapshot?.totalValue || !horizonMonths) {
    throw new Error("CAPITAL_TRAJECTORY_V2_INVALID_INPUT");
  }

  const {
    expectedReturn = 0.10,
    aggressiveReturn = 0.18
  } = assumptions;

  const {
    targetValue = null,
    candidateInjection = null
  } = scenarios;

  const startingValue = portfolioSnapshot.totalValue;

  /* ----------------------------------
     BASELINE — NO ACTION TRAJECTORY
  ---------------------------------- */
  const baselineTrajectory = {
    expected: compoundForward(startingValue, expectedReturn, horizonMonths),
    aggressive: compoundForward(startingValue, aggressiveReturn, horizonMonths)
  };

  /* ----------------------------------
     FEASIBLE ENVELOPE
  ---------------------------------- */
  const feasibleEnvelope = {
    lowerBound: baselineTrajectory.expected,
    upperBound: baselineTrajectory.aggressive
  };

  /* ----------------------------------
     REQUIRED CONDITIONS (IF TARGET)
  ---------------------------------- */
  let requiredConditions = null;
  let verdict = {
    feasible: true,
    classification: "FEASIBLE",
    explanation: "Baseline trajectory is feasible."
  };

  if (targetValue) {
    const requiredCAGR =
      Math.pow(targetValue / startingValue, 12 / horizonMonths) - 1;

    const classification = classifyFeasibility(
      requiredCAGR,
      expectedReturn,
      aggressiveReturn
    );

    requiredConditions = {
      targetValue,
      requiredCAGR,
      annualizedPct: +(requiredCAGR * 100).toFixed(2),
      months: horizonMonths
    };

    verdict = {
      feasible: classification === "FEASIBLE",
      classification,
      explanation:
        classification === "FEASIBLE"
          ? "Target is mathematically reachable under standard assumptions."
          : classification === "OUT_OF_BOUNDS"
          ? "Target requires elevated risk or concentration."
          : "Target requires historically extreme conditions."
    };
  }

  /* ----------------------------------
     WHAT-IF: CANDIDATE INJECTION
  ---------------------------------- */
  let injectionImpact = null;

  if (candidateInjection?.amount && candidateInjection?.assumedCAGR) {
    const injectedFutureValue = compoundForward(
      candidateInjection.amount,
      candidateInjection.assumedCAGR,
      horizonMonths
    );

    injectionImpact = {
      symbol: candidateInjection.symbol,
      injectedAmount: candidateInjection.amount,
      assumedCAGR: candidateInjection.assumedCAGR,
      futureValue: injectedFutureValue,
      deltaVsBaseline:
        injectedFutureValue - baselineTrajectory.expected
    };
  }

  /* ----------------------------------
     STRESS / BOUNDS (LIGHT)
  ---------------------------------- */
  const stressBounds = {
    drawdownScenario: compoundForward(startingValue, expectedReturn * 0.6, horizonMonths),
    stagnationScenario: startingValue
  };

  return Object.freeze({
    contract: "CAPITAL_TRAJECTORY_V2",
    authority: "PORTFOLIO_SNAPSHOT",
    timestamp: Date.now(),

    baselineTrajectory,
    feasibleEnvelope,
    requiredConditions,
    injectionImpact,
    stressBounds,
    verdict,

    notes: Object.freeze([
      "All outputs are deterministic.",
      "No recommendations are issued.",
      "Portfolio snapshot is the sole authority.",
      "Used for trajectory and what-if analysis only."
    ])
  });
}
