"use strict";

/**
 * Canonical Event Schema (V2)
 * All ledger entries must conform.
 */

module.exports = {
  required: ["ts", "type", "source", "payload"],
};

