const ledger = [];

function appendDecision(entry) {
  ledger.push({
    ...entry,
    timestamp: Date.now(),
  });
}

function readLedger() {
  return [...ledger];
}

module.exports = {
  appendDecision,
  readLedger,
};

