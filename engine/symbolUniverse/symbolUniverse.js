// engine/symbolUniverse/symbolUniverse.js
// --------------------------------------
// Canonical symbol universe loader + validator
// Pure Node module (no Electron, no renderer)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let universeCache = null;

function loadUniverse() {
  if (universeCache) return universeCache;

  const universePath = path.resolve(__dirname, "../../data/symbolUniverse.json");

  if (!fs.existsSync(universePath)) {
    throw new Error("SYMBOL_UNIVERSE_MISSING");
  }

  const raw = fs.readFileSync(universePath, "utf8");
  const parsed = JSON.parse(raw);

  universeCache = parsed;
  return universeCache;
}

export function isValidSymbol(input) {
  if (!input || typeof input !== "string") return false;

  const symbol = input.trim().toUpperCase();
  if (!symbol) return false;

  const universe = loadUniverse();
  const entry = universe[symbol];

  return Boolean(entry && entry.active === true);
}

export function getSymbolMetadata(input) {
  if (!isValidSymbol(input)) return null;

  const symbol = input.trim().toUpperCase();
  const universe = loadUniverse();

  return universe[symbol] || null;
}
