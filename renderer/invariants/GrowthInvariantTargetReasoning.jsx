import { useMemo } from "react";

/**
 * Invariant 1 — Candidate Target Feasibility
 * -----------------------------------------
 * Renderer-only explanatory invariant.
 *
 * PURPOSE:
 * Evaluate whether a candidate allocation, at an assumed CAGR,
 * can plausibly reach a user-defined target value over the
 * global time horizon.
 *
 * HARD RULES:
 * - No IPC
 * - No mutation
 * - No portfolio math
 * - No UI side effects
 * - Pure deterministic math
 */

export default function GrowthInvariantTargetReasoning({
  candidateAmount,
  assumedCAGR,
  candidateTargetValue,
  months,
}) {
  const analysis = useMemo(() => {
    if (
      !candidateAmount ||
      !assumedCAGR ||
      !candidateTargetValue ||
      !months
    ) {
      return null;
    }

    const futureValue =
      candidateAmount * Math.pow(1 + assumedCAGR, months / 12);

    const gap = futureValue - candidateTargetValue;

    let feasibility = "TARGET_UNREALISTIC";

    if (futureValue >= candidateTargetValue) {
      feasibility = "TARGET_FEASIBLE";
    } else if (futureValue >= candidateTargetValue * 0.85) {
      feasibility = "TARGET_STRETCH";
    }

    return {
      futureValue,
      targetValue: candidateTargetValue,
      gap,
      feasibility,
    };
  }, [candidateAmount, assumedCAGR, candidateTargetValue, months]);

  return analysis;
}
