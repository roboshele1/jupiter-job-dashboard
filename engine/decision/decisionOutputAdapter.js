export function adaptDecisionOutput(decisions) {
  if (!Array.isArray(decisions)) {
    throw new Error('Invalid decisions payload');
  }

  const alerts = decisions.map(d => ({
    scope: d.scope,
    symbol: d.symbol,
    action: d.action,
    conviction: d.conviction,
    rank: d.rank,
    expiresAt: d.expiresAt,
    rationale: d.rationale
  }));

  return {
    count: alerts.length,
    alerts
  };
}

