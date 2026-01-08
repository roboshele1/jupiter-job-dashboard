import React, { useEffect, useState } from "react";

const badgeStyle = (level) => {
  const map = {
    High: "#2ecc71",
    Medium: "#f1c40f",
    Low: "#e67e22",
    AVOID: "#e74c3c",
    HOLD: "#3498db",
    BUY: "#2ecc71",
    BUY_MORE: "#1abc9c",
  };
  return {
    display: "inline-block",
    padding: "0.25rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    background: map[level] || "#777",
    color: "#000",
    fontWeight: 600,
  };
};

export default function DiscoveryLab() {
  const [rows, setRows] = useState([]);
  const [themes, setThemes] = useState([]);
  const [watchlistCandidates, setWatchlistCandidates] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        const discovery = await window.jupiter.invoke("discovery:run");
        const watchlist = await window.jupiter.invoke("watchlist:candidates");

        if (!mounted) return;

        setRows(discovery?.canonical || []);
        setThemes(discovery?.emergingThemes?.themes || []);
        setTelemetry(discovery?.telemetry || null);
        setWatchlistCandidates(watchlist?.candidates || []);
      } catch (err) {
        console.error("Discovery Lab load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading discovery intelligence…</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1400 }}>
      <h1>Discovery Lab</h1>
      <p style={{ opacity: 0.75 }}>
        Autonomous market discovery · Read-only · Shadow mode
      </p>

      {/* ================= TELEMETRY ================= */}
      {rows.length === 0 && telemetry && (
        <div
          style={{
            marginTop: "2rem",
            background: "#020617",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "1.25rem",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>
            Why nothing surfaced
          </h3>

          <ul style={{ paddingLeft: "1.2rem", opacity: 0.85 }}>
            {telemetry.notes.map((n, i) => (
              <li key={i} style={{ marginBottom: "0.4rem" }}>
                {n}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.75rem" }}>
            This is expected behavior. Jupiter will not surface assets unless
            conviction, regime alignment, and liquidity thresholds are met.
          </p>
        </div>
      )}

      {/* ================= EMERGING THEMES ================= */}
      <h3 style={{ marginTop: "3rem" }}>Emerging Themes</h3>
      {themes.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No structural themes detected.</p>
      ) : (
        themes.map((t) => (
          <div key={t.themeId} style={{ marginBottom: "1rem" }}>
            <strong>{t.label}</strong>
            <p style={{ opacity: 0.8 }}>{t.explanation}</p>
          </div>
        ))
      )}

      {/* ================= WATCHLIST ================= */}
      <h3 style={{ marginTop: "3rem" }}>Watchlist Candidates</h3>
      {watchlistCandidates.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No monitoring candidates.</p>
      ) : (
        watchlistCandidates.map((w) => (
          <div key={w.watchId} style={{ marginBottom: "0.6rem" }}>
            <strong>{w.symbol}</strong>
            <p style={{ opacity: 0.7 }}>{w.monitorReason}</p>
          </div>
        ))
      )}

      {/* ================= RANKED DISCOVERY ================= */}
      <h3 style={{ marginTop: "3rem" }}>Ranked Market Discovery</h3>
      {rows.length === 0 ? (
        <p style={{ opacity: 0.6 }}>
          No assets passed discovery thresholds.
        </p>
      ) : (
        <table width="100%" cellPadding="8">
          <thead>
            <tr>
              <th align="left">Rank</th>
              <th align="left">Symbol</th>
              <th align="left">Decision</th>
              <th align="right">Conviction</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank}>
                <td>#{r.rank}</td>
                <td>{r.symbol.symbol}</td>
                <td>{r.decision.decision}</td>
                <td align="right">
                  <span style={badgeStyle(r.conviction?.level || "Low")}>
                    {r.conviction?.level || "Low"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
