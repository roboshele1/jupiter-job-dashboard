"use strict";

const { appendEvent, EVENT_TYPES } = require("./index");

/**
 * Bootstrap hook for V2.
 * Called once per app lifecycle to mark ledger continuity.
 */
function bootstrapLedger() {
  appendEvent({
    type: EVENT_TYPES.SYSTEM_NOTE,
    source: "engine",
    payload: {
      note: "Ledger bootstrap complete",
    },
  });
}

module.exports = { bootstrapLedger };

