// engine/learning/learningGuard.js
let learningEnabled = false;

export function enableLearning() {
  learningEnabled = true;
}

export function disableLearning() {
  learningEnabled = false;
}

export function isLearningEnabled() {
  return learningEnabled;
}

