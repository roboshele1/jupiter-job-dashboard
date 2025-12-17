/**
 * JUPITER — Canonical Portfolio Schema
 * -----------------------------------
 * CommonJS ONLY.
 * This file defines and validates the canonical portfolio item shape.
 * No ES module syntax allowed.
 */

/**
 * Runtime guard to validate canonical portfolio items.
 */
function assertCanonicalPortfolioItem(item) {
  if (!item || typeof item !== "object") {
    throw new Error("Portfolio item is not an object");
  }

  const requiredFields = [
    "symbol",
    "assetClass",
    "quantity",
    "price",
    "marketValue"
  ];

  for (const field of requiredFields) {
    if (!(field in item)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof item.symbol !== "string" || item.symbol.length === 0) {
    throw new Error("Invalid symbol");
  }

  if (item.assetClass !== "EQUITY" && item.assetClass !== "CRYPTO") {
    throw new Error("Invalid assetClass");
  }

  const numericFields = ["quantity", "price", "marketValue"];

  for (const field of numericFields) {
    if (typeof item[field] !== "number" || !Number.isFinite(item[field])) {
      throw new Error(`Invalid numeric field: ${field}`);
    }
  }

  return true;
}

module.exports = {
  assertCanonicalPortfolioItem
};

