"use strict";

const fs = require("fs");
const path = require("path");

const LEDGER_DIR = path.join(__dirname, "../snapshots");
const LEDGER_FILE = path.join(LEDGER_DIR, "event_ledger.ndjson");

const EVENT_TYPES = {
  APP_START: "APP_START",
  APP_READY: "APP_READY",
  SNAPSHOT_CAPTURE: "SNAPSHOT_CAPTURE",
  ENGINE_OUTPUT: "ENGINE_OUTPUT",
  SYSTEM_NOTE: "SYSTEM_NOTE",
};

function appendEvent(event) {
  if (!fs.existsSync(LEDGER_DIR)) {
    fs.mkdirSync(LEDGER_DIR, { recursive: true });
  }

  const record = {
    ts: Date.now(),
    ...event,
  };

  fs.appendFileSync(LEDGER_FILE, JSON.stringify(record) + "\n");
}

module.exports = {
  appendEvent,
  EVENT_TYPES,
};

