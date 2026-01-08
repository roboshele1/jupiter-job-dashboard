import React, { useEffect, useState } from "react";

const badgeStyle = (level) => {
  const map = {
    High: "#2ecc71",
    Medium: "#f1c40f",
    Low: "#e67e22",
    Early: "#7f8c8d",
    Monitoring: "#3498db",
    Watching: "#9b59b6",
  };
  return {
    display: "inline-block",
    padding: "0.25rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
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

        if (Array.isArray(discovery?.canonical)) {
          setRows(discovery.canonical);
        }

        if (Array.isArray(discovery?.emergingThemes?.themes)) {
          setThemes(discovery.emergingThemes.themes);
        }

        if (Array.isArray(watchlist?.candidates)) {
          setWatchlistCandidates(watchlist.candidates);
        }

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
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading discovery intelligence…</div>;
  }

  return (
    <div style={{ display: "flex", height: "100%", padding: "2rem", gap: "1.5rem" }}>
      {/* ================= LEFT: MAIN DISCOVERY ================= */}
      <div style={{ flex: 3, maxWidth: 1400 }}>
        <h1>Discovery Lab</h1>
        <p style={{ opacity: 0.8 }}>
          Read-only market discovery surface (Phase D11).
        </p>

        {/* Emerging Themes */}
        <h3 style={{ marginTop: "2.5rem" }}>
          Emerging Themes
          <span style={cadenceStyle()}>Structural · Slow cadence</span>
        </h3>

        {themes.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No emerging structural themes detected.</p>
        ) : (
          themes.map((t) => (
            <div
              key={t.themeId}
              style={{
                background: "#0f172a",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "0.75rem",
              }}
            >
              <strong>{t.label}</strong>
              <p style={{ marginTop: "0.4rem", opacity: 0.85 }}>
                {t.explanation}
              </p>
            </div>
          ))
        )}

        {/* Watchlist */}
        <h3 style={{ marginTop: "3rem" }}>
          Watchlist Candidates
          <span style={cadenceStyle()}>Observational · Medium cadence</span>
        </h3>

        {watchlistCandidates.length === 0 ? (
          <p style={{ opacity: 0.6 }}>
            No assets currently meet monitoring criteria.
          </p>
        ) : (
          watchlistCandidates.map((w) => (
            <div
              key={w.watchId}
              style={{
                background: "#0b1220",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "0.75rem",
              }}
            >
              <strong>{w.symbol}</strong>
            </div>
          ))
        )}

        {/* Ranked Discovery */}
        <h3 style={{ marginTop: "3rem" }}>
          Ranked Market Discovery
          <span style={cadenceStyle()}>Tactical · Fast cadence</span>
        </h3>

        <table width="100%" cellPadding="10">
          <thead>
            <tr>
              <th align="left">Rank</th>
              <th align="left">Symbol</th>
              <th align="left">Decision</th>
              <th align="left">Regime</th>
              <th align="left">Why It Surfaced</th>
              <th align="right">Confidence</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const isOpen = expanded[r.rank];
              const explanation = r.explanation || {};
              const factors = explanation.factorAttribution || {};
              const divergence = divergenceMap[r.symbol.symbol];

              const convictionLevel =
                r.conviction?.level ||
                (r.conviction?.normalized >= 0.7
                  ? "High"
                  : r.conviction?.normalized >= 0.4
                  ? "Medium"
                  : "Low");

              return (
                <React.Fragment key={r.rank}>
                  <tr
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setExpanded((prev) => ({
                        ...prev,
                        [r.rank]: !prev[r.rank],
                      }));
                      setSelectedInsight({
                        row: r,
                        divergence,
                        factors,
                        convictionLevel,
                      });
                    }}
                  >
                    <td>#{r.rank}</td>
                    <td>{r.symbol.symbol}</td>
                    <td>{r.decision.decision}</td>
                    <td>{r.regime.label}</td>
                    <td style={{ opacity: 0.85 }}>
                      {explanation.plainEnglishSummary}
                    </td>
                    <td align="right">
                      <span style={badgeStyle(convictionLevel)}>
                        {convictionLevel}
                      </span>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={6} style={{ background: "#0f172a" }}>
                        <div style={{ padding: "1rem" }}>
                          {Object.entries(factors).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>{k}</span>
                              <span style={deltaStyle(v)}>
                                {v > 0 ? "+" : ""}
                                {v.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= RIGHT: INSIGHT PANEL (OPTIONAL) ================= */}
      <div
        style={{
          flex: 1,
          background: "#020617",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          padding: "1.25rem",
        }}
      >
        {!selectedInsight ? (
          <p style={{ opacity: 0.5 }}>Select a row to view insight.</p>
        ) : (
          <>
            <h2>{selectedInsight.row.symbol.symbol}</h2>
            <p style={{ opacity: 0.8 }}>
              Insight Panel · Slow cadence
            </p>

            <h4>Overview</h4>
            <p style={{ opacity: 0.85 }}>
              {selectedInsight.divergence?.summary}
            </p>

            <h4>Interpretation</h4>
            <p style={{ opacity: 0.75 }}>
              {selectedInsight.divergence?.interpretation}
            </p>

            <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>
              {selectedInsight.divergence?.disclaimer}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
