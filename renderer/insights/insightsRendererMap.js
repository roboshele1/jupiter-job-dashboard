/**
 * INSIGHTS RENDERER MAP — PHASE 1E
 * Deterministic, read-only UI adapter
 */

export function mapInsightsToUI(insights) {
  if (!insights || !insights.snapshot || !insights.snapshot.available) {
    return {
      mode: 'observer',
      headline: 'Insights unavailable',
      body: 'Waiting for a complete portfolio snapshot.',
      footer: 'Observer mode'
    };
  }

  if (!insights.signals || !insights.signals.available) {
    return {
      mode: 'observer',
      headline: 'Signals withheld',
      body: 'Signals are unavailable due to incomplete inputs.',
      footer: 'Observer mode'
    };
  }

  return {
    mode: 'ready',
    headline: 'Portfolio Insights',
    body: {
      totalValue: insights.snapshot.totalValue,
      dailyPL: insights.snapshot.dailyPL,
      dailyPLPct: insights.snapshot.dailyPLPct,
      concentrationRisk: insights.signals.risk.concentrationRisk,
      largestHolding: insights.signals.risk.largestHolding,
      concentrationPct: insights.signals.risk.concentrationPct
    },
    footer: 'Insights engine v1 (read-only)'
  };
}

