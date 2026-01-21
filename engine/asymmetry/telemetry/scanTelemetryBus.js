/**
 * Scan Telemetry Bus
 * -----------------------------------------
 * Passive, append-only telemetry layer.
 *
 * PURPOSE:
 * - Capture live scan events
 * - Emit deterministic events to IPC layer
 *
 * HARD RULES:
 * - No scan control
 * - No mutation
 * - Engine-safe
 */

const MAX_BUFFER_SIZE = 500;

// 🔒 Moonshot Registry (passive persistence)
const {
  appendFromTelemetryEvent
} = require('../registry/moonshotRegistry');

// In-memory buffer
let telemetryBuffer = [];

// Subscribers (IPC bridges attach here)
let subscribers = new Set();

/**
 * Subscribe to telemetry events
 * @param {(event:Object)=>void} fn
 */
function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Record a scan event
 */
function recordScanEvent({ regime, universe, result }) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    regime,
    universeSize: universe?.length ?? 0,
    evaluated: result?.evaluated ?? 0,
    surfacedCount: result?.surfacedCount ?? 0,
    latentCount: result?.latentCount ?? 0,
    snapshot: result
  };

  telemetryBuffer.push(event);
  if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
    telemetryBuffer.shift();
  }

  // 🧠 Persist surfaced candidates (NON-BLOCKING)
  try {
    appendFromTelemetryEvent(event);
  } catch (e) {
    console.error('[MoonshotRegistry] append failed', e);
  }

  // 🔵 EMIT TO SUBSCRIBERS (event-driven)
  for (const fn of subscribers) {
    try {
      fn(event);
    } catch (e) {
      console.error('[TelemetryBus] subscriber error', e);
    }
  }
}

function getTelemetrySnapshot() {
  return {
    size: telemetryBuffer.length,
    events: [...telemetryBuffer]
  };
}

function clearTelemetry() {
  telemetryBuffer = [];
}

module.exports = {
  recordScanEvent,
  getTelemetrySnapshot,
  clearTelemetry,
  subscribe
};
