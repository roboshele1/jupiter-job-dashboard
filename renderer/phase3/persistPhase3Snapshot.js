// persistPhase3Snapshot.js
import fs from 'fs';
import path from 'path';

import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import { attachSignalsToSnapshot } from '../../engine/signals/signalsSnapshotEnricher.js';
import { runDiscoveryLab } from '../../engine/discovery/discoveryLabV2.js';
import { runGrowthEngineV2 } from '../../engine/growth/growthEngineV2.js';
import { runAlertsEngineV1 } from '../../engine/alerts/alertsEngineV1.js';
import { runRiskEngineV1 } from '../../engine/risk/riskEngineV1.js';
import { attachRiskToSnapshot } from '../../engine/snapshot/riskSnapshotEnricher.js';

// -------------------- BUILD SNAPSHOT --------------------

// Build signals snapshot
const signals = buildSignalsSnapshot({ portfolio: { positions: [] } });

// Attach signals to snapshot
const snapshotWithSignals = attachSignalsToSnapshot({ holdings: [] }, signals);

// -------------------- RUN ENGINES --------------------

// Discovery Lab (read-only)
snapshotWithSignals.discovery = runDiscoveryLab({ snapshot: snapshotWithSignals });

// Growth Engine
snapshotWithSignals.growth = runGrowthEngineV2({ snapshot: snapshotWithSignals });

// Alerts Engine
const alertsOutput = runAlertsEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });
snapshotWithSignals.alerts = alertsOutput.alerts;

// Risk Engine
snapshotWithSignals.riskEngine = runRiskEngineV1({ decisionOutput: { alerts: [] }, portfolio: { positions: [] } });

// -------------------- PERSIST TO JSON --------------------
const outPath = path.resolve('../../runtimeSnapshots/phase3Snapshot.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// Remove circular references before stringify
function removeCircularRefs(obj, seen = new WeakSet()) {
  if (obj && typeof obj === 'object') {
    if (seen.has(obj)) return undefined;
    seen.add(obj);
    for (const key in obj) {
      obj[key] = removeCircularRefs(obj[key], seen);
    }
  }
  return obj;
}

const snapshotSafe = removeCircularRefs(snapshotWithSignals);

fs.writeFileSync(outPath, JSON.stringify(snapshotSafe, null, 2), 'utf-8');

console.log('✅ Phase 3 snapshot persisted to:', outPath);

