import fs from 'fs';
import path from 'path';
import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import { attachSignalsToSnapshot } from '../../engine/signals/signalsSnapshotEnricher.js';
import { runDiscoveryLab } from '../../engine/discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../../engine/growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../../engine/alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../../engine/risk/riskEngineV1.js';
import { attachRiskToSnapshot } from '../../engine/snapshot/riskSnapshotEnricher.js';

// Build base snapshot
const signals = buildSignalsSnapshot({ portfolio: { positions: [] } });
const snapshot = attachSignalsToSnapshot({ holdings: [] }, signals);
snapshot.discovery = runDiscoveryLab({ snapshot });
snapshot.growth = runGrowthEngineV2({ snapshot });
snapshot.alerts = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } }).alerts;
snapshot.riskEngine = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });

// Persist the snapshot for UI wiring
const outPath = path.resolve('./phase4BaselineSnapshot.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf-8');

console.log('✅ Phase 4 baseline snapshot persisted to:', outPath);

