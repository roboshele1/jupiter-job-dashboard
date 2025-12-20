const outcomes = [];

function recordOutcome({ decisionId, result, delta }) {
  outcomes.push({
    decisionId,
    result,
    delta,
    timestamp: Date.now(),
  });
}

function getOutcomes() {
  return outcomes;
}

module.exports = {
  recordOutcome,
  getOutcomes,
};

