// renderer/services/riskSnapshot.js
// Canonical import target for Risk UI

import { buildRiskSnapshot } from "./riskSnapshotService";

export function getRiskSnapshot(holdings = []) {
  return buildRiskSnapshot(holdings);
}

