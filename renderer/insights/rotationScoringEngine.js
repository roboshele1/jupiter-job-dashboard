/**
 * Rotation Scoring Engine — V1
 * --------------------------------
 * Purpose:
 * Rank existing holdings for internal rotation decisions.
 *
 * NOT a scanner. NOT a signal.
 * Portfolio-driven. Deterministic. Read-only.
 *
 * Outputs:
 * - action: INCREASE | MAINTAIN | DE_RISK
 * - rotationScore (0–100)
 * - rationale (human-readable)
 */

export function runRotationScoringEngine({
  convictionEvolution = [],
  convictionCapitalDrift = [],
  exposure = {},
  regimeImpact = {}
}) {
  const bySymbol = {};

  // Index conviction evolution
  for (const row of convictionEvolution) {
    bySymbol[row.symbol] = {
      symbol: row.symbol,
      convictionZone: row.convictionZone,
      daysInState: row.daysInState ?? 0
    };
  }

  // Merge capital drift
  for (const row of convictionCapitalDrift) {
    if (!bySymbol[row.symbol]) {
      bySymbol[row.symbol] = { symbol: row.symbol };
    }
    bySymbol[row.symbol].capitalStatus = row.status;
    bySymbol[row.symbol].capitalWeightPct = row.capitalWeightPct;
  }

  const results = [];

  for (const symbol of Object.keys(bySymbol)) {
    const row = bySymbol[symbol];

    let score = 50;
    const reasons = [];

    // Conviction contribution
    if (row.convictionZone === "ACCUMULATE") {
      score += 20;
      reasons.push("Conviction strengthening under time pressure.");
    } else if (row.convictionZone === "CORE_ACCUMULATE") {
      score += 30;
      reasons.push("Long-duration conviction validated.");
    } else {
      score -= 5;
      reasons.push("No conviction escalation detected.");
    }

    // Capital alignment
    if (row.capitalStatus === "DRIFT") {
      score -= 15;
      reasons.push("Capital allocation misaligned with conviction.");
    } else if (row.capitalStatus === "ALIGNED") {
      score += 5;
      reasons.push("Capital aligned with conviction.");
    }

    // Regime adjustment
    if (regimeImpact?.regime === "RISK_OFF" && score > 65) {
      score -= 10;
      reasons.push("Risk-off regime tempers aggressive rotation.");
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Action mapping
    let action = "MAINTAIN";
    if (score >= 70) action = "INCREASE";
    else if (score <= 40) action = "DE_RISK";

    results.push({
      symbol,
      rotationScore: score,
      action,
      rationale: reasons.join(" "),
      guarantees: {
        deterministic: true,
        readOnly: true,
        portfolioDriven: true
      }
    });
  }

  return results;
}
