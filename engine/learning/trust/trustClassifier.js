// engine/learning/trust/trustClassifier.js
export function classifyTrust(stabilityScore) {
  if (stabilityScore >= 0.85) return 'HIGH';
  if (stabilityScore >= 0.65) return 'MEDIUM';
  if (stabilityScore >= 0.40) return 'LOW';
  return 'UNTRUSTED';
}

