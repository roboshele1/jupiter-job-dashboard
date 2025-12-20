/**
 * JUPITER — Portfolio Engine (V1 Canonical)
 * Authoritative snapshot + allocation normalization
 * SAFE main-process loading (no crash on renderer reloads)
 */

const holdings = require("../../engine/data/holdings");
const priceService = require("./priceService");

// ⚠️ IMPORTANT:
// signalRegistry is intentionally loaded lazily to avoid
// Electron main-process re-evaluation crashes on hot reloads.
function safeLoadSignalRegistry() {
  try {
    return require("./signalRegistry");
  } catch (err) {
    console.warn("[JUPITER] signalRegistry not available yet — continuing safely");
    return {
      resolveSignals: () => [],
    };
  }
}

async function getPortfolioSnapshot() {
  const prices = await priceService.getPrices();
  const { resolveSignals } = safeLoadSignalRegistry();

  const positions = [];
  let totalValue = 0;
  let equityValue = 0;
  let cryptoValue = 0;

  for (const h of holdings) {
    const price = prices[h.symbol];
    if (!price) continue;

    const marketValue = h.qty * price;
    const isCrypto = h.symbol === "BTC" || h.symbol === "ETH";

    totalValue += marketValue;
    if (isCrypto) cryptoValue += marketValue;
    else equityValue += marketValue;

    positions.push({
      symbol: h.symbol,
      qty: h.qty,
      price,
      marketValue,
      assetClass: isCrypto ? "crypto" : "equity",
    });
  }

  // 🔒 NORMALIZED ALLOCATION — TOTAL PORTFOLIO DENOMINATOR
  for (const p of positions) {
    p.allocationPct =
      totalValue > 0
        ? Number(((p.marketValue / totalValue) * 100).toFixed(2))
        : 0;
  }

  const signals = resolveSignals(
    totalValue > 0 && equityValue / totalValue > 0.6
      ? ["TOP_3_OVER_60"]
      : []
  );

  return {
    contract: "JUPITER_PORTFOLIO_SNAPSHOT_V1_STABLE",
    timestamp: Date.now(),
    currency: "USD",
    totalValue: Number(totalValue.toFixed(2)),
    equityValue: Number(equityValue.toFixed(2)),
    cryptoValue: Number(cryptoValue.toFixed(2)),
    equityPct: totalValue ? Number((equityValue / totalValue).toFixed(2)) : 0,
    cryptoPct: totalValue ? Number((cryptoValue / totalValue).toFixed(2)) : 0,
    positions,
    signals,
  };
}

module.exports = { getPortfolioSnapshot };

