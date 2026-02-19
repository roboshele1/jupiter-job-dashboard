// electron/renderer/src/pages/Risk.jsx
// Risk Centre — reads live portfolio state, no hardcoded holdings, no directional bias

import { useEffect, useState } from "react";
import { fetchLiveQuotes } from "../services/marketData";

// ─── Portfolio store ──────────────────────────────────────────────────────────
// Reads from localStorage key "jupiter_holdings" so it stays in sync with
// whatever the user has entered in the Portfolio page.
// Expected shape: [{ symbol: "AAPL", shares: 50 }, ...]
function getHoldings() {
  try {
    const raw = localStorage.getItem("jupiter_holdings");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  // Fallback: empty — user must add holdings via Portfolio page
  return [];
}

// ─── Risk scoring (signal-neutral) ───────────────────────────────────────────
function scoreConcentration(maxPct) {
  if (maxPct > 60) return { level: "HIGH", color: "#ef4444" };
  if (maxPct > 40) return { level: "ELEVATED", color: "#f97316" };
  if (maxPct > 25) return { level: "MODERATE", color: "#eab308" };
  return { level: "LOW", color: "#22c55e" };
}

function scoreVolatilityProxy(rows) {
  // Uses high-low spread as a rough intraday volatility proxy — no buy/sell signal
  const avgSpread =
    rows.reduce((sum, r) => {
      if (!r.high || !r.low || !r.price) return sum;
      return sum + (r.high - r.low) / r.price;
    }, 0) / (rows.length || 1);
  const pct = (avgSpread * 100).toFixed(2);
  if (avgSpread > 0.04) return { pct, level: "HIGH", color: "#ef4444" };
  if (avgSpread > 0.02) return { pct, level: "MODERATE", color: "#eab308" };
  return { pct, level: "LOW", color: "#22c55e" };
}

function herfindahlIndex(rows, total) {
  // HHI: 0–10000. >2500 = highly concentrated, 1500–2500 = moderate, <1500 = diversified
  if (!total) return 0;
  return rows.reduce((sum, r) => {
    const share = (r.value / total) * 100;
    return sum + share * share;
  }, 0);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const card = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: 8,
  padding: "16px 20px",
  marginBottom: 12
};

const badge = (color) => ({
  display: "inline-block",
  background: color + "22",
  color,
  border: `1px solid ${color}55`,
  borderRadius: 4,
  padding: "2px 8px",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 1
});

const th = { textAlign: "left", padding: "8px 12px", color: "#666", fontSize: 12, fontWeight: 500, borderBottom: "1px solid #1e1e1e" };
const td = (align = "left") => ({ padding: "10px 12px", textAlign: align, fontSize: 13, borderBottom: "1px solid #111" });

// ─── Component ────────────────────────────────────────────────────────────────
export default function Risk() {
  const [rows, setRows]       = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const holdings = getHoldings();

      if (!holdings.length) {
        setRows([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      const symbols = holdings.map(h => h.symbol);
      const quotes  = await fetchLiveQuotes(symbols);

      const enriched = holdings.map(h => {
        const q     = quotes[h.symbol] || {};
        const price = q.price  ?? 0;
        const high  = q.high   ?? 0;
        const low   = q.low    ?? 0;
        const vol   = q.volume ?? 0;
        const value = price * h.shares;
        return { symbol: h.symbol, shares: h.shares, price, high, low, vol, value };
      });

      const totalValue = enriched.reduce((s, r) => s + r.value, 0);

      const withAlloc = enriched.map(r => ({
        ...r,
        allocationPct: totalValue ? (r.value / totalValue) * 100 : 0
      }));

      const maxAlloc  = Math.max(...withAlloc.map(r => r.allocationPct));
      const hhi       = herfindahlIndex(withAlloc, totalValue);
      const concScore = scoreConcentration(maxAlloc);
      const volScore  = scoreVolatilityProxy(withAlloc);

      let hhiLabel, hhiColor;
      if (hhi > 2500)      { hhiLabel = "Highly Concentrated"; hhiColor = "#ef4444"; }
      else if (hhi > 1500) { hhiLabel = "Moderately Concentrated"; hhiColor = "#f97316"; }
      else                 { hhiLabel = "Diversified"; hhiColor = "#22c55e"; }

      setSummary({ totalValue, maxAlloc, concScore, volScore, hhi, hhiLabel, hhiColor, count: holdings.length });
      setRows(withAlloc);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ── Empty state
  const holdings = getHoldings();
  if (!loading && !error && holdings.length === 0) {
    return (
      <div style={{ padding: 24, color: "#fff" }}>
        <Header lastUpdated={lastUpdated} onRefresh={load} />
        <div style={{ ...card, color: "#666", textAlign: "center", padding: 40 }}>
          No holdings found. Add positions in the <strong style={{ color: "#fff" }}>Portfolio</strong> page first.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: "#fff", maxWidth: 960 }}>
      <Header lastUpdated={lastUpdated} onRefresh={load} loading={loading} />

      {error && (
        <div style={{ ...card, border: "1px solid #ef444455", color: "#ef4444" }}>
          ⚠ {error}
        </div>
      )}

      {loading && !summary && (
        <div style={{ ...card, color: "#666" }}>Loading risk data…</div>
      )}

      {summary && (
        <>
          {/* ── Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <MetricCard
              label="Portfolio Value"
              value={`$${summary.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`${summary.count} position${summary.count !== 1 ? "s" : ""}`}
            />
            <MetricCard
              label="Concentration Risk"
              value={<span style={badge(summary.concScore.color)}>{summary.concScore.level}</span>}
              sub={`Largest position: ${summary.maxAlloc.toFixed(1)}%`}
            />
            <MetricCard
              label="Portfolio HHI"
              value={<span style={badge(summary.hhiColor)}>{summary.hhiLabel}</span>}
              sub={`HHI score: ${summary.hhi.toFixed(0)}`}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
            <MetricCard
              label="Avg Intraday Range (Volatility Proxy)"
              value={<span style={badge(summary.volScore.color)}>{summary.volScore.level}</span>}
              sub={`Avg H-L spread: ${summary.volScore.pct}% of price`}
            />
            <MetricCard
              label="Diversification"
              value={summary.count < 3 ? <span style={badge("#ef4444")}>UNDERDIVERSIFIED</span> : summary.count < 6 ? <span style={badge("#eab308")}>MODERATE</span> : <span style={badge("#22c55e")}>DIVERSIFIED</span>}
              sub={`${summary.count} holdings — target: 8–15 for broad diversification`}
            />
          </div>

          {/* ── Position table */}
          <div style={card}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Position Breakdown</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Symbol", "Shares", "Last Price", "Value", "Allocation", "H-L Range"].map((h, i) => (
                    <th key={h} style={{ ...th, textAlign: i > 1 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const range = r.high && r.low ? `$${r.low.toFixed(2)} – $${r.high.toFixed(2)}` : "—";
                  const barW  = `${r.allocationPct.toFixed(1)}%`;
                  return (
                    <tr key={r.symbol} style={{ background: "#0d0d0d" }}>
                      <td style={td()}><strong>{r.symbol}</strong></td>
                      <td style={td("right")}>{r.shares.toLocaleString()}</td>
                      <td style={td("right")}>${r.price.toFixed(2)}</td>
                      <td style={td("right")}>${r.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={td("right")}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <div style={{ width: 60, height: 4, background: "#1e1e1e", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: barW, height: "100%", background: summary.concScore.color, borderRadius: 2 }} />
                          </div>
                          {r.allocationPct.toFixed(1)}%
                        </div>
                      </td>
                      <td style={td("right")}>{range}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Neutral observations — no buy/sell direction */}
          <div style={{ ...card, borderColor: "#1e1e1e" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Risk Observations</div>
            <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#aaa", fontSize: 13, lineHeight: 1.8 }}>
              {summary.maxAlloc > 40 && (
                <li>Single position exceeds 40% of portfolio — concentration risk is {summary.concScore.level.toLowerCase()}.</li>
              )}
              {summary.hhi > 2500 && (
                <li>HHI of {summary.hhi.toFixed(0)} indicates high portfolio concentration. A score below 1500 is generally considered diversified.</li>
              )}
              {summary.count < 3 && (
                <li>Portfolio holds fewer than 3 positions — idiosyncratic risk is high.</li>
              )}
              {summary.volScore.level === "HIGH" && (
                <li>Average intraday H-L spread exceeds 4% — positions are exhibiting elevated intraday movement.</li>
              )}
              {summary.maxAlloc <= 40 && summary.hhi <= 2500 && summary.count >= 3 && summary.volScore.level !== "HIGH" && (
                <li>No significant concentration or volatility flags at this time. Continue monitoring.</li>
              )}
            </ul>
            <div style={{ marginTop: 10, fontSize: 11, color: "#444" }}>
              Observations are factual and descriptive only. Jupiter does not make directional recommendations.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Header({ lastUpdated, onRefresh, loading }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>RISK CENTRE</h2>
        <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>Posture · Concentration · Correlation · Scenario Analysis</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {lastUpdated && <span style={{ fontSize: 11, color: "#444" }}>Updated {lastUpdated}</span>}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "6px 14px", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer", fontSize: 13 }}
        >
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#555" }}>{sub}</div>}
    </div>
  );
}
