// engine/discovery/validation/decisionLedger.js
// D5 — Longitudinal Validation Engine
// Append-only decision ledger
// No updates, no deletes, no mutation

const crypto = require('crypto');

const ledger = Object.freeze([]);

function hashDecision(decision) {
  const canonical = JSON.stringify({
    symbol: decision.symbol,
    decision: decision.decision,
    convictionScore: decision.convictionScore,
    regime: decision.regime,
    factorAttribution: decision.factorAttribution,
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function appendDecision(decision) {
  if (!decision || typeof decision !== 'object') {
    throw new Error('INVALID_DECISION_OBJECT');
  }

  const id = hashDecision(decision);

  const record = Object.freeze({
    id,
    timestamp: new Date().toISOString(),
    ...decision,
  });

  return record;
}

module.exports = Object.freeze({
  appendDecision,
});
