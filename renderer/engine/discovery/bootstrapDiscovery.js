import { generateDiscoverySnapshot } from "./discoveryEngine";
import { exportDiscoverySnapshot } from "./discoverySnapshotExport";

export function bootstrapDiscovery() {
  const snapshot = generateDiscoverySnapshot();
  exportDiscoverySnapshot(snapshot);
}

