// engine/decision/decisionInputContract.js

export function validateDecisionInputV2(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid decision input');
  }

  const { engine, asOf, portfolio, signals, risk } = input;

  if (engine !== 'DECISION_ENGINE_V2') {
    throw new Error('Invalid engine identifier');
  }

  if (typeof asOf !== 'number') {
    throw new Error('asOf timestamp required');
  }

  if (!portfolio || !Array.isArray(portfolio.positions)) {
    throw new Error('portfolio.positions required');
  }

  if (!Array.isArray(signals)) {
    throw new Error('signals array required');
  }

  return {
    engine,
    asOf,
    portfolio,
    signals,
    risk: risk || {}
  };
}

