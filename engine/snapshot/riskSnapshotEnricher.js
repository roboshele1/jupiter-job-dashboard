// engine/snapshot/riskSnapshotEnricher.js
import { runRiskEngineV1 } from '../risk/riskEngineV1.js';

/**
 * Attaches Risk Engine V1 to a portfolio snapshot (read-only, no UI mutation)
 * @param {Object} snapshot - portfolio snapshot
 * @param {Object} options - { engine: 'RISK_ENGINE_V1' }
 * @returns {Object} snapshot with riskEngine property
 */
export function attachRiskToSnapshot(snapshot, options = {}) {
  const riskEngine = options.engine === 'RISK_ENGINE_V1'
    ? runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: snapshot })
    : null;

  return {
    ...snapshot,
    riskEngine
  };
}

