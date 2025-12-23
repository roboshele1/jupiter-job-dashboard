// renderer/portfolio/portfolioLiveOverlay.js
// Phase 6 — Portfolio Live Overlay Adapter (UI-only)
// Snapshot = truth; Live prices = paint
// No mutations, no IPC, no side effects

/**
 * Build a UI-only live overlay for portfolio rows.
 *
 * @param {Array} snapshotHoldings - frozen holdings from snapshot
 * @param {Object} livePrices - map { SYMBOL: { price, currency } }
 * @returns {Array} overlayRows
 */
export function buildPortfolioLiveOverlay(snapshotHoldings = [], livePrices = {}) {
  if (!Array.isArray(snapshotHoldings) || snapshotHoldings.length === 0) {
    return [];
  }

  return snapshotHoldings.map(h => {
    const lp = livePrices[h.symbol];
    const livePrice =
      lp && typeof lp.price === "number" ? lp.price : null;

    const snapshotValue =
      typeof h.value === "number" ? h.value : null;

    const liveValue =
      livePrice != null && typeof h.quantity === "number"
        ? h.quantity * livePrice
        : null;

    const liveDelta =
      liveValue != null && snapshotValue != null
        ? liveValue - snapshotValue
        : null;

    const liveDeltaPct =
      liveDelta != null && snapshotValue > 0
        ? (liveDelta / snapshotValue) * 100
        : null;

    return {
      // frozen snapshot fields (pass-through)
      symbol: h.symbol,
      quantity: h.quantity,
      snapshotPrice: h.price ?? null,
      snapshotValue: snapshotValue,

      // UI-only live overlay fields
      livePrice: livePrice,
      liveValue: liveValue,
      liveDelta: liveDelta,
      liveDeltaPct: liveDeltaPct,

      // UI flags
      hasLivePrice: livePrice != null
    };
  });
}

