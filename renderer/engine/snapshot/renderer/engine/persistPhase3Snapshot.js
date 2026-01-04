import fs from 'fs';
import path from 'path';

// ✅ Corrected imports
import { runSignalsV2 } from '../signals/signalsEngine.js';
import { attachSignalsToSnapshot } from '../signals/signalsSnapshotEnricher.js';
import { runDiscoveryLab } from '../discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../risk/riskEngineV1.js';
import { attachRiskToSnapshot } from './riskSnapshotEnricher.js';

// Step 1: Build signals snapshot
const signals = runSignalsV2({ snapshot: { holdings: [] } });
const snapshotWithSignals = attachSignalsToSnapshot({ holdings: [] }, signals);

// Step 2: Attach Discovery Lab (read-only)
snapshotWithSignals.discovery = runDiscoveryLab({ snapshot: snapshotWithSignals });

// Step 3: Run Growth Engine on enriched snapshot
snapshotWithSignals.growth = runGrowthEngineV2({ snapshot: snapshotWithSignals });

// Step 4: Run Alerts Engine
const alertsOutput = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
snapshotWithSignals.alerts = alertsOutput.alerts;

// Step 5: Run Risk Engine and attach
snapshotWithSignals.riskEngine = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
snapshotWithSignals.riskEngine = attachRiskToSnapshot({ holdings: [] }, snapshotWithSignals.riskEngine);

// Step 6: Persist Phase 3 snapshot to JSON
const outPath = path.resolve('renderer/runtimeSnapshots/phase3Snapshot.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshotWithSignals, getCircularReplacer(), 2), 'utf-8');

console.log('✅ Phase 3 snapshot persisted to:', outPath);

// -----------------------------
// Helper to handle circular references (Growth Engine snapshotReference)
function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  };
}

