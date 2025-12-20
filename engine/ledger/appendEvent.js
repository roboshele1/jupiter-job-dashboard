"use strict";

const os = require("os");
const crypto = require("crypto");
const { LEDGER_VERSION, validateEvent } = require("./eventSchema");
const { createEventStore } = require("./eventStore");

function makeId() {
  // deterministic-enough: ts + 6 random bytes
  const ts = Date.now().toString(36);
  const rnd = crypto.randomBytes(6).toString("hex");
  return `${ts}-${rnd}`;
}

function baseMeta(extra = {}) {
  return Object.assign(
    {
      host: os.hostname(),
      user: process.env.USER || process.env.USERNAME || "unknown",
      pid: process.pid,
      cwd: process.cwd(),
    },
    extra || {}
  );
}

/**
 * Create a canonical event object.
 */
function buildEvent({ type, source, payload = {}, meta = {} }) {
  return {
    v: LEDGER_VERSION,
    id: makeId(),
    ts: Date.now(),
    type,
    source,
    payload: payload || {},
    meta: baseMeta(meta),
  };
}

/**
 * Append an event to the ledger.
 * Returns { ok, event?, error? }
 */
function appendEvent(input, opts = {}) {
  const store = createEventStore(opts.store || {});
  const event = buildEvent(input);

  const v = validateEvent(event);
  if (!v.ok) return { ok: false, error: v.error };

  store.appendJson(event);
  return { ok: true, event };
}

module.exports = {
  appendEvent,
  buildEvent,
};

