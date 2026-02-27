import React, { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// COLOUR TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:           "#060910",
  bgCard:       "#0b1120",
  bgCardAlt:    "#0d1526",
  border:       "#1a2540",
  borderDash:   "#253050",
  borderCrypto: "#1a3040",
  text:         "#e2e8f0",
  textMuted:    "#64748b",
  textDim:      "#94a3b8",
  accent:       "#3b82f6",
  accentCrypto: "#f59e0b",
  green:        "#22c55e",
  red:          "#ef4444",
  yellow:       "#eab308",
  purple:       "#a78bfa",
  uptrend:      "#22c55e",
  downtrend:    "#ef4444",
  range:        "#94a3b8",
  strong:       "#22c55e",
  weak:         "#ef4444",
  neutral:      "#64748b",
  add:          "#22c55e",
  trim:         "#ef4444",
  hold:         "#64748b",
  exit:         "#ef4444",
  font:         "'IBM Plex Mono', monospace",
};

// ─────────────────────────────────────────────
// FORMATTING HELPERS
// ─────────────────────────────────────────────
function fmt(n, decimals = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toFixed(decimals);
}

function fmtPct(n, decimals = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(decimals)}%`;
}

function fmtDollar(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtCryptoPrice(n) {
  if (!n) return "—";
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Distance of price from a moving average as a signed %
function distancePct(price, sma) {
  if (!price || !sma) return null;
  return ((price - sma) / sma) * 100;
}

// ─────────────────────────────────────────────
// COLOUR MAPS
// ─────────────────────────────────────────────
function trendColor(trend) {
  if (trend === "UPTREND") return C.uptrend;
  if (trend === "DOWNTREND") return C.downtrend;
  return C.range;
}

function momentumColor(mom) {
  if (mom === "STRONG") return C.strong;
  if (mom === "WEAK") return C.weak;
  return C.neutral;
}

function actionColor(action) {
  if (!action) return C.hold;
  const a = action.toUpperCase();
  if (a === "ADD") return C.add;
  if (a.startsWith("TRIM") || a.startsWith("EXIT")) return C.trim;
  return C.hold;
}

function deltaPctColor(d) {
  if (d > 0) return C.green;
  if (d < 0) return C.red;
  return C.textMuted;
}

function distanceColor(pct) {
  if (pct === null) return C.textMuted;
  if (pct > 15) return C.red;
  if (pct > 5) return C.yellow;
  if (pct < -10) return C.purple;
  if (pct < -3) return C.accent;
  return C.textDim;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function Pill({ label, color }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color,
      border: ` 1px solid ${color}40`,
      background: `${color}12`,
      fontFamily: C.font,
    }}>
      {label}
    </span>
  );
}

// Numeric distance badge: shows price vs SMA as signed %
function DistanceBadge({ label, price, sma, note }) {
  const d = distancePct(price, sma);
  if (d === null) return (
    <span style={{ color: C.textMuted, fontSize: 11, fontFamily: C.font }}>
      {label} —
    </span>
  );
  return (
    <span style={{ fontSize: 11, fontFamily: C.font, color: distanceColor(d) }} title={note || ""}>
      {label} <strong>{fmtPct(d, 1)}</strong>
    </span>
  );
}

// Goal anchor row — shown inside each equity card
function GoalAnchorRow({ symbol, kellyMap, portfolioValue, goal }) {
  const item = kellyMap?.get(symbol);

  const progressPct = goal?.progressPct ?? null;
  const requiredCAGR = goal?.requiredCAGR ?? null;

  // Contribution: this holding's current value as % of the $1M target
  const currentValue = item?.currentValue ?? null;
  const contributionPct = currentValue ? (currentValue / 1_000_000) * 100 : null;

  const action = item?.action ?? null;
  const currentPct = item?.currentPct ?? null;
  const optimalPct = item?.optimalPct ?? null;
  const deltaPct = item?.deltaPct ?? null;
  const conviction = item?.conviction ?? null;

  return (
    <div style={{
      marginTop: 14,
      paddingTop: 12,
      borderTop: ` 1px dashed ${C.borderDash}`,
      fontSize: 12,
      fontFamily: C.font,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: C.accent, textTransform: "uppercase" }}>
          Goal Context
        </span>
        {progressPct !== null && (
          <span style={{ fontSize: 10, color: C.textMuted }}>
            — portfolio {fmt(progressPct, 1)}% toward $1M
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px" }}>

        {/* Holding contribution to $1M goal */}
        {contributionPct !== null && (
          <div>
            <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Contributes to goal</div>
            <div style={{ color: C.textDim }}>
              {fmt(contributionPct, 2)}%
              {currentValue && (
                <span style={{ color: C.textMuted, marginLeft: 6 }}>({fmtDollar(currentValue)})</span>
              )}
            </div>
          </div>
        )}

        {/* Kelly sizing vs current */}
        {currentPct !== null && optimalPct !== null && (
          <div>
            <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Current / Kelly</div>
            <div>
              <span style={{ color: C.textDim }}>{fmt(currentPct, 1)}%</span>
              <span style={{ color: C.textMuted, margin: "0 4px" }}>/</span>
              <span style={{ color: C.textDim }}>{fmt(optimalPct, 1)}%</span>
              {deltaPct !== null && (
                <span style={{ marginLeft: 6, color: deltaPctColor(deltaPct) }}>
                  {fmtPct(deltaPct, 1)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Kelly action + conviction */}
        {action && (
          <div>
            <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Kelly signal</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Pill label={action} color={actionColor(action)} />
              {conviction && (
                <span style={{ fontSize: 10, color: C.textMuted }}>{conviction}</span>
              )}
            </div>
          </div>
        )}

        {/* Required CAGR reminder */}
        {requiredCAGR !== null && (
          <div>
            <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Req. CAGR</div>
            <div style={{ color: C.yellow }}>{fmt(requiredCAGR, 0)}% / yr</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Single equity technical card
function EquityCard({ s, kellyMap, portfolioValue, goal }) {
  const price = s.price;
  const sma20 = s.movingAverages?.sma20;
  const sma50 = s.movingAverages?.sma50;
  // sma200w: engine computes sma(weekly, 40) — label is aspirational, not literal (40-week SMA)
  const sma200w = s.movingAverages?.sma200w;

  return (
    <div style={{
      padding: 20,
      borderRadius: 12,
      border: ` 1px solid ${C.border}`,
      background: C.bgCard,
      fontFamily: C.font,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "0.04em" }}>
          {s.symbol}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {s.trend && s.trend !== "UNKNOWN" && (
            <Pill label={s.trend} color={trendColor(s.trend)} />
          )}
          {s.momentum && s.momentum !== "UNKNOWN" && (
            <Pill label={s.momentum} color={momentumColor(s.momentum)} />
          )}
        </div>
      </div>

      {/* Price + location */}
      <div style={{ marginTop: 10, display: "flex", gap: 20, fontSize: 13, color: C.textDim }}>
        <div>
          <span style={{ color: C.textMuted, fontSize: 11 }}>Price  </span>
          <span style={{ color: C.text }}>{price ? fmtCryptoPrice(price) : "—"}</span>
        </div>
        {s.location && s.location !== "UNKNOWN" && (
          <div>
            <span style={{ color: C.textMuted, fontSize: 11 }}>Location  </span>
            <span>{s.location.replace(/_/g, " ")}</span>
          </div>
        )}
      </div>

      {/* ── DIFFERENTIATING NUMERIC ROW ──────────────────── */}
      {/* Shows price distance from each MA as signed %, making every card unique */}
      <div style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: ` 1px solid ${C.border}`,
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 20px",
      }}>
        <DistanceBadge label="vs SMA20" price={price} sma={sma20} />
        <DistanceBadge label="vs SMA50" price={price} sma={sma50} />
        <DistanceBadge
          label="vs 40W"
          price={price}
          sma={sma200w}
          note="Engine computes 40-week SMA (field labelled sma200w)"
        />
      </div>

      {/* Raw SMA values — compact, secondary */}
      <div style={{ marginTop: 6, fontSize: 11, color: C.textMuted }}>
        SMA20 {fmt(sma20)}  |  SMA50 {fmt(sma50)}  |  40W {fmt(sma200w)}
        <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 10 }}>(40-wk, not 200-wk)</span>
      </div>

      {/* Interpretation */}
      {s.interpretation?.summary && (
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: ` 1px solid ${C.border}`,
          fontSize: 12,
          lineHeight: 1.6,
          color: C.textDim,
        }}>
          {s.interpretation.summary}
        </div>
      )}

      {/* Goal anchor (replaces dead "Portfolio Action" block) */}
      <GoalAnchorRow
        symbol={s.symbol}
        kellyMap={kellyMap}
        portfolioValue={portfolioValue}
        goal={goal}
      />
    </div>
  );
}

// Crypto panel — BTC + ETH live prices + cost basis context
function CryptoPanel({ cryptoPrices, cryptoLoading, cryptoError, kellyMap, goal, cryptoHoldings }) {
  // 🔒 Read from cryptoHoldings (passed from parent via holdings.json)
  // Fall back to empty array if not available
  const holdings = cryptoHoldings && cryptoHoldings.length > 0 
    ? cryptoHoldings 
    : [];

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: C.accentCrypto,
          textTransform: "uppercase",
          fontFamily: C.font,
        }}>
          Crypto Holdings
        </span>
        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.font }}>
          — SMA technicals unavailable (no equity history) — live price + P/L only
        </span>
      </div>

      {cryptoLoading && (
        <div style={{ color: C.textMuted, fontSize: 12, fontFamily: C.font, padding: "16px 0" }}>
          Fetching crypto prices…
        </div>
      )}

      {cryptoError && (
        <div style={{ color: C.red, fontSize: 12, fontFamily: C.font, padding: "16px 0" }}>
          Crypto price unavailable: {cryptoError}
        </div>
      )}

      {!cryptoLoading && !cryptoError && holdings.length === 0 && (
        <div style={{ color: C.textMuted, fontSize: 12, fontFamily: C.font, padding: "16px 0" }}>
          No crypto holdings in portfolio.
        </div>
      )}

      {!cryptoLoading && !cryptoError && holdings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {holdings.map(h => {
            const priceData = cryptoPrices?.[h.symbol];
            const livePrice = priceData?.price ?? null;
            const liveValue = livePrice ? livePrice * h.qty : null;
            const costBasis = h.totalCostBasis;
            const pl = liveValue !== null ? liveValue - costBasis : null;
            const plPct = pl !== null && costBasis > 0 ? (pl / costBasis) * 100 : null;

            // Kelly goal context
            const kellyItem = kellyMap?.get(h.symbol);
            const action = kellyItem?.action ?? null;
            const conviction = kellyItem?.conviction ?? null;
            const contributionPct = liveValue ? (liveValue / 1_000_000) * 100 : null;

            return (
              <div key={h.symbol} style={{
                padding: 18,
                borderRadius: 12,
                border: ` 1px solid ${C.borderCrypto}`,
                background: C.bgCardAlt,
                fontFamily: C.font,
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "0.04em" }}>
                      {h.symbol}
                    </span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: C.textMuted }}>
                      {h.label || h.symbol}
                    </span>
                  </div>
                  <Pill label="CRYPTO" color={C.accentCrypto} />
                </div>

                {/* Live price grid */}
                <div style={{
                  marginTop: 12,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 24px",
                  fontSize: 13,
                }}>
                  <div>
                    <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Live Price</div>
                    <div style={{ color: C.text }}>
                      {livePrice ? fmtCryptoPrice(livePrice) : "—"}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Qty</div>
                    <div style={{ color: C.textDim }}>{h.qty}</div>
                  </div>

                  <div>
                    <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Live Value</div>
                    <div style={{ color: C.text }}>
                      {liveValue ? fmtDollar(liveValue) : "—"}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Cost Basis</div>
                    <div style={{ color: C.textDim }}>{fmtDollar(costBasis)}</div>
                  </div>

                  {pl !== null && (
                    <div>
                      <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Unrealized P/L</div>
                      <div style={{ color: pl >= 0 ? C.green : C.red }}>
                        {pl >= 0 ? "+" : "−"}{fmtDollar(Math.abs(pl))}
                        {plPct !== null && (
                          <span style={{ marginLeft: 6, fontSize: 11 }}>
                            ({fmtPct(plPct, 1)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Goal context */}
                <div style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: ` 1px dashed ${C.borderDash}`,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 24px",
                  fontSize: 12,
                }}>
                  {contributionPct !== null && (
                    <div>
                      <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Contributes to goal</div>
                      <div style={{ color: C.textDim }}>{fmt(contributionPct, 2)}%</div>
                    </div>
                  )}

                  {action && (
                    <div>
                      <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Kelly signal</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Pill label={action} color={actionColor(action)} />
                        {conviction && <span style={{ fontSize: 10, color: C.textMuted }}>{conviction}</span>}
                      </div>
                    </div>
                  )}

                  {goal?.requiredCAGR !== null && (
                    <div>
                      <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Req. CAGR</div>
                      <div style={{ color: C.yellow }}>{fmt(goal.requiredCAGR, 0)}% / yr</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted, opacity: 0.55 }}>
                  Technical indicators (SMA, momentum, trend) are not available for crypto holdings.
                  Price sourced from Coinbase.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Goal summary banner — top of page
function GoalBanner({ goal, portfolioValue, heatCheck }) {
  if (!goal) return null;

  return (
    <div style={{
      padding: "16px 20px",
      borderRadius: 10,
      border: ` 1px solid ${C.accent}30`,
      background: `${C.accent}08`,
      fontFamily: C.font,
      marginBottom: 24,
      display: "flex",
      flexWrap: "wrap",
      gap: "12px 32px",
      alignItems: "center",
    }}>
      <div>
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Goal Progress
        </div>
        <div style={{ fontSize: 13, color: C.text }}>
          <span style={{ color: C.accent, fontWeight: 700 }}>{fmt(goal.progressPct, 1)}%</span>
          <span style={{ color: C.textMuted, marginLeft: 6 }}>of $1M</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Portfolio Value
        </div>
        <div style={{ fontSize: 13, color: C.text }}>
          {portfolioValue ? fmtDollar(portfolioValue) : "—"}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Remaining
        </div>
        <div style={{ fontSize: 13, color: C.textDim }}>
          {goal.remaining ? fmtDollar(goal.remaining) : "—"}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Req. CAGR
        </div>
        <div style={{ fontSize: 13, color: C.yellow, fontWeight: 700 }}>
          {fmt(goal.requiredCAGR, 0)}% / yr
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Months to 2037
        </div>
        <div style={{ fontSize: 13, color: C.textDim }}>
          {goal.monthsRemaining ?? "—"}
        </div>
      </div>

      {heatCheck && (
        <div>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Portfolio Heat
          </div>
          <div style={{ fontSize: 13 }}>
            <Pill
              label={heatCheck.status}
              color={
                heatCheck.status === "OVERHEATED" ? C.red :
                heatCheck.status === "ELEVATED" ? C.yellow : C.green
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function Signals() {
  const [techSnapshot, setTechSnapshot] = useState(null);
  const [kellyData, setKellyData]       = useState(null);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [holdings, setHoldings]         = useState([]);

  const [status, setStatus]             = useState("loading");
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [cryptoError, setCryptoError]   = useState(null);
  const [refreshing, setRefreshing]     = useState(false);

  // ── Load equity technicals + Kelly in parallel ─────────
  const loadAll = useCallback(async () => {
    try {
      const [tech, kelly, hdgs] = await Promise.all([
        window.jupiter.invoke("portfolio:technicalSignals:getSnapshot"),
        window.jupiter.invoke("decisions:getKellyRecommendations"),
        window.jupiter.invoke("holdings:getRaw"),
      ]);
      setTechSnapshot(tech);
      setKellyData(kelly);
      setHoldings(Array.isArray(hdgs) ? hdgs : []);
      setStatus("ready");
    } catch (e) {
      console.error("[SIGNALS_LOAD_ERROR]", e);
      setStatus("error");
    }
  }, []);

  // ── Load crypto prices separately (non-blocking) ───────
  const loadCrypto = useCallback(async () => {
    setCryptoLoading(true);
    setCryptoError(null);
    try {
      const [btc, eth] = await Promise.all([
        window.jupiter.invoke("price:getCryptoLive", "BTC"),
        window.jupiter.invoke("price:getCryptoLive", "ETH"),
      ]);
      setCryptoPrices({
        BTC: btc,
        ETH: eth,
      });
    } catch (e) {
      console.error("[SIGNALS_CRYPTO_ERROR]", e);
      setCryptoError(e?.message ?? "Coinbase unavailable");
    } finally {
      setCryptoLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([loadAll(), loadCrypto()]).then(() => {
      if (!alive) return;
    });
    return () => { alive = false; };
  }, [loadAll, loadCrypto]);

  // ── Manual refresh ─────────────────────────────────────
  async function handleRefresh() {
    try {
      setRefreshing(true);
      await window.jupiter.invoke("portfolio:refreshValuation");
      await Promise.all([loadAll(), loadCrypto()]);
    } catch (e) {
      console.error("[SIGNALS_REFRESH_ERROR]", e);
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }

  // ── Build Kelly lookup map (symbol -> action item) ─────
  const kellyMap = React.useMemo(() => {
    const map = new Map();
    if (Array.isArray(kellyData?.actions)) {
      for (const item of kellyData.actions) {
        map.set(item.symbol, item);
      }
    }
    return map;
  }, [kellyData]);

  // ── Extract crypto holdings from holdings.json ────────────
  // 🔒 Read BTC/ETH directly from holdings (source of truth)
  const cryptoHoldings = React.useMemo(() => {
    return holdings.filter(h => (h.symbol === "BTC" || h.symbol === "ETH"))
      .map(h => ({
        symbol: h.symbol,
        qty: h.qty || 0,
        totalCostBasis: h.totalCostBasis || 0,
        label: h.symbol === "BTC" ? "Bitcoin" : "Ethereum",
      }));
  }, [holdings]);

  // ── Render states ──────────────────────────────────────
  if (status === "loading") {
    return (
      <div style={{ padding: 32, fontFamily: C.font, color: C.textMuted, background: C.bg, minHeight: "100vh" }}>
        Loading technical analysis…
      </div>
    );
  }

  if (status === "error" || !techSnapshot) {
    return (
      <div style={{ padding: 32, fontFamily: C.font, color: C.textMuted, background: C.bg, minHeight: "100vh", opacity: 0.6 }}>
        Technical analysis unavailable.
      </div>
    );
  }

  const cryptoSymbols = new Set(["BTC", "ETH"]);
  const equitySymbols = Object.values(techSnapshot.symbols || {}).filter(
    s => !cryptoSymbols.has(s.symbol) && s.state !== "UNAVAILABLE"
  );

  const goal = kellyData?.goal ?? null;
  const portfolioValue = kellyData?.portfolioValue ?? null;
  const heatCheck = kellyData?.heatCheck ?? null;

  return (
    <div style={{
      padding: 32,
      background: C.bg,
      minHeight: "100vh",
      fontFamily: C.font,
      color: C.text,
    }}>
      {/* Page title + refresh */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "0.04em", color: C.text }}>
            Signals
          </h1>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            Portfolio technical analysis — equity + crypto — goal-anchored
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: ` 1px solid ${C.border}`,
            background: "transparent",
            color: refreshing ? C.textMuted : C.textDim,
            fontSize: 12,
            fontFamily: C.font,
            cursor: refreshing ? "default" : "pointer",
            letterSpacing: "0.04em",
          }}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Goal banner */}
      <GoalBanner
        goal={goal}
        portfolioValue={portfolioValue}
        heatCheck={heatCheck}
      />

      {/* ── EQUITY SECTION ────────────────────────────────── */}
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: C.accent,
        textTransform: "uppercase",
        marginBottom: 12,
      }}>
        Equity Holdings
      </div>

      {equitySymbols.length === 0 && (
        <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 24 }}>
          No eligible equity holdings for technical analysis.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {equitySymbols.map(s => (
          <EquityCard
            key={s.symbol}
            s={s}
            kellyMap={kellyMap}
            portfolioValue={portfolioValue}
            goal={goal}
          />
        ))}
      </div>

      {/* ── CRYPTO SECTION ────────────────────────────────── */}
      <CryptoPanel
        cryptoPrices={cryptoPrices}
        cryptoLoading={cryptoLoading}
        cryptoError={cryptoError}
        kellyMap={kellyMap}
        goal={goal}
        cryptoHoldings={cryptoHoldings}
      />

      {/* Snapshot timestamp */}
      <div style={{ marginTop: 24, fontSize: 11, color: C.textMuted, opacity: 0.4 }}>
        Snapshot: {techSnapshot.asOf ? new Date(techSnapshot.asOf).toLocaleString() : "—"}
        {kellyData?.timestamp && (
          <span style={{ marginLeft: 16 }}>
            Kelly: {new Date(kellyData.timestamp).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
