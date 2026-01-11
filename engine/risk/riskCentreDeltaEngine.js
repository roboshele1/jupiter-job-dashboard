/**
 * Risk Centre Delta Engine — V1
 * --------------------------------
 * Computes deterministic deltas between
 * two Risk Centre snapshots.
 *
 * PURE FUNCTION:
 * - No side effects
 * - No persistence
 * - No IPC
 */

export function computeRiskCentreDeltas({ previous, current }) {
  if (!previous || !current) {
    return {
      postureDelta: null,
      scenarioDelta: [],
      metaDelta: null
    };
  }

  // Posture delta
  const postureDelta =
    previous.posture !== current.posture
      ? {
          from: previous.posture,
          to: current.posture
        }
      : null;

  // Scenario deltas (by type)
  const scenarioDelta = current.scenarios.map(curr => {
    const prev = previous.scenarios.find(p => p.type === curr.type);
    if (!prev) return null;

    const impactDelta = curr.impact - prev.impact;
    if (impactDelta === 0) return null;

    return {
      type: curr.type,
      previousImpact: prev.impact,
      currentImpact: curr.impact,
      delta: impactDelta
    };
  }).filter(Boolean);

  // Meta delta (time elapsed)
  const metaDelta = {
    elapsedMs:
      current.meta.generatedAt - previous.meta.generatedAt
  };

  return {
    postureDelta,
    scenarioDelta,
    metaDelta
  };
}
