import fs from 'fs';
import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import { runDiscoveryLab } from '../../engine/discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../../engine/growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../../engine/alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../../engine/risk/riskEngineV1.js';
import { attachSignalsToSnapshot } from '../../engine/signals/signalsSnapshotEnricher.js';

// Load baseline snapshot
const snapshot = JSON.parse(fs.readFileSync('./phase4BaselineSnapshot.json', 'utf-8'));

// Signals tab wiring
const signalsData = buildSignalsSnapshot({ portfolio: snapshot.portfolio || { positions: [] } });
snapshot.signals = signalsData.signals;

// Discovery tab wiring
const discoveryData = runDiscoveryLab({ snapshot });
snapshot.discovery = discoveryData;

// Growth tab wiring
const growthData = runGrowthEngineV2({ snapshot });
snapshot.growth = growthData;

// Alerts tab wiring
const alertsData = runAlertsEngineV1({ decisionOutput:{ alerts: [] }, portfolio: snapshot.portfolio || { positions: [] }});
snapshot.alerts = alertsData.alerts;

// Risk tab wiring
const riskData = runRiskEngineV1({ decisionOutput:{ alerts: [] }, portfolio: snapshot.portfolio || { positions: [] }});
snapshot.riskEngine = riskData;

// Persist interactive wiring scaffold
const outPath = './phase4InteractiveSnapshot.json';
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf-8');

console.log('✅ Phase 4 UI wiring scaffold persisted to:', outPath);
console.log('Signals:', snapshot.signals.length);
console.log('Discovery keys:', Object.keys(snapshot.discovery));
console.log('Growth keys:', Object.keys(snapshot.growth));
console.log('Alerts count:', snapshot.alerts.length);
console.log('Risk engine present:', !!snapshot.riskEngine);

