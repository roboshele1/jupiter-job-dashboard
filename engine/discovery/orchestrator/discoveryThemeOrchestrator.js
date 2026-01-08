/**
 * DISCOVERY THEMES ORCHESTRATOR (D10.4)
 * -----------------------------------
 * Deterministic, read-only theme synthesis.
 *
 * Input:
 *   - canonical: ranked discovery results (array)
 *
 * Output:
 *   - { themes: Theme[] }
 *
 * Rules:
 *   - NO ML
 *   - NO mutation
 *   - Deterministic bucketing via tags/factors/regimes
 *   - Stable ordering
 */

function buildThemes({ canonical = [] }) {
  if (!Array.isArray(canonical)) {
    throw new Error("INVALID_INPUT: canonical must be an array");
  }

  // ---------- Helper: safe getters ----------
  const get = (obj, path, dflt) =>
    path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) ??
    dflt;

  // ---------- Tag rules (deterministic) ----------
  // Each rule returns true/false for inclusion.
  const THEME_RULES = [
    {
      themeId: "AI_INFRASTRUCTURE",
      label: "AI Infrastructure",
      drivers: ["growth", "quality", "momentum"],
      regimes: ["RISK_ON_GROWTH", "INFLATIONARY_EXPANSION"],
      test: (r) => {
        const sym = get(r, "symbol.symbol", "").toUpperCase();
        const growth = get(r, "fundamentals.factors.growth", 0);
        const momentum = get(r, "tactical.breakdown.momentum", 0);
        return (
          ["NVDA", "ASML", "AVGO", "TSM"].includes(sym) ||
          (growth >= 0.6 && momentum >= 0.4)
        );
      },
    },
    {
      themeId: "SPECULATIVE_CRYPTO_BETA",
      label: "Speculative Crypto Beta",
      drivers: ["momentum", "risk"],
      regimes: ["RISK_ON_GROWTH"],
      test: (r) => {
        const sym = get(r, "symbol.symbol", "").toUpperCase();
        const momentum = get(r, "tactical.breakdown.momentum", 0);
        return ["BTC", "ETH", "MSTR"].includes(sym) || momentum >= 0.7;
      },
    },
    {
      themeId: "QUALITY_COMPOUNDERS",
      label: "Quality Compounders",
      drivers: ["quality", "growth"],
      regimes: ["TIGHT_MONETARY", "RISK_OFF_DEFENSIVE"],
      test: (r) => {
        const quality = get(r, "fundamentals.factors.quality", 0);
        const growth = get(r, "fundamentals.factors.growth", 0);
        return quality >= 0.7 && growth >= 0.4;
      },
    },
    {
      themeId: "TACTICAL_MOMENTUM",
      label: "Tactical Momentum",
      drivers: ["momentum"],
      regimes: ["RISK_ON_GROWTH"],
      test: (r) => {
        const momentum = get(r, "tactical.breakdown.momentum", 0);
        return momentum >= 0.8;
      },
    },
  ];

  // ---------- Build buckets ----------
  const buckets = {};
  THEME_RULES.forEach((rule) => {
    buckets[rule.themeId] = {
      themeId: rule.themeId,
      label: rule.label,
      drivers: rule.drivers.slice(),
      regimes: rule.regimes.slice(),
      symbols: [],
      _scores: [],
    };
  });

  canonical.forEach((r) => {
    THEME_RULES.forEach((rule) => {
      if (rule.test(r)) {
        const sym = get(r, "symbol.symbol", "UNKNOWN");
        const score = get(r, "conviction.normalized", 0);
        buckets[rule.themeId].symbols.push(sym);
        buckets[rule.themeId]._scores.push(score);
      }
    });
  });

  // ---------- Finalize themes ----------
  const themes = Object.values(buckets)
    .filter((b) => b.symbols.length >= 2) // minimum cluster size
    .map((b) => {
      const avg =
        b._scores.length > 0
          ? b._scores.reduce((a, c) => a + c, 0) / b._scores.length
          : 0;

      const confidence =
        avg >= 0.7 ? "High" : avg >= 0.4 ? "Medium" : "Low";

      return Object.freeze({
        themeId: b.themeId,
        label: b.label,
        explanation:
          "This theme exists because multiple assets share aligned drivers and respond similarly under certain regimes, creating a repeatable structural pattern rather than an isolated signal.",
        drivers: b.drivers,
        regimes: b.regimes,
        symbols: Array.from(new Set(b.symbols)).sort(),
        confidence,
      });
    })
    // stable ordering
    .sort((a, b) => a.label.localeCompare(b.label));

  return Object.freeze({ themes });
}

module.exports = Object.freeze({
  buildThemes,
});
