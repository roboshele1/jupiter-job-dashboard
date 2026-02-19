import React, { useEffect, useState } from "react";

const confidenceBadge = (level) => ({
  display: "inline-block",
  padding: "0.25rem 0.6rem",
  borderRadius: "6px",
  fontSize: "0.75rem",
  background: { High: "#2ecc71", Medium: "#f1c40f", Low: "#e67e22" }[level] || "#777",
  color: "#000",
  fontWeight: 600,
});

const cell = { padding: "10px 8px", borderBottom: "1px solid #1a1a1a", fontSize: 13 };

export default function DiscoveryLab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts]   = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await window.jupiter.invoke("discovery:run");
        if (mounted && result) {
          setRows(Array.isArray(result.canonical) ? result.canonical : []);
          setCounts({
            evaluated: result.telemetry?.evaluatedCount ?? 0,
            surfaced:  result.canonical?.length ?? 0,
            rejected:  result.rejected?.length ?? 0,
            themes:    result.themes?.length ?? 0,
          });
        }
      } catch (err) {
        console.error("Discovery load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: 1400, color: "#fff" }}>
      <h1 style={{ marginBottom: 4 }}>Discovery Lab</h1>
      <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 24 }}>
        Pre-breakout intelligence surface · read-only · main-process discovery engine
      </p>

      {/* COUNTS */}
      {counts && (
        <div style={{ display: "flex", gap: 32, marginBottom: 24, fontSize: 13 }}>
          <span>EVALUATED <strong style={{ color: "#fff" }}>{counts.evaluated}</strong></span>
          <span>SURFACED <strong style={{ color: "#2ecc71" }}>{counts.surfaced}</strong></span>
          <span>REJECTED <strong style={{ color: "#e74c3c" }}>{counts.rejected}</strong></span>
        </div>
      )}

      {loading && <p style={{ opacity: 0.5 }}>Loading discovery…</p>}

      {!loading && rows.length === 0 && (
        <p style={{ opacity: 0.5 }}>No candidates surfaced this cycle.</p>
      )}

      {!loading && rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #333", fontSize: 11, color: "#666", letterSpacing: 1 }}>
              <th style={cell}>#</th>
              <th style={cell}>SYMBOL</th>
              <th style={cell}>NAME</th>
              <th style={cell}>PRICE</th>
              <th style={cell}>DECISION</th>
              <th style={cell}>REGIME</th>
              <th style={cell}>WHY SURFACED</th>
              <th style={{ ...cell, textAlign: "right" }}>CONFIDENCE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const confidence =
                r.conviction?.normalized >= 0.66 ? "High" :
                r.conviction?.normalized >= 0.33 ? "Medium" : "Low";

              const price = r.price != null
                ? `$${Number(r.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—";

              return (
                <tr key={r.rank} style={{ borderBottom: "1px solid #111" }}>
                  <td style={cell}>#{r.rank}</td>
                  <td style={{ ...cell, fontWeight: 700 }}>{r.symbol}</td>
                  <td style={{ ...cell, color: "#aaa" }}>{r.companyName || "—"}</td>
                  <td style={cell}>{price}</td>
                  <td style={cell}>{r.decision?.decision ?? "—"}</td>
                  <td style={cell}>{r.regime?.label ?? "—"}</td>
                  <td style={{ ...cell, opacity: 0.8, maxWidth: 300 }}>
                    {r.explanation?.plainEnglishSummary || "—"}
                  </td>
                  <td style={{ ...cell, textAlign: "right" }}>
                    <span style={confidenceBadge(confidence)}>{confidence}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 16, fontSize: 11, opacity: 0.4 }}>
        Discovery outputs are classification-only. No actions are executed.
      </p>
    </div>
  );
}
