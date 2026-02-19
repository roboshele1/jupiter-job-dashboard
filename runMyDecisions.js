#!/usr/bin/env node

/**
 * RUN MY DECISIONS - Your Personal Decision Engine
 * =================================================
 * One command to analyze YOUR portfolio and get actionable recommendations
 * 
 * Usage: node runMyDecisions.js
 */

import { getMyPortfolio, getPortfolioValue, getCurrentPrices } from './myPortfolio.js';
import { calculatePortfolioPositions, checkPortfolioHeat } from './engine/execution/kellyCriterionSizer.js';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        JUPITER - YOUR PERSONAL DECISION ENGINE             ║');
console.log('║        Goal: $100k → $1M by 2030                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ============================================================
// STEP 1: Load Your Current Portfolio
// ============================================================
console.log('📊 Loading your portfolio...\n');

const portfolioData = getPortfolioValue();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  CURRENT PORTFOLIO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Book Cost:     $${portfolioData.totalBookCost.toLocaleString()}`);
console.log(`Current Market Value: $${portfolioData.totalMarketValue.toLocaleString()}`);
console.log(`Unrealized P/L:      $${portfolioData.totalUnrealizedPL.toLocaleString()} (${portfolioData.totalReturnPct > 0 ? '+' : ''}${portfolioData.totalReturnPct.toFixed(2)}%)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🎯 GOAL PROGRESS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Target:              $${portfolioData.goal.target.toLocaleString()}`);
console.log(`Current:             $${portfolioData.goal.current.toLocaleString()}`);
console.log(`Remaining:           $${portfolioData.goal.remaining.toLocaleString()}`);
console.log(`Progress:            ${portfolioData.goal.progressPct}%`);
console.log(`Months to 2030:      ${portfolioData.goal.monthsRemaining}`);
console.log(`Required CAGR:       ${portfolioData.goal.requiredCAGR}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 YOUR POSITIONS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
portfolioData.positions.forEach(pos => {
  const plSign = pos.unrealizedPL >= 0 ? '+' : '';
  const returnSign = pos.returnPct >= 0 ? '+' : '';
  console.log(`${pos.symbol.padEnd(6)} ${pos.positionPct.toFixed(1)}%`.padEnd(12) + 
              `$${pos.marketValue.toLocaleString().padEnd(12)} ` +
              `${plSign}$${pos.unrealizedPL.toLocaleString()} (${returnSign}${pos.returnPct}%)`);
});
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ============================================================
// STEP 2: Define Your Conviction Levels
// ============================================================
console.log('🧠 Analyzing your positions with conviction levels...\n');

/**
 * YOUR CONVICTION LEVELS
 * ----------------------
 * Set these based on your view of each position:
 * - BUY_MORE: Very bullish, high conviction
 * - BUY: Bullish, add if underweight
 * - HOLD: Neutral, maintain position
 * - AVOID: Bearish, trim or exit
 */
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
  currentPositions: portfolioData.positions.map(p => ({
    symbol: p.symbol,
    value: p.marketValue
  }))
});

// ============================================================
// STEP 4: Check Portfolio Heat
// ============================================================
const heatCheck = checkPortfolioHeat({
  positions: sizing.positions,
  maxTotalHeatPct: 50
});

console.log('🔥 PORTFOLIO RISK ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Heat:          ${heatCheck.totalHeat.toFixed(1)}%`);
console.log(`Max Allowed:         ${heatCheck.maxAllowedHeat}%`);
console.log(`Status:              ${heatCheck.heatStatus}`);
console.log(`Recommendation:      ${heatCheck.recommendation}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (heatCheck.isOverheated) {
  console.log('⚠️  WARNING: Your portfolio is OVERHEATED!');
  console.log('   You should REDUCE positions before adding new ones.\n');
}

// ============================================================
// STEP 5: Generate Action Items
// ============================================================
console.log('🎯 YOUR ACTION ITEMS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const actions = sizing.positions
  .filter(p => p.suggestedAction !== 'HOLD' || Math.abs(p.deltaPct) > 1)
  .sort((a, b) => {
    const priority = { 'EXIT_OR_AVOID': 1, 'TRIM': 2, 'ADD': 3, 'HOLD': 4 };
    return (priority[a.suggestedAction] || 99) - (priority[b.suggestedAction] || 99);
  });

if (actions.length === 0) {
  console.log('✅ Your portfolio is already optimally sized!');
  console.log('   No immediate actions needed.\n');
} else {
  actions.forEach((action, i) => {
    console.log(`${i + 1}. ${action.symbol} - ${action.suggestedAction}`);
    console.log(`   Current: ${action.currentPositionPct.toFixed(1)}% ($${action.currentPositionValue.toLocaleString()})`);
    console.log(`   Optimal: ${action.optimalPositionPct.toFixed(1)}% ($${action.optimalPositionValue.toLocaleString()})`);
    
    if (action.suggestedAction === 'ADD') {
      const currentPrice = getCurrentPrices()[action.symbol];
      const sharesToBuy = action.deltaValue / currentPrice;
      console.log(`   → BUY ${sharesToBuy.toFixed(2)} shares @ $${currentPrice} = $${action.deltaValue.toLocaleString()}`);
    } else if (action.suggestedAction === 'TRIM' || action.suggestedAction === 'EXIT_OR_AVOID') {
      const currentPrice = getCurrentPrices()[action.symbol];
      const sharesToSell = Math.abs(action.deltaValue) / currentPrice;
      console.log(`   → SELL ${sharesToSell.toFixed(2)} shares @ $${currentPrice} = $${Math.abs(action.deltaValue).toLocaleString()}`);
    }
    
    console.log(`   Conviction: ${action.confidence} (${(action.winProbability * 100).toFixed(0)}% win probability)`);
    console.log(`   Reasoning: ${myConvictions[action.symbol].rationale}`);
    console.log('');
  });
}

// ============================================================
// STEP 6: Cash Management
// ============================================================
console.log('💰 CASH MANAGEMENT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const cashNeededForAdds = actions
  .filter(a => a.suggestedAction === 'ADD')
  .reduce((sum, a) => sum + a.deltaValue, 0);

const cashFromTrims = actions
  .filter(a => a.suggestedAction === 'TRIM' || a.suggestedAction === 'EXIT_OR_AVOID')
  .reduce((sum, a) => sum + Math.abs(a.deltaValue), 0);

const netCashNeeded = cashNeededForAdds - cashFromTrims;

console.log(`Cash from Trims/Exits: $${cashFromTrims.toLocaleString()}`);
console.log(`Cash for Adds:         $${cashNeededForAdds.toLocaleString()}`);
console.log(`Net Cash Needed:       $${netCashNeeded.toLocaleString()}`);
console.log(`Optimal Cash Reserve:  $${sizing.summary.optimalCashReserve.toLocaleString()} (${sizing.summary.optimalCashPct}%)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ============================================================
// STEP 7: Summary & Next Steps
// ============================================================
console.log('📊 SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Actions:        ${actions.length}`);
console.log(`  → Positions to ADD:  ${actions.filter(a => a.suggestedAction === 'ADD').length}`);
console.log(`  → Positions to TRIM: ${actions.filter(a => a.suggestedAction === 'TRIM' || a.suggestedAction === 'TRIM_TO_MINIMAL').length}`);
console.log(`  → Positions to EXIT: ${actions.filter(a => a.suggestedAction === 'EXIT_OR_AVOID').length}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ NEXT STEPS:');
console.log('1. Review the action items above');
console.log('2. Update prices in myPortfolio.js (getCurrentPrices function)');
console.log('3. Adjust conviction levels if needed (in this file, myConvictions object)');
console.log('4. Execute trades gradually (don\'t do everything at once)');
console.log('5. Re-run this weekly: node runMyDecisions.js\n');

console.log('💡 PRO TIPS:');
console.log('• Start with EXIT/TRIM actions first to reduce risk');
console.log('• Then execute ADD actions in priority order');
console.log('• Monitor portfolio heat - if > 50%, stop adding');
console.log('• Update this script weekly with new prices & convictions\n');

console.log('🎯 Remember: Your goal is $1M by 2030');
console.log(`   Current: $${portfolioData.totalMarketValue.toLocaleString()} (${portfolioData.goal.progressPct}% of goal)`);
console.log(`   Required CAGR: ${portfolioData.goal.requiredCAGR}%\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Analysis complete! 🚀');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
