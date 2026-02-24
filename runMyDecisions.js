#!/usr/bin/env node

/**
 * RUN MY DECISIONS - Your Personal Decision Engine (Live Prices)
 * ===============================================================
 * Usage: node runMyDecisions.js
 */

import { getMyPortfolio, getPortfolioValue } from './myPortfolio.js';
import { calculatePortfolioPositions, checkPortfolioHeat } from './engine/execution/kellyCriterionSizer.js';
import { getLivePrices } from './engine/market/getLivePrices.js';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        JUPITER - YOUR PERSONAL DECISION ENGINE             ║');
console.log('║        Goal: $100k → $1M by 2030                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ============================================================
// STEP 1: Load Portfolio and Fetch Live Prices
// ============================================================
console.log('📊 Loading your portfolio and fetching live prices...\n');

const portfolioData = getPortfolioValue();
const symbols = portfolioData.positions.map(p => p.symbol);
const livePrices = await getLivePrices(symbols);

// Replace market values with live prices
portfolioData.positions.forEach(pos => {
  const live = livePrices[pos.symbol];
  if (live?.price) {
    pos.currentPrice = live.price;
    pos.marketValue = pos.quantity * live.price;
    pos.unrealizedPL = pos.marketValue - pos.bookCost;
    pos.returnPct = Number(((pos.unrealizedPL / pos.bookCost) * 100).toFixed(2));
  }
});

// Recalculate position percentages and total portfolio value
const totalMarketValue = portfolioData.positions.reduce((sum, p) => sum + p.marketValue, 0);
portfolioData.positions.forEach(pos => {
  pos.positionPct = Number(((pos.marketValue / totalMarketValue) * 100).toFixed(2));
});
portfolioData.totalMarketValue = Number(totalMarketValue.toFixed(2));
portfolioData.totalUnrealizedPL = Number((totalMarketValue - portfolioData.totalBookCost).toFixed(2));
portfolioData.totalReturnPct = Number(((portfolioData.totalUnrealizedPL / portfolioData.totalBookCost) * 100).toFixed(2));
portfolioData.goal.current = totalMarketValue;
portfolioData.goal.remaining = 1000000 - totalMarketValue;
portfolioData.goal.progressPct = Number(((totalMarketValue / 1000000) * 100).toFixed(2));

// ============================================================
// STEP 2: Convictions
// ============================================================
console.log('🧠 Analyzing your positions with conviction levels...\n');
const myConvictions = {
  NVDA: { confidence: 'BUY_MORE', conviction: 0.85, rationale: 'AI dominance, data center growth' },
  ASML: { confidence: 'BUY', conviction: 0.75, rationale: 'Chip equipment monopoly' },
  AVGO: { confidence: 'BUY_MORE', conviction: 0.80, rationale: 'AI networking, strong moat' },
  MSTR: { confidence: 'HOLD', conviction: 0.65, rationale: 'Bitcoin proxy, high volatility' },
  HOOD: { confidence: 'HOLD', conviction: 0.55, rationale: 'Trading volumes uncertain' },
  BMNR: { confidence: 'AVOID', conviction: 0.35, rationale: 'Bitcoin mining risk, oversized' },
  APLD: { confidence: 'AVOID', conviction: 0.30, rationale: 'Speculative, too small' },
  NOW: { confidence: 'BUY', conviction: 0.70, rationale: 'Enterprise software leader' },
  BTC: { confidence: 'BUY_MORE', conviction: 0.80, rationale: 'Long-term hold, institutional adoption' },
  ETH: { confidence: 'HOLD', conviction: 0.60, rationale: 'Monitor DeFi developments' }
};

// ============================================================
// STEP 3: Run Kelly Criterion Position Sizing
// ============================================================
console.log('💡 Calculating optimal position sizes (Kelly Criterion)...\n');

const decisions = portfolioData.positions.map(pos => ({
  symbol: pos.symbol,
  confidence: myConvictions[pos.symbol].confidence,
  conviction: myConvictions[pos.symbol].conviction,
  convictionScore: myConvictions[pos.symbol].conviction
}));

const sizing = calculatePortfolioPositions({
  decisions,
  portfolioValue: portfolioData.totalMarketValue,
  currentPositions: portfolioData.positions.map(p => ({ symbol: p.symbol, value: p.marketValue }))
});

// ============================================================
// STEP 4: Check Portfolio Heat
// ============================================================
const heatCheck = checkPortfolioHeat({ positions: sizing.positions, maxTotalHeatPct: 50 });
console.log('🔥 PORTFOLIO RISK ANALYSIS');
console.log(`Total Heat: ${heatCheck.totalHeat.toFixed(1)}% | Status: ${heatCheck.heatStatus} | Recommendation: ${heatCheck.recommendation}\n`);
if (heatCheck.isOverheated) console.log('⚠️ Portfolio OVERHEATED — consider trimming positions!\n');

// ============================================================
// STEP 5: Generate Action Items
// ============================================================
console.log('🎯 YOUR ACTION ITEMS\n');

const actions = sizing.positions
  .filter(p => p.suggestedAction !== 'HOLD' || Math.abs(p.deltaPct) > 1)
  .sort((a, b) => { const p = { EXIT_OR_AVOID: 1, TRIM: 2, ADD: 3, HOLD: 4 }; return (p[a.suggestedAction]||99) - (p[b.suggestedAction]||99); });

if (actions.length === 0) {
  console.log('✅ Portfolio already optimally sized!\n');
} else {
  actions.forEach((action, i) => {
    const livePrice = livePrices[action.symbol]?.price || action.currentPrice;
    console.log(`${i+1}. ${action.symbol} - ${action.suggestedAction}`);
    console.log(`   Current: ${action.currentPositionPct.toFixed(1)}% ($${action.currentPositionValue.toLocaleString()})`);
    console.log(`   Optimal: ${action.optimalPositionPct.toFixed(1)}% ($${action.optimalPositionValue.toLocaleString()})`);
    
    if (action.suggestedAction === 'ADD') {
      const shares = action.deltaValue / livePrice;
      console.log(`   → BUY ${shares.toFixed(2)} shares @ $${livePrice} = $${action.deltaValue.toLocaleString()}`);
    } else if (action.suggestedAction === 'TRIM' || action.suggestedAction === 'EXIT_OR_AVOID') {
      const shares = Math.abs(action.deltaValue) / livePrice;
      console.log(`   → SELL ${shares.toFixed(2)} shares @ $${livePrice} = $${Math.abs(action.deltaValue).toLocaleString()}`);
    }
    console.log(`   Conviction: ${action.confidence} (${(action.winProbability*100).toFixed(0)}% win probability)`);
    console.log(`   Reasoning: ${myConvictions[action.symbol].rationale}\n`);
  });
}

// ============================================================
// STEP 6: Cash Management
// ============================================================
console.log('💰 CASH MANAGEMENT\n');

const cashNeeded = actions.filter(a=>a.suggestedAction==='ADD').reduce((sum,a)=>sum+a.deltaValue,0);
const cashFromTrims = actions.filter(a=>['TRIM','EXIT_OR_AVOID'].includes(a.suggestedAction)).reduce((sum,a)=>sum+Math.abs(a.deltaValue),0);
const netCashNeeded = cashNeeded - cashFromTrims;

console.log(`Cash from trims/exits: $${cashFromTrims.toLocaleString()}`);
console.log(`Cash for adds:         $${cashNeeded.toLocaleString()}`);
console.log(`Net cash needed:       $${netCashNeeded.toLocaleString()}`);
console.log(`Optimal cash reserve:  $${sizing.summary.optimalCashReserve.toLocaleString()} (${sizing.summary.optimalCashPct}%)\n`);

// ============================================================
// STEP 7: Summary & Next Steps
// ============================================================
console.log('📊 SUMMARY\n');
console.log(`Total Actions: ${actions.length}`);
console.log(` → ADD:  ${actions.filter(a=>a.suggestedAction==='ADD').length}`);
console.log(` → TRIM: ${actions.filter(a=>['TRIM','TRIM_TO_MINIMAL'].includes(a.suggestedAction)).length}`);
console.log(` → EXIT: ${actions.filter(a=>a.suggestedAction==='EXIT_OR_AVOID').length}\n`);

console.log('✅ NEXT STEPS:');
console.log('1. Execute EXIT/TRIM actions first');
console.log('2. Then ADD actions gradually');
console.log('3. Monitor portfolio heat');
console.log('4. Re-run weekly\n');

console.log('🎯 Current Portfolio Value: $' + portfolioData.totalMarketValue.toLocaleString() +
  ` (${portfolioData.goal.progressPct}% of $1M goal)` +
  ` | Required CAGR: ${portfolioData.goal.requiredCAGR}%\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Analysis complete! 🚀');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
