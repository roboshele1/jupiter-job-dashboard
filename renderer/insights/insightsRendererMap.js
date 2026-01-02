/**
 * INSIGHTS RENDERER MAP — PHASE 1F
 * Read-only mapping from insights snapshot → UI-friendly values
 */

export function mapInsightsForRender(insights) {
  if (!insights || !insights.snapshot?.available) {
    return {
      status: "partial",
      totalValue: null,
      generatedAt: null,
      signalsAvailable: false
    };
  }

  const risk = insights.signals?.risk ?? null;
  const performance = insights.signals?.performance ?? null;

  return {
    status: insights.meta.status,
    generatedAt: insights.meta.generatedAt,
    totalValue: insights.snapshot.totalValue,

    signalsAvailable: insights.signals?.available === true,

    largestHolding: risk?.largestHolding ?? null,
    concentrationPct: risk?.concentrationPct ?? null,

    dailyPL: performance?.dailyPL ?? null,
    dailyPLPct: performance?.dailyPLPct ?? null
  };
}

