/**
 * Confidence Escalation Engine — Institutional Grade
 *
 * Purpose:
 * Converts repeated asymmetry confirmations into conviction escalation.
 * Prevents one-off signals from triggering false confidence.
 *
 * Core Principles:
 * - Confidence is earned over time
 * - Escalation requires consistency
 * - Decay occurs when signals weaken
 * - Engine is memory-aware but non-predictive
 *
 * This engine does NOT:
 * - Execute trades
 * - Suggest position sizing
 * - React to sentiment or price spikes
 */

const CONFIDENCE_BANDS = {
  LOW: { min: 0, max: 39 },
  BUILDING: { min: 40, max: 59 },
  HIGH: { min: 60, max: 79 },
  EXTREME: { min: 80, max: 100 }
};

module.exports = function confidenceEscalationEngine({
  symbol,
  asymmetryScore,
  previousConfidence = 0,
  signalPersistence = 0,
  timeSinceLastEvalHours = 0,
  survivabilityPassed = false
}) {
  let confidence = previousConfidence;
  const notes = [];

  /**
   * HARD STOP — survivability failure
   */
  if (!survivabilityPassed) {
    return {
      symbol,
      confidence: 0,
      band: 'LOW',
      escalated: false,
      notes: ['Confidence reset due to survivability failure']
    };
  }

  /**
   * 1. Base confidence contribution from asymmetry score
   */
  if (asymmetryScore >= 85) {
    confidence += 12;
    notes.push('Elite asymmetry score reinforcement');
  } else if (asymmetryScore >= 75) {
    confidence += 8;
    notes.push('Strong asymmetry score reinforcement');
  } else if (asymmetryScore >= 60) {
    confidence += 4;
    notes.push('Latent asymmetry reinforcement');
  }

  /**
   * 2. Persistence reinforcement
   * Reward repeated confirmations across scans
   */
  if (signalPersistence >= 3) {
    confidence += 10;
    notes.push('Multi-cycle signal persistence');
  } else if (signalPersistence === 2) {
    confidence += 6;
    notes.push('Second confirmation cycle');
  } else if (signalPersistence === 1) {
    confidence += 3;
    notes.push('Initial confirmation');
  }

  /**
   * 3. Time-based decay
   * Prevent stale confidence
   */
  if (timeSinceLastEvalHours > 72) {
    confidence -= 10;
    notes.push('Confidence decay — stale evaluation');
  } else if (timeSinceLastEvalHours > 24) {
    confidence -= 5;
    notes.push('Minor confidence decay — delayed refresh');
  }

  /**
   * Clamp confidence
   */
  confidence = Math.max(0, Math.min(100, confidence));

  /**
   * Resolve band
   */
  let band = 'LOW';
  for (const [key, range] of Object.entries(CONFIDENCE_BANDS)) {
    if (confidence >= range.min && confidence <= range.max) {
      band = key;
      break;
    }
  }

  /**
   * Escalation condition
   */
  const escalated = band === 'HIGH' || band === 'EXTREME';

  if (escalated) {
    notes.push('Conviction escalated — qualifies for focused monitoring');
  }

  return {
    symbol,
    confidence,
    band,
    escalated,
    notes,
    evaluatedAt: new Date().toISOString()
  };
};
