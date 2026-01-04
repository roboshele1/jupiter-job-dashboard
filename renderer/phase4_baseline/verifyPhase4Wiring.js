import fs from 'fs';
import path from 'path';
import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import { runDiscoveryLab } from '../../engine/discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../../engine/growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../../engine/alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../../engine/risk/riskEngineV1.js';

// Load Phase 4 baseline snapshot
const snapshotPath = path.resolve('./phase4BaselineSnapshot.json');
if (!fs.existsSync(snapshotPath)) {
  console.error(`❌ Baseline snapshot missing at: ${snapshotPath}`);
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));

// Signals test
const signalsTest = buildSignalsSnapshot({ portfolio: { positions: [] } });
console.log('✅ Signals test count:', signalsTest.signals.length);

// Discovery Lab test
const discoveryTest = runDiscoveryLab({ snapshot });
console.log('✅ Discovery test keys:', Object.keys(discoveryTest));

// Growth Engine test
const growthTest = runGrowthEngineV2({ snapshot });
console.log('✅ Growth test keys:', Object.keys(growthTest));

// Alerts Engine test
const alertsTest = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
console.log('✅ Alerts test count:', alertsTest.alerts.length);

// Risk Engine test
const riskTest = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
console.log('✅ Risk engine present:', !!riskTest);

// Full snapshot keys verification
console.log('✅ Phase 4 baseline snapshot verification complete:');
console.log('Signals keys:', snapshot.signals?.length ?? 0);
console.log('Discovery keys:', Object.keys(snapshot.discovery || {}));
console.log('Growth keys:', Object.keys(snapshot.growth || {}));
console.log('Alerts keys:', snapshot.alerts?.length ?? 0);
console.log('Risk engine present:', !!snapshot.riskEngine);

