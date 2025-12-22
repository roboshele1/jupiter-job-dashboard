// tools/snapshot_probe.js
// Phase 1.1 — Dashboard Snapshot Ingestion (Terminal Probe)
// ZERO UI • ZERO Electron • ZERO IPC

const http = require("http");

const SNAPSHOT_URL = "http://localhost:3001/snapshot";

function fetchSnapshot() {
  return new Promise((resolve, reject) => {
    http.get(SNAPSHOT_URL, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error("Invalid JSON from snapshot service"));
        }
      });
    }).on("error", (err) => reject(err));
  });
}

function aggregateSnapshot(snapshot) {
  let totalValue = 0;

  const crypto = snapshot.crypto || [];
  const equities = snapshot.equities || [];

  console.log("\n=== SNAPSHOT INGESTION ===");
  console.log("Timestamp:", new Date(snapshot.timestamp * 1000).toISOString());
  console.log("");

  console.log("CRYPTO:");
  crypto.forEach((c) => {
    console.log(`  ${c.symbol} @ $${c.price}`);
  });

  console.log("\nEQUITIES:");
  equities.forEach((e) => {
    console.log(`  ${e.symbol} @ $${e.price}`);
  });

  // NOTE:
  // This probe assumes position sizing will be wired later.
  // For now, we validate data integrity & math path.
  totalValue =
    crypto.reduce((s, c) => s + c.price, 0) +
    equities.reduce((s, e) => s + e.price, 0);

  return {
    totalValue,
    cryptoCount: crypto.length,
    equityCount: equities.length,
  };
}

(async () => {
  try {
    const snapshot = await fetchSnapshot();
    const agg = aggregateSnapshot(snapshot);

    console.log("\n=== AGGREGATION RESULT ===");
    console.log("Assets (crypto):", agg.cryptoCount);
    console.log("Assets (equities):", agg.equityCount);
    console.log("Raw Price Sum:", `$${agg.totalValue.toFixed(2)}`);
    console.log("\nSTATUS: SNAPSHOT PIPELINE HEALTHY ✅\n");
  } catch (err) {
    console.error("\nSTATUS: SNAPSHOT PIPELINE FAILED ❌");
    console.error(err.message);
    process.exit(1);
  }
})();

