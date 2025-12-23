// renderer/services/debugBoot.js
// Centralized debug bootstrap (read-only, non-invasive)

import "./snapshotAdapterDebug";
import "./snapshotExpose";

if (typeof window !== "undefined") {
  window.__JUPITER_DEBUG = window.__JUPITER_DEBUG || {};
  window.__JUPITER_DEBUG.bootTS = new Date().toISOString();
}

