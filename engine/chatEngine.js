/**
 * JUPITER Chat v0 Engine
 * Read-only, engine-grounded analyst
 *
 * Inputs ONLY:
 * - portfolio snapshot
 * - allocation / rebalance output
 * - alerts (Phase H)
 *
 * No predictions. No advice. No external data.
 */

function respond({ question, portfolioSnapshot, rebalanceSnapshot = null }) {
  if (!question || typeof question !== "string") {
    return refuse("Invalid question");
  }

  const q = question.toLowerCase();

  // ---- Explain Changes ----
  if (q.includes("why") && q.includes("portfolio")) {
    const { totals } = portfolioSnapshot;
    return ok([
      `Portfolio change today: ${(totals.dailyChangePct * 100).toFixed(2)}%`,
      totals.topPnlContributor
        ? `Top contributor: ${totals.topPnlContributor} (${(totals.topPnlContributionPct * 100).toFixed(1)}%)`
        : "PnL attribution unavailable"
    ]);
  }

  // ---- Summarize Risk ----
  if (q.includes("biggest risk") || q.includes("risk")) {
    const tier1 = (portfolioSnapshot.alerts || []).filter(a => a.tier === 1);
    if (tier1.length === 0) {
      return ok(["No critical risk alerts detected."]);
    }
    return ok(tier1.map(a => `${a.code}: ${a.message}`));
  }

  // ---- Clarify Rebalance ----
  if (q.includes("rebalance")) {
    if (!rebalanceSnapshot) {
      return refuse("Rebalance data not available");
    }
    const actions = rebalanceSnapshot.actions || [];
    if (actions.length === 0) {
      return ok(["No rebalance actions required."]);
    }
    return ok(
      actions.map(a =>
        `${a.symbol}: ${a.action} ${a.deltaValue >= 0 ? "+" : ""}$${a.deltaValue}`
      )
    );
  }

  // ---- Scoped Hypotheticals ----
  if (q.includes("what if")) {
    return refuse("Hypotheticals require defined stress inputs");
  }

  return refuse("Question outside scope of JUPITER v0");
}

function ok(lines) {
  return {
    status: "ok",
    response: Array.isArray(lines) ? lines.join("\n") : String(lines)
  };
}

function refuse(reason) {
  return {
    status: "refuse",
    response: reason
  };
}

module.exports = {
  respond
};

