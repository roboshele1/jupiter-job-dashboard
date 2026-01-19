// engine/symbolUniverse/resolveInvestableSymbol.js
// INVESTABLE SYMBOL ORCHESTRATOR — V4 (AUTHORITATIVE)
// --------------------------------------------------
// Single source of truth for symbol validity across:
// - Electron IPC
// - Discovery Lab
// - Manual research
// - All engines
//
// INSTITUTIONAL RULES (HARD):
// 1) TSX resolves ONLY explicit TSX symbols (.TO or TSX:)
// 2) Native crypto (BTC, ETH, etc.) has priority over ALL equity resolvers
// 3) Equity / ETF resolvers must NEVER override native crypto
// 4) Deterministic precedence
// 5) Fail-closed

import { tsxResolver } from "./resolvers/tsxResolver.js";
import { coinbaseResolver } from "./resolvers/coinbaseResolver.js";
import { polygonResolver } from "./resolvers/polygonResolver.js";
import { indexAliasResolver } from "./resolvers/indexAliasResolver.js";

export async function resolveInvestableSymbol(inputSymbol) {
  if (!inputSymbol || typeof inputSymbol !== "string") {
    return Object.freeze({
      valid: false,
      reason: "INVALID_INPUT"
    });
  }

  const symbol = inputSymbol.trim().toUpperCase();

  // ─────────────────────────────────────────────
  // 1️⃣ TSX — EXPLICIT ONLY (no guessing)
  // Accepts:
  // - RY.TO
  // - TSX:RY
  // Rejects:
  // - AAPL
  // - NVDA
  // ─────────────────────────────────────────────
  const isExplicitTsx =
    symbol.endsWith(".TO") || symbol.startsWith("TSX:");

  if (isExplicitTsx) {
    try {
      const tsx = await tsxResolver(symbol);
      if (tsx?.symbol) {
        return Object.freeze({
          valid: true,
          ...tsx
        });
      }
    } catch {
      // fail-closed, continue
    }
  }

  // ─────────────────────────────────────────────
  // 2️⃣ CRYPTO — NATIVE ASSET PRIORITY (AUTHORITATIVE)
  // BTC must resolve as Bitcoin, NEVER as an ETF
  // ─────────────────────────────────────────────
  try {
    const crypto = await coinbaseResolver(symbol);
    if (crypto?.symbol) {
      return Object.freeze({
        valid: true,
        ...crypto
      });
    }
  } catch {
    // continue
  }

  // ─────────────────────────────────────────────
  // 3️⃣ EQUITIES / ETFs — Polygon (US + ETFs)
  // Only reached if NOT crypto
  // ─────────────────────────────────────────────
  try {
    const equity = await polygonResolver(symbol);
    if (equity?.symbol) {
      return Object.freeze({
        valid: true,
        ...equity
      });
    }
  } catch {
    // continue
  }

  // ─────────────────────────────────────────────
  // 4️⃣ INDEX ALIASES (SPX, NDX, etc.)
  // ─────────────────────────────────────────────
  try {
    const index = await indexAliasResolver(symbol);
    if (index?.symbol) {
      return Object.freeze({
        valid: true,
        ...index
      });
    }
  } catch {
    // continue
  }

  // ─────────────────────────────────────────────
  // ❌ FAIL-CLOSED
  // ─────────────────────────────────────────────
  return Object.freeze({
    valid: false,
    reason: "UNRESOLVED_SYMBOL"
  });
}

export async function isInvestableSymbol(symbol) {
  const r = await resolveInvestableSymbol(symbol);
  return Boolean(r?.valid);
}

export default Object.freeze({
  resolveInvestableSymbol,
  isInvestableSymbol
});
