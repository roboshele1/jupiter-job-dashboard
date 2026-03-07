/**
 * Thesis Accuracy Tracker
 * Tracks which thesis bets hit targets, learns from outcomes
 */

export function trackThesisOutcome(thesis, currentPrice, targetPrice, timelineMonths) {
  const monthsElapsed = Math.min(timelineMonths, 12); // Max 12 months for tracking
  
  const initialPrice = thesis.entryPrice;
  const actualReturn = (currentPrice - initialPrice) / initialPrice;
  const targetReturn = (targetPrice - initialPrice) / initialPrice;
  const accuracy = Math.min(actualReturn / targetReturn, 1); // 0-1 score

  const outcome = {
    symbol: thesis.symbol,
    entryPrice: initialPrice.toFixed(2),
    targetPrice: targetPrice.toFixed(2),
    currentPrice: currentPrice.toFixed(2),
    actualReturn: (actualReturn * 100).toFixed(1) + '%',
    targetReturn: (targetReturn * 100).toFixed(1) + '%',
    accuracy: (accuracy * 100).toFixed(0) + '%',
    status: accuracy > 0.9 ? '✅ ON_TRACK' : accuracy > 0.5 ? '⚠️ LAGGING' : '❌ BROKEN',
    monthsElapsed,
    conviction: thesis.bullCaseProb,
  };

  return outcome;
}

export function calculateAccuracyScore(theses) {
  if (theses.length === 0) return 0;

  const accuracies = theses.map(t => {
    const accuracy = Math.min(t.actualReturn / t.targetReturn, 1);
    return accuracy * t.conviction; // Weight by conviction
  });

  const score = (accuracies.reduce((a, b) => a + b) / theses.length) * 100;
  return Math.min(score, 100).toFixed(0);
}

export function getLessonForNextThesis(accuracyHistory) {
  if (accuracyHistory.length === 0) return 'Start tracking thesis outcomes';

  const avgAccuracy = accuracyHistory.reduce((sum, t) => sum + parseFloat(t.accuracy), 0) / accuracyHistory.length;
  
  if (avgAccuracy > 80) {
    return '🎯 Your thesis selection is strong. Increase allocation to moonshots.';
  }
  if (avgAccuracy > 60) {
    return '✓ Reasonable accuracy. Mix core + moonshots 70/30.';
  }
  return '⚠️ Lower accuracy. Stick with 80/20 core/moonshot until thesis improves.';
}
