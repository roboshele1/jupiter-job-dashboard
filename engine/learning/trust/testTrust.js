// engine/learning/trust/testTrust.js
import { classifyTrust } from './trustClassifier.js';

console.log([
  classifyTrust(0.90), // HIGH
  classifyTrust(0.70), // MEDIUM
  classifyTrust(0.45), // LOW
  classifyTrust(0.16)  // UNTRUSTED (from V2-17)
]);

