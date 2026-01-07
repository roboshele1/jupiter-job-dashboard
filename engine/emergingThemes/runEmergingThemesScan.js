/**
 * D10.5 — Emerging Themes Logic Engine (V2)
 * ----------------------------------------
 * Purpose:
 * - Derive emergent thematic clusters from Discovery results
 * - Deterministic, read-only, explainable
 *
 * INPUT:
 * - discoveryResults: Array of canonical Discovery outputs
 *
 * OUTPUT:
 * - themes[] describing repeated structural patterns
 *
 * NO UI
 * NO SCORING MUTATION
 * NO LIVE DATA
 */

function normalizeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function buildThemeKey({ regimes, drivers }) {
  return `${regimes.sort().join("|")}::${drivers.sort().join("|")}`;
}

function extractDrivers(result) {
  const attribution = result?.explanation?.factorAttribution || {};
  return Object.entries(attribution)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([k]) => k);
}

function extractRegime(result) {
  return result?.regime?.label ? [result.regime.label] : [];
}

function runEmergingThemesScan({ discoveryResults }) {
  const canonical = normalizeArray(discoveryResults);

  const buckets = {};

  canonical.forEach((r) => {
    const regimes = extractRegime(r);
    const drivers = extractDrivers(r);

    if (regimes.length === 0 || drivers.length === 0) return;

    const key = buildThemeKey({ regimes, drivers });

    if (!buckets[key]) {
      buckets[key] = {
        regimes,
        drivers,
        symbols: [],
      };
    }

    buckets[key].symbols.push(r.symbol?.symbol || r.symbol);
  });

  const themes = Object.values(buckets)
    .filter((b) => b.symbols.length >= 2)
    .map((b, idx) =>
      Object.freeze({
        themeId: `THEME_${idx + 1}`,
        label: `${b.drivers.join(" + ")} under ${b.regimes.join(", ")}`,
        drivers: b.drivers,
        regimes: b.regimes,
        symbols: b.symbols,
        confidence:
          b.symbols.length >= 4
            ? "high"
            : b.symbols.length === 3
            ? "medium"
            : "low",
        explanation: `Multiple assets exhibit shared drivers (${b.drivers.join(
          ", "
        )}) within the same macro regime (${b.regimes.join(
          ", "
        )}), suggesting a recurring structural theme.`,
      })
    );

  return Object.freeze({
    metadata: Object.freeze({
      contract: "EMERGING_THEMES_ENGINE_V2",
      generatedAt: new Date().toISOString(),
      inputCount: canonical.length,
      themeCount: themes.length,
    }),
    themes,
  });
}

module.exports = Object.freeze({
  runEmergingThemesScan,
});
