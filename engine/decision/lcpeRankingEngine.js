// engine/decision/lcpeRankingEngine.js
// Ranks candidates by CES (Compound Efficiency Score) — pure math, no allocation awareness.

export function rankByLCPE(candidates, marketRegime) {
  const regimeMult = marketRegime === 'RISK_ON'  ? 1.15
                   : marketRegime === 'RISK_OFF' ? 0.80
                   : 1.0;

  return candidates
    .map(c => {
      const ces = (
        (c.trajectoryScore ?? 0) * 0.40 +
        (c.conviction      ?? 0) * 0.35 +
        (c.momentumScore   ?? 0) * 0.25
      );
      return {
        symbol:    c.symbol,
        ces:       parseFloat((ces * regimeMult).toFixed(4)),
        cagr:      c.projectedCAGR ?? null,
        isHeld:    c.isHeld ?? false,
        rawScores: {
          trajectory: c.trajectoryScore ?? 0,
          conviction: c.conviction      ?? 0,
          momentum:   c.momentumScore   ?? 0,
        }
      };
    })
    .sort((a, b) => b.ces - a.ces)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}
