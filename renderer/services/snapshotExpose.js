// renderer/services/snapshotExpose.js
// Read-only debug exposure for snapshot verification

import { fetchSnapshotHoldings } from "./snapshotSource";

if (typeof window !== "undefined") {
  window.__JUPITER_DEBUG = window.__JUPITER_DEBUG || {};

  fetchSnapshotHoldings().then((data) => {
    window.__JUPITER_DEBUG.snapshot = data;
  });
}

