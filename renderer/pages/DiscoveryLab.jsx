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
    STANDARD: "#95a5a6",
    RESTRICTED: "#e67e22",
    BLOCKED: "#c0392b",
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

const cadenceStyle = () => ({
  fontSize: "0.75rem",
  opacity: 0.7,
  marginLeft: "0.5rem",
});

const deltaStyle = (value) => ({
  color: value > 0 ? "#2ecc71" : value < 0 ? "#e74c3c" : "#aaa",
  fontWeight: 600,
});

export default function DiscoveryLab() {
  const [rows, setRows] = useState([]);
  const [themes, setThemes] = useState([]);
  const [watchlistCandidates, setWatchlistCandidates] = useState([]);
  const [divergenceMap, setDivergenceMap] = useState({});
  const [confidenceHistory, setConfidenceHistory] = useState([]);
  const [executionExposure, setExecutionExposure] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        const [discovery, watchlist, divergence] = await Promise.all([
          window.jupiter.invoke("discovery:run"),
          window.jupiter.invoke("watchlist:candidates"),
          window.jupiter.invoke("discovery:divergence:explanations"),
        ]);

        if (!mounted) return;

        setRows(discovery?.canonical || []);
        setThemes(discovery?.emergingThemes?.themes || []);
        setWatchlistCandidates(watchlist?.candidates || []);

        const map = {};
        (divergence?.explanations || []).forEach((e) => {
          map[e.symbol] = e;
        });
        setDivergenceMap(map);
      } catch (err) {
        console.error("Discovery Lab load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => (mounted = false);
  }, []);

  async function loadConfidenceHistory(symbol) {
    try {
      const result = await window.jupiter.invoke("confidence:history:get", {
        symbol,
      });
      setConfidenceHistory(result || []);
    } catch {
      setConfidenceHistory([]);
    }
  }

  async function loadExecutionExposure(symbol, confidence) {
    try {
      const result = await window.jupiter.invoke(
        "execution:exposure:evaluate",
        {
          symbol,
          confidence,
        }
      );
      setExecutionExposure(result);
    } catch {
      setExecutionExposure(null);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading discovery intelligence…</div>;
  }

  return (
    <div style={{ display: "flex", height: "100%", padding: "2rem", gap: "1.5rem" }}>
      {/* LEFT */}
      <div style={{ flex: 3, maxWidth: 1400 }}>
        <h1>Discovery Lab</h1>
        <p style={{ opacity: 0.8 }}>Read-only market discovery surface (Phase D12).</p>

        {/* THEMES */}
        <h3 style={{ marginTop: "2.5rem" }}>
          Emerging Themes
          <span style={cadenceStyle()}>Structural · Slow cadence</span>
        </h3>

        {themes.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No emerging structural themes detected.</p>
        ) : (
          themes.map((t) => (
            <div key={t.themeId} style={{ background: "#0f172a", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
              <strong>{t.label}</strong>
              <p style={{ marginTop: "0.4rem", opacity: 0.85 }}>{t.explanation}</p>
            </div>
          ))
        )}

        {/* WATCHLIST */}
        <h3 style={{ marginTop: "3rem" }}>
          Watchlist Candidates
          <span style={cadenceStyle()}>Observational · Medium cadence</span>
        </h3>

        {watchlistCandidates.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No assets currently meet monitoring criteria.</p>
        ) : (
          watchlistCandidates.map((w) => (
            <div key={w.watchId} style={{ background: "#0b1220", padding: "0.9rem", borderRadius: "8px", marginBottom: "0.6rem" }}>
              <strong>{w.symbol}</strong>
              <p style={{ opacity: 0.7, marginTop: "0.3rem" }}>{w.monitorReason}</p>
            </div>
          ))
        )}

        {/* DISCOVERY */}
        <h3 style={{ marginTop: "3rem" }}>
          Ranked Market Discovery
          <span style={cadenceStyle()}>Tactical · Fast cadence</span>
        </h3>

        <table width="100%" cellPadding="10">
          <thead>
            <tr>
              <th>Rank</th><th>Symbol</th><th>Decision</th><th>Regime</th><th>Why</th><th align="right">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const convictionLevel =
                r.conviction?.level ||
                (r.conviction?.normalized >= 0.7 ? "High" :
                 r.conviction?.normalized >= 0.4 ? "Medium" : "Low");

              return (
                <tr key={r.rank}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedInsight(r);
                    loadConfidenceHistory(r.symbol.symbol);
                    loadExecutionExposure(r.symbol.symbol, r.decision.decision);
                  }}>
                  <td>#{r.rank}</td>
                  <td>{r.symbol.symbol}</td>
                  <td>{r.decision.decision}</td>
                  <td>{r.regime.label}</td>
                  <td>{r.explanation?.plainEnglishSummary}</td>
                  <td align="right">
                    <span style={badgeStyle(convictionLevel)}>{convictionLevel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, background: "#020617", borderLeft: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem" }}>
        {!selectedInsight ? (
          <p style={{ opacity: 0.5 }}>Select a row to view insight.</p>
        ) : (
          <>
            <h2>{selectedInsight.symbol.symbol}</h2>

            <h4>Execution Exposure (Shadow)</h4>
            {executionExposure ? (
              <>
                <span style={badgeStyle(executionExposure.exposure.level)}>
                  {executionExposure.exposure.level}
                </span>
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem", opacity: 0.7 }}>
                  {executionExposure.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <p style={{ fontSize: "0.75rem", opacity: 0.4 }}>
                  SHADOW MODE — descriptive only. No execution, no automation.
                </p>
              </>
            ) : (
              <p style={{ opacity: 0.5 }}>No exposure data.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
