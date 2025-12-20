// engine/learning/stability/stabilityEngine.js

export function computeStability({ driftResult, calibrationFactor = 1 }) {
  let score = 1.0;

  if (!driftResult?.ok && Array.isArray(driftResult.alerts)) {
    for (const alert of driftResult.alerts) {
      if (alert.type === 'CONFIDENCE_DRIFT' || alert.type === 'BIAS_DRIFT') {
        score -= Math.min(Math.abs(alert.delta || 0), 0.3);
      }

      if (alert.type === 'SIGNAL_DECAY' && alert.ageDays > 30) {
        score -= 0.2;
      }
    }
  }

  const calibrationPenalty = Math.min(Math.abs(1 - calibrationFactor), 0.2);
  score -= calibrationPenalty;

  return {
    stabilityScore: Math.max(0, Math.min(1, Number(score.toFixed(3)))),
    ts: Date.now()
  };
}

