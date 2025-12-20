/**
 * Decision Log
 * ------------
 * Append-only record of intelligence outputs.
 */

const log = [];

export function recordDecision(entry) {
  log.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

export function getDecisionLog() {
  return [...log];
}

