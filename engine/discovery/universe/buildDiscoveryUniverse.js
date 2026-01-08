/**
 * D13.3 — AUTONOMOUS DISCOVERY UNIVERSE (PROGRESSIVE)
 * -------------------------------------------------
 * - No seeded symbols
 * - Deterministic
 * - Progressive relaxation (if universe too small)
 * - Transparent internal stats (future UI surfacing)
 *
 * OUTPUT CONTRACT (unchanged):
 * - Returns Array<{ symbol, tags }>
 */

const {
  getLiveMarketSnapshot,
} = require("../../market/live/liveMarketSnapshotService.js");

const HARD_CAP = 60;
const MIN_UNIVERSE_SIZE = 15;

/**
 * Progressive filter tiers (deterministic order)
 */
const FILTER_TIERS = Object.freeze([
  { minVolume: 1_000_000 },
  { minVolume: 750_000 },
  { minVolume: 500_000 },
  { minVolume: 250_000 },
]);

async function buildDiscoveryUniverse() {
  const snapshot = await getLiveMarketSnapshot({
    scope: "DISCOVERY_UNIVERSE",
  });

  const data = Array.isArray(snapshot?.data) ? snapshot.data : [];

  const stats = {
    scanned: data.length,
    tierUsed: null,
    passedLiquidity: 0,
    capped: false,
  };

  let selected = [];

  for (const tier of FILTER_TIERS) {
    selected = data
      .filter(a => a && a.symbol && a.volume && a.price)
      .filter(a => a.volume >= tier.minVolume)
      .sort((a, b) => {
        if (b.volume !== a.volume) return b.volume - a.volume;
        return a.symbol.localeCompare(b.symbol);
      });

    stats.passedLiquidity = selected.length;

    if (selected.length >= MIN_UNIVERSE_SIZE) {
      stats.tierUsed = tier.minVolume;
      break;
    }
  }

  if (selected.length > HARD_CAP) {
    selected = selected.slice(0, HARD_CAP);
    stats.capped = true;
  }

  const universe = selected.map(a =>
    Object.freeze({
      symbol: a.symbol,
      tags: deriveTags(a),
    })
  );

  // Intentionally not returned yet (D13.4 will surface)
  // console.log("[DISCOVERY_UNIVERSE_STATS]", stats);

  return Object.freeze(universe);
}

function deriveTags(asset) {
  const tags = [];

  if (asset.marketCap) {
    if (asset.marketCap > 200_000_000_000) tags.push("mega_cap");
    else if (asset.marketCap > 10_000_000_000) tags.push("large_cap");
    else tags.push("mid_small_cap");
  }

  if (asset.volatility != null) {
    if (asset.volatility > 0.05) tags.push("high_beta");
    else tags.push("low_beta");
  }

  if (asset.assetClass) {
    tags.push(asset.assetClass);
  }

  return Object.freeze(tags);
}

module.exports = Object.freeze({
  buildDiscoveryUniverse,
});
