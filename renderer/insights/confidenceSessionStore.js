// renderer/insights/confidenceSessionStore.js

let sessionHistory = [];

export function appendConfidenceSnapshot(confidenceBand) {
  sessionHistory.push({
    confidenceBand,
    timestamp: Date.now()
  });
}

export function readConfidenceHistory() {
  return [...sessionHistory];
}

export function resetConfidenceSession() {
  sessionHistory = [];
}
