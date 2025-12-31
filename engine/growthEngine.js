/**
 * Growth Engine — V1
 * Contract-first, read-only growth reasoning layer
 *
 * Inputs:
 *  - portfolioSnapshot: {
 *      totalValue: number,
 *      equityExposure: number,   // %
 *      cryptoExposure: number,   // %
 *      holdingsCount: number
 *    }
 *  - riskPosture: {
 *      level: 'Low' | 'Moderate' | 'High',
 *      notes: string[]
 *    }
 *  - assumptions: {
 *      annualContribution?: number, // optional, default 0
 *      timeHorizonYears?: number[]  // optional, default [5,10,15]
 *    }
 *
 * Output:
 *  - growthProfile: {
 *      startingValue: number,
 *      impliedCAGR: number,
 *      projections: Array<{
 *        years: number,
 *        valueNoContribution: number,
 *        valueWithContribution: number
 *      }>,
 *      sensitivityNotes: string[],
 *      narrative: string
 *    }
 */

function compound(value, rate, years) {
  return value * Math.pow(1 + rate, years);
}

function projectWithContributions(start, annual, rate, years) {
  let total = start;
  for (let i = 0; i < years; i++) {
    total = (total + annual) * (1 + rate);
  }
  return total;
}

export function runGrowthEngine({
  portfolioSnapshot,
  riskPosture,
  assumptions = {}
}) {
  const {
    totalValue,
    equityExposure,
    cryptoExposure,
    holdingsCount
  } = portfolioSnapshot;

  const annualContribution = assumptions.annualContribution ?? 0;
  const horizons = assumptions.timeHorizonYears ?? [5, 10, 15];

  // Conservative implied CAGR logic (institutional framing)
  let impliedCAGR = 0.07;
  if (riskPosture.level === 'Moderate') impliedCAGR = 0.085;
  if (riskPosture.level === 'High') impliedCAGR = 0.11;

  const projections = horizons.map((years) => ({
    years,
    valueNoContribution: Number(
      compound(totalValue, impliedCAGR, years).toFixed(2)
    ),
    valueWithContribution: Number(
      projectWithContributions(
        totalValue,
        annualContribution,
        impliedCAGR,
        years
      ).toFixed(2)
    )
  }));

  const sensitivityNotes = [
    `Equity exposure at ${equityExposure}% increases upside volatility.`,
    `Crypto exposure at ${cryptoExposure}% materially amplifies drawdowns and convexity.`,
    `Holding count (${holdingsCount}) suggests concentration-driven outcomes.`,
    `Contribution rate matters more than CAGR in the first decade.`
  ];

  const narrative = `
At a starting value of $${totalValue.toLocaleString()},
this portfolio implicitly targets an annualized growth rate of ${(impliedCAGR * 100).toFixed(1)}%.
Risk posture is assessed as ${riskPosture.level}, meaning outcomes will be shaped
more by volatility tolerance and discipline than timing.
Long-term growth is contribution-sensitive in early years and allocation-sensitive later.
`.trim();

  return {
    growthProfile: {
      startingValue: totalValue,
      impliedCAGR,
      projections,
      sensitivityNotes,
      narrative
    }
  };
}

