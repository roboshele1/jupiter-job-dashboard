/**
 * Capital Reallocation Playbook Engine — V1
 * -----------------------------------------
 * Translates portfolio intelligence into bounded capital actions.
 *
 * PURPOSE:
 * - Convert Rotation + Conviction + Drift into clear capital guidance
 * - Read-only, deterministic, portfolio-driven
 * - No execution, no advice, no mutation
 */

export function runCapitalReallocationPlaybook({
  rotationSurface = [],
  convictionEvolution = [],
  convictionCapitalDrift = [],
  regimeImpact = { regime: "UNKNOWN" },
}) {
  const convictionBySymbol = Object.fromEntries(
    convictionEvolution.map((c) => [c.symbol, c])
  );

  const driftBySymbol = Object.fromEntries(
    convictionCapitalDrift.map((d) => [d.symbol, d])
  );

  return rotationSurface.map((rot) => {
    const conviction = convictionBySymbol[rot.symbol] || {};
    const drift = driftBySymbol[rot.symbol] || {};

    let recommendedAction = "HOLD";
    let capitalBand = "0%";
    const constraints = [];

    /* =========================
       CORE TRANSLATION LOGIC
       ========================= */

    if (rot.action === "INCREASE") {
      recommendedAction = "ADD";
      capitalBand = "+2–4%";

      if (conviction.convictionZone === "CORE_ACCUMULATE") {
        capitalBand = "+3–6%";
      }

      if (regimeImpact.regime === "RISK_OFF") {
        capitalBand = "+1–2%";
        constraints.push("Risk-off regime caps aggressive allocation.");
      }
    }

    if (rot.action === "MAINTAIN") {
      recommendedAction = "HOLD";
      capitalBand = "±1%";
    }

    if (rot.action === "REDUCE") {
      recommendedAction = "TRIM";
      capitalBand = "−1–3%";

      if (drift.status === "DRIFT") {
        capitalBand = "−2–5%";
      }
    }

    /* =========================
       SAFETY CONSTRAINTS
       ========================= */

    if (drift.status === "DRIFT" && recommendedAction === "ADD") {
      recommendedAction = "HOLD";
      capitalBand = "0%";
      constraints.push(
        "Capital already exceeds conviction strength; add blocked."
      );
    }

    if (conviction.daysInState < 30 && recommendedAction === "ADD") {
      capitalBand = "+1%";
      constraints.push("Conviction not yet time-validated.");
    }

    if (constraints.length === 0) {
      constraints.push("No structural constraints detected.");
    }

    /* =========================
       FINAL OUTPUT
       ========================= */

    return {
      symbol: rot.symbol,
      recommendedAction,
      capitalBand,
      constraints,
      rationale: rot.rationale,
      guarantees: {
        deterministic: true,
        readOnly: true,
        portfolioDriven: true,
        noAdvice: true,
      },
    };
  });
}
