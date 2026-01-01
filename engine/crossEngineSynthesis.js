/**
 * Cross-Engine Synthesis (Phase 4)
 * --------------------------------
 * Purpose:
 * - Combine outputs from Risk Centre, Growth Engine, and Chat Reasoning
 * - Produce a unified, read-only synthesis object
 *
 * Constraints:
 * - NO UI
 * - NO IPC
 * - NO mutations
 * - NO recommendations or actions
 * - Deterministic, pure functions only
 */

export function synthesizeEngines({
  riskProfile,
  riskDrivers,
  breakOrder,
  growthFeasibility,
  portfolioReasoning,
}) {
  const tensions = deriveTensions({
    riskDrivers,
    growthFeasibility,
  });

  const confirmations = deriveConfirmations({
    riskDrivers,
    portfolioReasoning,
  });

  const blindSpots = deriveBlindSpots({
    riskProfile,
    growthFeasibility,
    portfolioReasoning,
  });

  return {
    system: {
      phase: 4,
      mode: "observer",
      synthesis: "cross-engine",
    },

    inputs: {
      risk: {
        profileAvailable: Boolean(riskProfile),
        driversAvailable: Boolean(riskDrivers),
        breakOrderAvailable: Array.isArray(breakOrder),
      },
      growth: {
        feasibilityAvailable: Boolean(growthFeasibility),
      },
      chat: {
        reasoningAvailable: Boolean(portfolioReasoning),
      },
    },

    synthesis: {
      dominantRiskDriver: riskDrivers?.primary ?? null,

      firstFailureMode: breakOrder?.[0]?.label ?? null,

      growthVsRiskAlignment:
        growthFeasibility?.classification === "WITHIN_EXPECTATION"
          ? "aligned"
          : "misaligned",

      tensions,
      confirmations,
      blindSpots,

      narrative: buildNarrative({
        riskDrivers,
        breakOrder,
        growthFeasibility,
        portfolioReasoning,
        tensions,
      }),
    },

    invariants: {
      readOnly: true,
      uiUntouched: true,
      ipcUnused: true,
      mainJsUntouched: true,
    },
  };
}

/* =========================
   DERIVATION HELPERS
   ========================= */

function deriveTensions({ riskDrivers, growthFeasibility }) {
  const items = [];

  if (
    riskDrivers?.primary === "single_name_concentration" &&
    growthFeasibility?.classification === "OUT_OF_BOUNDS"
  ) {
    items.push(
      "Growth target depends on returns while portfolio risk is already concentrated."
    );
  }

  if (
    riskDrivers?.primary === "asset_class_imbalance" &&
    growthFeasibility?.classification === "STRETCH"
  ) {
    items.push(
      "Growth stretch exists alongside asset-class imbalance."
    );
  }

  return items;
}

function deriveConfirmations({ riskDrivers, portfolioReasoning }) {
  const items = [];

  if (
    riskDrivers?.primary === "single_name_concentration" &&
    portfolioReasoning?.concentration?.summary
  ) {
    items.push(
      "Risk engine and reasoning both highlight concentration visibility."
    );
  }

  if (
    riskDrivers?.primary === "tail_risk" &&
    portfolioReasoning?.diversification?.summary
  ) {
    items.push(
      "Long-tail structure acknowledged across engines."
    );
  }

  return items;
}

function deriveBlindSpots({
  riskProfile,
  growthFeasibility,
  portfolioReasoning,
}) {
  const items = [];

  if (!riskProfile) {
    items.push("Risk profile not supplied to synthesis layer.");
  }

  if (!growthFeasibility) {
    items.push("Growth feasibility absent; alignment cannot be assessed.");
  }

  if (!portfolioReasoning) {
    items.push("Chat reasoning unavailable; narrative incomplete.");
  }

  return items;
}

/**
 * Internal narrative builder
 * Explanatory only — no advice, no scoring
 */
function buildNarrative({
  riskDrivers,
  breakOrder,
  growthFeasibility,
  portfolioReasoning,
  tensions,
}) {
  const parts = [];

  if (riskDrivers?.primary) {
    parts.push(
      `Primary portfolio risk driver identified as "${riskDrivers.primary}".`
    );
  }

  if (breakOrder?.length > 0) {
    parts.push(`First stress failure likely from: ${breakOrder[0].label}.`);
  }

  if (growthFeasibility?.classification) {
    parts.push(
      `Growth goal feasibility classified as "${growthFeasibility.classification}".`
    );
  }

  if (tensions?.length > 0) {
    parts.push("Tensions detected between growth ambition and risk posture.");
  }

  if (portfolioReasoning?.system?.mode === "observer") {
    parts.push("All interpretations are descriptive and observer-only.");
  }

  return parts.join(" ");
}

