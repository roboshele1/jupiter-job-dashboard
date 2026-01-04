import fs from 'fs';
import path from 'path';

// Correct paths from snapshot folder
import { runSignalsV2 } from '../signals/signalsV2.js';
import { attachSignalsToSnapshot } from '../signals/signalsSnapshotEnricher.js';
import { runDiscoveryLab } from '../discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../risk/riskEngineV1.js';
import { attachRiskToSnapshot } from './riskSnapshotEnricher.js';

// Step 1: Run Signals
const signals = runSignalsV2({ snapshot: { holdings: [] } });
const snapshotWithSignals = attachSignalsToSnapshot({ holdings: [] }, signals);

// Step 2: Run Discovery Lab
snapshotWithSignals.discovery = runDiscoveryLab({ snapshot: snapshotWithSignals });

// Step 3: Run Growth Engine
snapshotWithSignals.growth = runGrowthEngineV2({ snapshot: snapshotWithSignals });

// Step 4: Run Alerts Engine
const alertsOutput = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
snapshotWithSignals.alerts = alertsOutput.alerts;

// Step 5: Run Risk Engine
snapshotWithSignals.riskEngine = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
attachRiskToSnapshot({ holdings: [] }, { engine: 'RISK_ENGINE_V1' });

// Step 6: Persist snapshot to JSON (handles circular references)
const outPath = path.resolve('./runtimeSnapshots/phase3Snapshot.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshotWithSignals, getCircularReplacer(), 2), 'utf-8');

console.log('✅ Phase 3 snapshot persisted to:', outPath);

// Utility for circular references
function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  };
}

