import { getPortfolioSnapshot } from "../portfolioEngine.js";
import { writeSnapshot } from "../snapshots/snapshotIndex.js";
import path from "path";
import fs from "fs";

// Canonical holdings authority path
const HOLDINGS_PATH = path.resolve("engine/data/holdings.js");

function loadHoldingsAuthority() {
  try {
    delete require.cache[require.resolve(HOLDINGS_PATH)];
    const holdings = require(HOLDINGS_PATH);
    return Array.isArray(holdings) ? holdings : [];
  } catch (err) {
    console.warn("[HEARTBEAT] Failed to load holdings authority:", err.message);
    return [];
  }
}

export async function runMarketPulseJob() {
  try {
    console.log("[HEARTBEAT] Pulse started:", new Date().toISOString());

    // 1️⃣ Load authoritative holdings
    const holdings = loadHoldingsAuthority();

    if (!holdings.length) {
      console.warn("[HEARTBEAT] No holdings found in authority.");
    }

    // 2️⃣ Generate portfolio snapshot with real holdings
    const portfolioSnapshot = await getPortfolioSnapshot(holdings);

    if (!portfolioSnapshot) {
      console.warn("[HEARTBEAT] No portfolio snapshot returned.");
      return;
    }

    // 3️⃣ Persist immutable snapshot
    writeSnapshot({
      timestamp: Date.now(),
      source: "HEARTBEAT",
      snapshot: portfolioSnapshot
    });

    console.log("[HEARTBEAT] Snapshot recorded successfully.");

  } catch (err) {
    console.error("[HEARTBEAT] Pulse failed:", err.message);
  }
}
