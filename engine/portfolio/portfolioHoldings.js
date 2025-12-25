// engine/portfolio/portfolioHoldings.js

import fs from "fs/promises";
import path from "path";

const HOLDINGS_FILE = path.resolve(
  process.cwd(),
  "engine/portfolio/holdings.json"
);

/**
 * Canonical portfolio holdings loader
 * Engine-only, read-only
 */
export async function loadPortfolioHoldings() {
  try {
    const raw = await fs.readFile(HOLDINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Holdings file must be an array");
    }

    return parsed;
  } catch (err) {
    // Empty portfolio is a valid state
    return [];
  }
}

