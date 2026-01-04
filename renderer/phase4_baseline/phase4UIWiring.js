import fs from 'fs';
import path from 'path';
import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import { runDiscoveryLab } from '../../engine/discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../../engine/growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../../engine/alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../../engine/risk/riskEngineV1.js';
import { attachSignalsToSnapshot } from '../../engine/signals/signalsSnapshotEnricher.js';

// Load Phase 4 baseline snapshot
const baselinePath = path.resolve('./phase4BaselineSnapshot.json');
const baselineSnapshot = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));

// Build Signals using the exported function
const signalsSnapshot = buildSignalsSnapshot({ portfolio: { positions: [] } });

// Merge signals into baseline snapshot
const snapshotWithSignals = attachSignalsToSnapshot(baselineSnapshot, signalsSnapshot.signals);

// Run Discovery Lab
snapshotWithSignals.discovery = runDiscoveryLab({ snapshot: snapshotWithSignals });

// Run Growth Engine
const growthSnapshot = runGrowthEngineV2({ snapshot: snapshotWithSignals });

// Remove circular references
if (growthSnapshot.snapshotReference) delete growthSnapshot.snapshotReference;

snapshotWithSignals.growth = growthSnapshot;

// Run Alerts Engine
const alertsOutput = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] }});
snapshotWithSignals.alerts = alertsOutput.alerts;

// Run Risk Engine
snapshotWithSignals.riskEngine = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] }});

// Quick terminal verification
console.log('✅ Phase 4 UI snapshot test complete');
console.log('Signals count:', snapshotWithSignals.signals?.length ?? 0);
console.log('Discovery keys:', Object.keys(snapshotWithSignals.discovery || {}));
console.log('Growth keys:', Object.keys(snapshotWithSignals.growth || {}));
console.log('Alerts count:', snapshotWithSignals.alerts?.length ?? 0);
console.log('Risk engine present:', !!snapshotWithSignals.riskEngine);

// Persist snapshot for UI integration
const outPath = path.resolve('./phase4UIIntegratedSnapshot.json');
fs.writeFileSync(outPath, JSON.stringify(snapshotWithSignals, null, 2), 'utf-8');
console.log('✅ Phase 4 UI snapshot persisted to:', outPath);

