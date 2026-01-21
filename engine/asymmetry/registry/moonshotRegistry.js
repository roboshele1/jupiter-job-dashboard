/**
 * Moonshot Registry
 * --------------------------------------------------
 * Durable, append-only registry for surfaced moonshot candidates.
 *
 * INSTITUTIONAL PRINCIPLES:
 * - Engine-owned (not UI)
 * - Append-only (audit-safe)
 * - Crash / power-loss resilient
 * - Zero influence on scanning cadence
 *
 * FORMAT:
 * - JSONL (one JSON object per line)
 *
 * THIS MODULE DOES NOT:
 * - Trigger scans
 * - Mutate telemetry
 * - Perform deduped deletes
 * - Perform execution or sizing
 */

const fs = require("fs");
const path = require("path");

const REGISTRY_DIR = path.join(__dirname);
const REGISTRY_FILE = path.join(REGISTRY_DIR, "moonshotRegistry.jsonl");

// Ensure directory exists
if (!fs.existsSync(REGISTRY_DIR)) {
  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(REGISTRY_FILE)) {
  fs.writeFileSync(REGISTRY_FILE, "", "utf8");
}

/**
 * Append surfaced candidates to registry
 * @param {Object} event - telemetry event
 */
function appendFromTelemetryEvent(event) {
  if (!event?.snapshot?.surfaced || !Array.isArray(event.snapshot.surfaced)) {
    return;
  }

  const now = Date.now();

  event.snapshot.surfaced.forEach(candidate => {
    const record = {
      recordedAt: new Date(now).toISOString(),
      symbol: candidate.symbol,
      regime: event.regime,
      conviction: candidate.conviction || "UNKNOWN",
      score: candidate.score ?? null,
      telemetryEventId: event.id
    };

    try {
      fs.appendFileSync(
        REGISTRY_FILE,
        JSON.stringify(record) + "\n",
        "utf8"
      );
    } catch (err) {
      console.error("[MoonshotRegistry] append failed", err);
    }
  });
}

/**
 * Read full registry (read-only)
 */
function readRegistry() {
  try {
    const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = {
  appendFromTelemetryEvent,
  readRegistry
};
