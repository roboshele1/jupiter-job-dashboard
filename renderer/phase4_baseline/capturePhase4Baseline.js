import fs from 'fs';
import path from 'path';
import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import { attachSignalsToSnapshot } from '../../engine/signals/signalsSnapshotEnricher.js';
import { runDiscoveryLab } from '../../engine/discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../../engine/growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../../engine/alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../../engine/risk/riskEngineV1.js';
import { attachRiskToSnapshot } from '../../engine/snapshot/riskSnapshotEnricher.js';

// Build snapshot
const signals = buildSignalsSnapshot({ portfolio: { positions: [] } });
const snapshotWithSignals = attachSignalsToSnapshot({ holdings: [] }, signals);

// Run Discovery Lab
snapshotWithSignals.discovery = runDiscoveryLab({ snapshot: snapshotWithSignals });

// Run Growth Engine
const growthSnapshot = runGrowthEngineV2({ snapshot: snapshotWithSignals });

// Remove circular reference before assigning
if (growthSnapshot.snapshotReference) {
  delete growthSnapshot.snapshotReference;
}
snapshotWithSignals.growth = growthSnapshot;

// Run Alerts Engine
const alertsOutput = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
snapshotWithSignals.alerts = alertsOutput.alerts;

// Run Risk Engine
snapshotWithSignals.riskEngine = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });

// Persist snapshot safely
const outPath = path.resolve('./phase4BaselineSnapshot.json');
fs.writeFileSync(outPath, JSON.stringify(snapshotWithSignals, null, 2), 'utf-8');
console.log('✅ Phase 4 baseline snapshot persisted to:', outPath);

