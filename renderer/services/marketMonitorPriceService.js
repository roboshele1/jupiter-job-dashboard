import axios from "axios";

/**
 * Market Monitor price fetcher
 * - Coinbase: public REST
 * - Polygon: uses SAME env bridge as rest of app (window.env)
 * - Read-only, delayed equities (prev close)
 */

const POLYGON_KEY =
  window?.env?.POLYGON_API_KEY ||
  window?.env?.POLYGON_KEY ||
  null;

export async function fetchMarketMonitorPrices(holdings) {
  const results = {};

  for (const h of holdings) {
    const { symbol, source } = h;

    try {
      // ---- CRYPTO (Coinbase) ----
      if (source === "coinbase") {
        const pair = symbol === "BTC" ? "BTC-USD" : `${symbol}-USD`;
        const res = await axios.get(
          `https://api.coinbase.com/v2/prices/${pair}/spot`
        );

        results[symbol] = {
          ok: true,
          price: Number(res.data.data.amount),
          source: "coinbase"
        };
        continue;
      }

      // ---- EQUITIES (Polygon – delayed prev close) ----
      if (source === "polygon") {
        if (!POLYGON_KEY) {
          results[symbol] = {
            ok: false,
            error: "polygon_missing_key",
            source: "polygon"
          };
          continue;
        }

        const res = await axios.get(
          `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`,
          {
            params: {
              adjusted: true,
              apiKey: POLYGON_KEY
            }
          }
        );

        const price = res?.data?.results?.[0]?.c;

        results[symbol] = price
          ? { ok: true, price, source: "polygon" }
          : { ok: false, error: "no_price", source: "polygon" };
      }
    } catch (err) {
      results[symbol] = {
        ok: false,
        error: err?.message || "fetch_error",
        source
      };
    }
  }

  return results;
}

