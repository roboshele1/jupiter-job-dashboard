/**
 * DISCOVERY THEMES ORCHESTRATOR (D10.4 — V3)
 * -------------------------------------------
 * Deterministic, read-only theme synthesis.
 *
 * V3 CHANGES:
 * - Zero hardcoded tickers. Theme membership is determined entirely by
 *   factor scores, asset class, and regime data from each canonical result.
 * - Theme rules are portable across any user's holdings.
 * - getSym() is robust: handles string, object, ticker fallback.
 * - Confidence is always High / Medium / Low — never UNKNOWN.
 * - Cluster filter is >= 1 (engine surfaces; UI decides what to render).
 * - Optional: caller may pass { userHoldings: string[] } to restrict
 *   theme membership to the user's actual portfolio (multi-user support).
 *
 * Input:  { canonical: DiscoveryResult[], userHoldings?: string[] }
 * Output: { themes: Theme[] }
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const get = (obj, path, dflt) =>
  path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) ?? dflt;

function getSym(r) {
  if (!r) return "";
  if (typeof r.symbol === "string" && r.symbol.length > 0) return r.symbol.toUpperCase();
  if (r.symbol && typeof r.symbol.symbol === "string") return r.symbol.symbol.toUpperCase();
  if (typeof r.ticker === "string" && r.ticker.length > 0) return r.ticker.toUpperCase();
  return "";
}

function getFactor(r, factorName) {
  return (
    get(r, `fundamentals.factors.${factorName}`,  null) ??
    get(r, `factorAttribution.${factorName}`,     null) ??
    get(r, `factors.${factorName}`,               null) ??
    0
  );
}

function getMomentum(r) {
  return (
    get(r, "tactical.breakdown.momentum",  null) ??
    get(r, "factorAttribution.momentum",   null) ??
    get(r, "tactical.score",               null) ??
    0
  );
}

function getAssetClass(r) {
  return (
    get(r, "symbol.assetClass",  "") ||
    get(r, "assetClass",         "") ||
    get(r, "assetType",          "")
  ).toLowerCase();
}

function getRegime(r) {
  return (get(r, "regime.label", "") || "").toUpperCase();
}

function getConviction(r) {
  return Number(
    get(r, "conviction.normalized", null) ??
    get(r, "conviction.score",      null) ??
    get(r, "score",                 0)
  ) || 0;
}

// ─── Theme rules — ZERO hardcoded tickers ────────────────────────────────────
// Rules are pure functions of factor/regime/assetClass data.
// They work identically for any user's portfolio.

const THEME_RULES = [
  {
    themeId: "AI_INFRASTRUCTURE",
    label:   "AI Infrastructure",
    drivers: ["growth", "quality", "momentum"],
    regimes: ["RISK_ON_GROWTH", "INFLATIONARY_EXPANSION"],
    test: (r) => {
      const growth     = getFactor(r, "growth");
      const quality    = getFactor(r, "quality");
      const momentum   = getMomentum(r);
      const assetClass = getAssetClass(r);
      return (
        assetClass !== "crypto" &&
        growth   >= 0.55 &&
        quality  >= 0.40 &&
        momentum >= 0.30
      );
    },
  },
  {
    themeId: "SPECULATIVE_CRYPTO_BETA",
    label:   "Speculative Crypto Beta",
    drivers: ["momentum", "volatility"],
    regimes: ["RISK_ON_GROWTH"],
    test: (r) => {
      const assetClass = getAssetClass(r);
      const momentum   = getMomentum(r);
      const volatility = getFactor(r, "volatility");
      const regime     = getRegime(r);
      return (
        assetClass === "crypto" ||
        (momentum >= 0.65 && volatility >= 0.50 && regime === "RISK_ON_GROWTH")
      );
    },
  },
  {
    themeId: "QUALITY_COMPOUNDERS",
    label:   "Quality Compounders",
    drivers: ["quality", "growth"],
    regimes: ["TIGHT_MONETARY", "RISK_OFF_DEFENSIVE", "SIDEWAYS"],
    test: (r) => {
      const quality  = getFactor(r, "quality");
      const growth   = getFactor(r, "growth");
      const momentum = getMomentum(r);
      return quality >= 0.65 && growth >= 0.35 && momentum >= 0.20;
    },
  },
  {
    themeId: "TACTICAL_MOMENTUM",
    label:   "Tactical Momentum",
    drivers: ["momentum"],
    regimes: ["RISK_ON_GROWTH"],
    test: (r) => {
      const momentum = getMomentum(r);
      const regime   = getRegime(r);
      return momentum >= 0.75 && (regime === "RISK_ON_GROWTH" || regime === "");
    },
  },
  {
    themeId: "FINTECH_MARKET_STRUCTURE",
    label:   "Fintech & Market Structure",
    drivers: ["growth", "momentum"],
    regimes: ["RISK_ON_GROWTH"],
    test: (r) => {
      const growth     = getFactor(r, "growth");
      const momentum   = getMomentum(r);
      const quality    = getFactor(r, "quality");
      const assetClass = getAssetClass(r);
      return (
        assetClass !== "crypto" &&
        growth   >= 0.40 &&
        momentum >= 0.40 &&
        quality  <  0.65
      );
    },
  },
  {
    themeId: "DEFENSIVE_QUALITY",
    label:   "Defensive Quality",
    drivers: ["quality", "value"],
    regimes: ["RISK_OFF_DEFENSIVE", "TIGHT_MONETARY", "RECESSIONARY"],
    test: (r) => {
      const quality    = getFactor(r, "quality");
      const value      = getFactor(r, "value");
      const assetClass = getAssetClass(r);
      const regime     = getRegime(r);
      return (
        assetClass !== "crypto" &&
        quality >= 0.70 &&
        value   >= 0.40 &&
        ["RISK_OFF_DEFENSIVE", "TIGHT_MONETARY", "RECESSIONARY"].includes(regime)
      );
    },
  },
];

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * buildThemes({ canonical, userHoldings? })
 *
 * @param {object}    params
 * @param {array}     params.canonical      — ranked discovery results
 * @param {string[]}  [params.userHoldings] — optional symbol list to scope themes
 *                                            to a specific user's portfolio
 * @returns {{ themes: Theme[] }}
 */
function buildThemes({ canonical = [], userHoldings = null }) {
  if (!Array.isArray(canonical)) {
    throw new Error("INVALID_INPUT: canonical must be an array");
  }

  // Multi-user hook: scope to caller's holdings if provided
  const working =
    userHoldings && userHoldings.length > 0
      ? canonical.filter(r => userHoldings.includes(getSym(r)))
      : canonical;

  // ── Build buckets ──────────────────────────────────────────────────────────
  const buckets = {};
  THEME_RULES.forEach((rule) => {
    buckets[rule.themeId] = {
      themeId: rule.themeId,
      label:   rule.label,
      drivers: rule.drivers.slice(),
      regimes: rule.regimes.slice(),
      symbols: [],
      _scores: [],
    };
  });

  working.forEach((r) => {
    THEME_RULES.forEach((rule) => {
      try {
        if (rule.test(r)) {
          const sym   = getSym(r) || "UNKNOWN";
          const score = getConviction(r);
          buckets[rule.themeId].symbols.push(sym);
          buckets[rule.themeId]._scores.push(score);
        }
      } catch {
        // never crash the scan on a bad result
      }
    });
  });

  // ── Finalise themes ────────────────────────────────────────────────────────
  const themes = Object.values(buckets)
    .filter((b) => b.symbols.length >= 1)
    .map((b) => {
      const avg =
        b._scores.length > 0
          ? b._scores.reduce((a, c) => a + c, 0) / b._scores.length
          : 0;

      // Always resolves — never UNKNOWN
      const confidence =
        avg >= 0.70           ? "High"   :
        avg >= 0.40           ? "Medium" :
        avg >= 0.10           ? "Low"    :
        b.symbols.length >= 3 ? "Medium" :
        "Low";

      const uniqueSymbols = Array.from(new Set(b.symbols)).sort();

      return Object.freeze({
        themeId:      b.themeId,
        label:        b.label,
        explanation:
          `Multiple assets exhibit aligned drivers (${b.drivers.join(", ")}) ` +
          `and respond similarly under certain regimes (${b.regimes.join(", ")}), ` +
          `creating a repeatable structural pattern rather than an isolated signal.`,
        drivers:      b.drivers,
        regimes:      b.regimes,
        symbols:      uniqueSymbols,
        memberCount:  uniqueSymbols.length,
        confidence,
        avgConviction: Number(avg.toFixed(4)),
      });
    })
    .sort((a, b) => b.avgConviction - a.avgConviction);

  return Object.freeze({ themes });
}

module.exports = Object.freeze({ buildThemes });
