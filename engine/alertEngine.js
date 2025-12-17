/**
 * JUPITER Alert Engine
 * Phase H — Tiered, engine-first alerts
 *
 * Produces alert objects ONLY.
 * No UI. No IPC. No side effects.
 */

const DEFAULT_THRESHOLDS = {
  // Tier 1 — Critical
  DAILY_DRAWDOWN: -0.035,          // -3.5%
  PEAK_DRAWDOWN: -0.10,             // -10%
  MAX_CONCENTRATION: 0.35,          // 35%
  MAX_STRESS_LOSS: -0.25,           // -25%

  // Tier 2 — Awareness
  ASSET_DRIFT: 0.05,                // ±5%
  CLASS_DRIFT: 0.075,               // ±7.5%
  DOMINANT_RISK: 0.40,               // 40%
  DOMINANT_PNL: 0.50                // 50%
};

function createAlert({
  tier,
  category,
  code,
  message,
  metrics
}) {
  return {
    tier,
    category,
    code,
    message,
    metrics,
    timestamp: new Date().toISOString()
  };
}

/**
 * Main alert evaluation entrypoint
 */
function evaluateAlerts({
  portfolioSnapshot,
  previousSnapshot = null,
  stressSnapshot = null,
  targets = {},
  thresholds = DEFAULT_THRESHOLDS
}) {
  const alerts = [];

  const totals = portfolioSnapshot.totals || {};
  const rows = portfolioSnapshot.rows || [];

  /* =========================
     Tier 1 — Critical Alerts
     ========================= */

  // Daily drawdown
  if (totals.dailyChangePct != null &&
      totals.dailyChangePct <= thresholds.DAILY_DRAWDOWN) {
    alerts.push(createAlert({
      tier: 1,
      category: "PORTFOLIO",
      code: "DAILY_DRAWDOWN",
      message: "Portfolio daily drawdown breached threshold",
      metrics: {
        dailyChangePct: totals.dailyChangePct
      }
    }));
  }

  // Peak-to-trough drawdown
  if (totals.drawdownFromPeak != null &&
      totals.drawdownFromPeak <= thresholds.PEAK_DRAWDOWN) {
    alerts.push(createAlert({
      tier: 1,
      category: "PORTFOLIO",
      code: "PEAK_DRAWDOWN",
      message: "Portfolio peak drawdown breached threshold",
      metrics: {
        drawdownFromPeak: totals.drawdownFromPeak
      }
    }));
  }

  // Concentration breach
  rows.forEach(row => {
    if (row.weight != null &&
        row.weight >= thresholds.MAX_CONCENTRATION) {
      alerts.push(createAlert({
        tier: 1,
        category: "CONCENTRATION",
        code: "ASSET_CONCENTRATION",
        message: `${row.symbol} concentration exceeds limit`,
        metrics: {
          symbol: row.symbol,
          weight: row.weight
        }
      }));
    }
  });

  // Stress scenario breach
  if (stressSnapshot &&
      stressSnapshot.worstCasePct != null &&
      stressSnapshot.worstCasePct <= thresholds.MAX_STRESS_LOSS) {
    alerts.push(createAlert({
      tier: 1,
      category: "RISK",
      code: "STRESS_BREACH",
      message: "Worst-case stress loss exceeds tolerance",
      metrics: {
        worstCasePct: stressSnapshot.worstCasePct
      }
    }));
  }

  /* =========================
     Tier 2 — Awareness Alerts
     ========================= */

  // Allocation drift
  rows.forEach(row => {
    const target = targets[row.symbol];
    if (target != null && row.weight != null) {
      const drift = row.weight - target;
      if (Math.abs(drift) >= thresholds.ASSET_DRIFT) {
        alerts.push(createAlert({
          tier: 2,
          category: "ALLOCATION",
          code: "ASSET_DRIFT",
          message: `${row.symbol} allocation drifted from target`,
          metrics: {
            symbol: row.symbol,
            drift
          }
        }));
      }
    }
  });

  // Dominant PnL contributor
  if (totals.topPnlContributor &&
      totals.topPnlContributionPct >= thresholds.DOMINANT_PNL) {
    alerts.push(createAlert({
      tier: 2,
      category: "PERFORMANCE",
      code: "DOMINANT_PNL",
      message: "Single asset dominated daily PnL",
      metrics: {
        symbol: totals.topPnlContributor,
        contributionPct: totals.topPnlContributionPct
      }
    }));
  }

  /* =========================
     Tier 3 — Silent Logs
     ========================= */

  alerts.push(createAlert({
    tier: 3,
    category: "SNAPSHOT",
    code: "DAILY_SUMMARY",
    message: "Daily portfolio summary logged",
    metrics: {
      totalValue: totals.marketValue,
      dailyChangePct: totals.dailyChangePct
    }
  }));

  return alerts;
}

module.exports = {
  evaluateAlerts,
  DEFAULT_THRESHOLDS
};

