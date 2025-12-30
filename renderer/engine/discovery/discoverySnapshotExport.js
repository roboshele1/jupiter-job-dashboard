/**
 * Discovery Snapshot Export
 * ------------------------
 * Exposes discovery universe globally for UI consumption.
 *
 * HARD RULES:
 *   - Read-only
 *   - No UI imports
 */

export function exportDiscoverySnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.universe)) {
    console.warn("[DiscoverySnapshotExport] Invalid snapshot");
    return;
  }

  Object.defineProperty(window, "__JUPITER_DISCOVERY_SNAPSHOT__", {
    value: snapshot,
    writable: false,
    configurable: false
  });

  console.info(
    "[DiscoverySnapshotExport] Universe exported",
    { count: snapshot.count }
  );
}

