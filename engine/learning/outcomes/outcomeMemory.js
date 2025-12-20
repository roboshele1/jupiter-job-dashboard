// engine/learning/outcomes/outcomeMemory.js

const history = [];

export function storeOutcome(outcome) {
  history.push(outcome);
}

export function getOutcomeHistory() {
  return history;
}

