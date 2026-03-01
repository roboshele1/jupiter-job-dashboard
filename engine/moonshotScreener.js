/**
 * Moonshot Screener
 * Identifies pre-breakout compounders matching your portfolio's winning profiles
 */

import { extractGrowthProfile, scoreAgainstProfile, calculate2x3xProbability } from './growthProfiler.js';

export async function screenForMoonshots(targetSymbols, portfolioProfiles, options = {}) {
  const {
    minTrajectoryScore = 65,
    minRevenueCAGR = 0.25,  // 25% growth
    sector = null,
    marketCapMin = 1e9,     // $1B minimum
    marketCapMax = 50e9     // $50B maximum
  } = options;

  const candidates = [];

  for (const symbol of targetSymbols) {
    try {
      // 1. Fetch overview data
      const overview = await getOverviewData(symbol);
      if (!overview) continue;

      // 2. Filter by criteria
      if (overview.marketCap < marketCapMin || overview.marketCap > marketCapMax) continue;
      if (sector && overview.sector !== sector) continue;

      // 3. Fetch income statement for growth analysis
      const incomeStmt = await getIncomeStatement(symbol);
      if (!incomeStmt || incomeStmt.length < 2) continue;

      // 4. Calculate growth profile
      const profile = extractGrowthProfile(incomeStmt);
      if (!profile || profile.revenueCAGR < minRevenueCAGR) continue;

      // 5. Score against portfolio profiles
      let bestMatch = 0;
      let matchedProfile = null;
      for (const portfolioProfile of portfolioProfiles) {
        const score = scoreAgainstProfile(profile, portfolioProfile);
        if (score > bestMatch) {
          bestMatch = score;
          matchedProfile = portfolioProfile;
        }
      }

      if (bestMatch < minTrajectoryScore) continue;

      // 6. Fetch current price
      const quote = await getQuoteData(symbol);
      if (!quote) continue;

      // 7. Calculate 2x/3x probability
      const volatility = 0.35; // Default stock volatility
      const prob2x = calculate2x3xProbability(quote.price, quote.price * 2, 12, volatility);
      const prob3x = calculate2x3xProbability(quote.price, quote.price * 3, 24, volatility);

      candidates.push({
        symbol: overview.symbol,
        name: overview.name,
        sector: overview.sector,
        currentPrice: quote.price,
        marketCap: overview.marketCap,
        peRatio: overview.peRatio,
        
        growth: {
          revenueCAGR: (profile.revenueCAGR * 100).toFixed(1) + '%',
          marginExpansion: (profile.marginExpansion * 100).toFixed(1) + '%',
          trajectoryScore: profile.trajectoryScore.toFixed(0)
        },
        
        match: {
          score: bestMatch.toFixed(0),
          matchedProfile: matchedProfile?.name || 'Custom'
        },
        
        targets: {
          prob2x: prob2x.probability,
          prob3x: prob3x.probability
        },
        
        technicals: {
          changePercent: (overview.changePercent * 100).toFixed(2) + '%',
          grossMargin: (overview.grossMargin * 100).toFixed(1) + '%',
          operatingMargin: (overview.operatingMargin * 100).toFixed(1) + '%'
        }
      });

    } catch (err) {
      console.error(`Error screening ${symbol}:`, err);
    }
  }

  // Sort by trajectory score
  return candidates.sort((a, b) => parseFloat(b.growth.trajectoryScore) - parseFloat(a.growth.trajectoryScore));
}
