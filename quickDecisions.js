#!/usr/bin/env node

/**
 * QUICK DECISIONS - Simplified Standalone Version
 * Your $100k → $1M Decision Engine
 */

// ============================================================
// YOUR PORTFOLIO DATA
// ============================================================
const myPortfolio = {
  holdings: [
    { symbol: 'NVDA', quantity: 73.4588, bookCost: 12967.25, currentPrice: 145.50 },
    { symbol: 'ASML', quantity: 10.079, bookCost: 8749.34, currentPrice: 867.00 },
    { symbol: 'AVGO', quantity: 80.2876, bookCost: 26285.66, currentPrice: 178.00 },
    { symbol: 'MSTR', quantity: 35.4873, bookCost: 8703.86, currentPrice: 245.00 },
    { symbol: 'HOOD', quantity: 35, bookCost: 3316.68, currentPrice: 47.00 },
    { symbol: 'BMNR', quantity: 175, bookCost: 6312.34, currentPrice: 36.00 },
    { symbol: 'APLD', quantity: 87.8812, bookCost: 1765.13, currentPrice: 20.00 },
    { symbol: 'NOW', quantity: 20, bookCost: 2088.98, currentPrice: 104.00 },
    { symbol: 'BTC', quantity: 0.281212, bookCost: 24764.31, currentPrice: 88000 },
    { symbol: 'ETH', quantity: 0.25, bookCost: 597.90, currentPrice: 2390 }
  ]
};

// YOUR CONVICTION LEVELS (edit these weekly)
const convictions = {
  NVDA: { level: 'BUY_MORE', score: 0.85 },
  ASML: { level: 'BUY', score: 0.75 },
  AVGO: { level: 'BUY_MORE', score: 0.80 },
  MSTR: { level: 'HOLD', score: 0.65 },
  HOOD: { level: 'HOLD', score: 0.55 },
  BMNR: { level: 'AVOID', score: 0.35 },
  APLD: { level: 'AVOID', score: 0.30 },
  NOW: { level: 'BUY', score: 0.70 },
  BTC: { level: 'BUY_MORE', score: 0.80 },
  ETH: { level: 'HOLD', score: 0.60 }
};

// Kelly Criterion calculations
const convictionToWinProb = {
  'AVOID': 0.30,
  'HOLD': 0.50,
  'BUY': 0.65,
  'BUY_MORE': 0.75
};

const convictionToWinLoss = {
  'AVOID': 0.5,
  'HOLD': 1.0,
  'BUY': 1.5,
  'BUY_MORE': 2.0
};

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         JUPITER - YOUR $100K → $1M DECISION ENGINE         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Calculate current portfolio
let totalBookCost = 0;
let totalMarketValue = 0;

const positions = myPortfolio.holdings.map(h => {
  const marketValue = h.quantity * h.currentPrice;
  const unrealizedPL = marketValue - h.bookCost;
  const returnPct = (unrealizedPL / h.bookCost) * 100;
  
  totalBookCost += h.bookCost;
  totalMarketValue += marketValue;
  
  return {
    ...h,
    marketValue,
    unrealizedPL,
    returnPct
  };
});

console.log('📊 CURRENT PORTFOLIO');
console.log('━'.repeat(60));
console.log(`Total Book Cost:      $${totalBookCost.toLocaleString()}`);
console.log(`Current Market Value: $${totalMarketValue.toLocaleString()}`);
console.log(`Unrealized P/L:       $${(totalMarketValue - totalBookCost).toLocaleString()} (${((totalMarketValue/totalBookCost - 1) * 100).toFixed(1)}%)`);
console.log('━'.repeat(60));
console.log('');

console.log('🎯 GOAL PROGRESS');
console.log('━'.repeat(60));
console.log(`Target:               $1,000,000`);
console.log(`Current:              $${totalMarketValue.toLocaleString()}`);
console.log(`Remaining:            $${(1000000 - totalMarketValue).toLocaleString()}`);
console.log(`Progress:             ${(totalMarketValue/10000).toFixed(1)}%`);
console.log(`Required CAGR:        47%`);
console.log('━'.repeat(60));
console.log('');

// Calculate optimal positions using Kelly
const recommendations = [];

positions.forEach(pos => {
  const conviction = convictions[pos.symbol];
  const winProb = convictionToWinProb[conviction.level];
  const winLoss = convictionToWinLoss[conviction.level];
  
  // Kelly formula
  const kelly = (winLoss * winProb - (1 - winProb)) / winLoss;
  const fractionalKelly = kelly * 0.25; // Use 25% of Kelly
  const optimalPct = Math.max(0, Math.min(fractionalKelly * 100, 15)); // Cap at 15%
  
  const currentPct = (pos.marketValue / totalMarketValue) * 100;
  const optimalValue = (totalMarketValue * optimalPct) / 100;
  const deltaValue = optimalValue - pos.marketValue;
  const deltaPct = optimalPct - currentPct;
  
  let action = 'HOLD';
  if (conviction.level === 'AVOID') {
    action = 'EXIT';
  } else if (Math.abs(deltaPct) > 1) {
    action = deltaPct > 0 ? 'ADD' : 'TRIM';
  }
  
  recommendations.push({
    symbol: pos.symbol,
    action,
    currentPct: currentPct.toFixed(1),
    optimalPct: optimalPct.toFixed(1),
    currentValue: pos.marketValue,
    optimalValue,
    deltaValue,
    deltaPct,
    conviction: conviction.level,
    winProb: (winProb * 100).toFixed(0),
    currentPrice: pos.currentPrice
  });
});

// Sort by priority
const priority = { 'EXIT': 1, 'TRIM': 2, 'ADD': 3, 'HOLD': 4 };
recommendations.sort((a, b) => priority[a.action] - priority[b.action]);

console.log('🎯 YOUR ACTION ITEMS');
console.log('━'.repeat(60));

const actionable = recommendations.filter(r => r.action !== 'HOLD' || Math.abs(r.deltaPct) > 1);

if (actionable.length === 0) {
  console.log('✅ Portfolio is optimally sized!\n');
} else {
  actionable.forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec.symbol} - ${rec.action}`);
    console.log(`   Current: ${rec.currentPct}% ($${rec.currentValue.toLocaleString()})`);
    console.log(`   Optimal: ${rec.optimalPct}% ($${rec.optimalValue.toLocaleString()})`);
    
    if (rec.action === 'ADD') {
      const shares = rec.deltaValue / rec.currentPrice;
      console.log(`   → BUY ${shares.toFixed(2)} shares @ $${rec.currentPrice} = $${rec.deltaValue.toLocaleString()}`);
    } else if (rec.action === 'TRIM' || rec.action === 'EXIT') {
      const shares = Math.abs(rec.deltaValue) / rec.currentPrice;
      console.log(`   → SELL ${shares.toFixed(2)} shares @ $${rec.currentPrice} = $${Math.abs(rec.deltaValue).toLocaleString()}`);
    }
    
    console.log(`   Conviction: ${rec.conviction} (${rec.winProb}% win probability)`);
  });
}

console.log('\n━'.repeat(60));
console.log('\n✅ Analysis Complete!\n');
console.log('💡 WEEKLY WORKFLOW:');
console.log('1. Update prices in this file (line 15-24)');
console.log('2. Update convictions (line 28-39)');
console.log('3. Run: node quickDecisions.js');
console.log('4. Execute top 2-3 actions\n');
