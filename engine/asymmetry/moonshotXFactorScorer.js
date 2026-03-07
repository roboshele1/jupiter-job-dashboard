import { detectOptionsFlow } from './optionsFlowDetector.js';
import { detectShortSqueeze } from './shortInterestDetector.js';
import { detectEarningsSurprises } from './earningsSurpriseDetector.js';

export async function scoreMoonshotXFactor(symbol) {
  try {
    const [optionsSignal, shortSignal, earningsSignal] = await Promise.all([
      detectOptionsFlow(symbol),
      detectShortSqueeze(symbol),
      detectEarningsSurprises(symbol),
    ]);
    
    // Weighted composite score
    const optionsScore = (parseFloat(optionsSignal.callPutRatio) / 2) * 0.35;
    const shortScore = (parseFloat(shortSignal.shortPercent) / 40) * 0.35;
    const earningsScore = (earningsSignal.confidence || 0) * 0.30;
    
    const totalScore = Math.min(optionsScore + shortScore + earningsScore, 1);
    
    let recommendation = 'PASS';
    if (totalScore > 0.7) recommendation = 'HIGH_CONVICTION_MOONSHOT';
    else if (totalScore > 0.5) recommendation = 'WATCH_CLOSELY';
    
    return {
      symbol,
      xFactorScore: Math.max(0, (totalScore * 100).toFixed(0)),
      signals: {
        options: optionsSignal.signal,
        short: shortSignal.squeezeRisk,
        earnings: earningsSignal.earnings_signal,
      },
      sources: {
        options: optionsSignal.source || 'api',
        short: shortSignal.source || 'api',
        earnings: earningsSignal.source || 'api',
      },
      recommendation,
    };
  } catch (err) {
    return {
      symbol,
      xFactorScore: 0,
      signals: { options: 'ERROR', short: 'ERROR', earnings: 'ERROR' },
      recommendation: 'PASS',
      error: err.message,
    };
  }
}
