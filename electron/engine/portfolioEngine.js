// ~/JUPITER/electron/engine/portfolioEngine.js

/*
Phase 3A — Intelligence Depth
Portfolio Intelligence Engine

Purpose:
- Aggregate portfolio-wide intelligence
- Detect dominance, imbalance, and opportunity concentration
- Feed Home/Dashboard synthesis later
*/

export function analyzePortfolio(holdings = []) {
  if (!holdings.length) {
    return {
      totalValue: 0,
      concentrationFlag: false,
      dominantSymbol: null,
      notes: ["Portfolio is empty."]
    };
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  let dominant = null;
  let maxAlloc = 0;

  holdings.forEach(h => {
    const alloc = h.value / totalValue;
    if (alloc > maxAlloc) {
      maxAlloc = alloc;
      dominant = h.symbol;
    }
  });

  const notes = [];

  if (maxAlloc > 0.45) {
    notes.push(
      `High concentration detected: ${dominant} represents ${(maxAlloc * 100).toFixed(
        2
      )}% of portfolio value.`
    );
  }

  if (maxAlloc < 0.2) {
    notes.push("Portfolio is well diversified with no dominant exposure.");
  }

  return {
    totalValue,
    concentrationFlag: maxAlloc > 0.45,
    dominantSymbol: dominant,
    notes
  };
}

