/**
 * CONFIDENCE_TIME_ENGINE_V1
 *
 * Purpose:
 * - Enforce confidence persistence before state promotion
 * - Apply decay when confidence becomes stale
 * - Provide deterministic time-in-state intelligence
 *
 * Inputs:
 * {
 *   history: [{ confidenceBand: string, timestamp: number }]
 *   persistenceDays: number
 *   decayDays: number
 * }
 *
 * Output:
 * {
 *   currentBand: string | "UNKNOWN"
 *   daysInState: number
 *   persistenceMet: boolean
 *   decayed: boolean
 * }
 */

export function runConfidenceTimeEngine({
  history = [],
  persistenceDays = 3,
  decayDays = 7
}) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      currentBand: "UNKNOWN",
      daysInState: 0,
      persistenceMet: false,
      decayed: false
    };
  }

  // Sort history chronologically
  const ordered = [...history].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const latest = ordered[ordered.length - 1];
  const currentBand = latest.confidenceBand;

  // Walk backwards to find when this band began
  let stateStartTimestamp = latest.timestamp;

  for (let i = ordered.length - 1; i >= 0; i--) {
    if (ordered[i].confidenceBand !== currentBand) break;
    stateStartTimestamp = ordered[i].timestamp;
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysInState = Math.floor(
    (Date.now() - stateStartTimestamp) / MS_PER_DAY
  );

  const persistenceMet = daysInState >= persistenceDays;
  const decayed = daysInState >= decayDays;

  return {
    currentBand,
    daysInState,
    persistenceMet,
    decayed
  };
}
