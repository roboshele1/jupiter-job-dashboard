import fs from 'fs';
import path from 'path';

import { runSignalsV2 } from './signals/signalsV2.js';
import { attachSignalsToSnapshot } from './signals/signalsSnapshotEnricher.js';
import { runDiscoveryLab } from './discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from './growth/growthEngineV2.js';
import { runAlertsEngineV1 } from './alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from './risk/riskEngineV1.js';
import { attachRiskToSnapshot } from './snapshot/riskSnapshotEnricher.js';

// Build snapshot
const signals = runSignalsV2({ snapshot: { holdings: [] } });
const snapshotWithSignals = attachSignalsToSnapshot({ holdings: [] }, signals);

// Run Discovery Lab (read-only)
snapshotWithSignals.discovery = runDiscoveryLab({ snapshot: snapshotWithSignals });

// Run Growth Engine
snapshotWithSignals.growth = runGrowthEngineV2({ snapshot: snapshotWithSignals });

// Run Alerts Engine
const alertsOutput = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
snapshotWithSignals.alerts = alertsOutput.alerts;

// Run Risk Engine
snapshotWithSignals.riskEngine = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });

// Persist snapshot to a JSON file for runtime consumption
const outPath = path.resolve('../runtimeSnapshots/phase3Snapshot.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshotWithSignals, (key, value) => {
  // Remove circular reference
  if (key === 'snapshotReference') return undefined;
  return value;
}, 2), 'utf-8');

console.log('✅ Phase 3 snapshot persisted to:', outPath);

