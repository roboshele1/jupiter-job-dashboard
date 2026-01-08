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

const deltaStyle = (value) => ({
  color: value > 0 ? "#2ecc71" : value < 0 ? "#e74c3c" : "#aaa",
  fontWeight: 600,
});

export default function DiscoveryLab() {
  const [rows, setRows] = useState([]);
  const [themes, setThemes] = useState([]);
  const [watchlistCandidates, setWatchlistCandidates] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDiscovery() {
      try {
        const result = await window.jupiter.invoke("discovery:run");
        if (!mounted) return;

        if (Array.isArray(result?.canonical)) {
          setRows(result.canonical);
        }

        if (Array.isArray(result?.emergingThemes?.themes)) {
          setThemes(result.emergingThemes.themes);
        }
      } catch (err) {
        console.error("Discovery load failed:", err);
      }
    }

    async function loadWatchlistCandidates() {
      try {
        const result = await window.jupiter.invoke("watchlist:candidates");
        if (!mounted) return;

        if (Array.isArray(result?.candidates)) {
          setWatchlistCandidates(result.candidates);
        }
      } catch (err) {
        console.error("Watchlist candidates load failed:", err);
      }
    }

    Promise.all([loadDiscovery(), loadWatchlistCandidates()]).finally(() => {
      if (mounted) setLoading(false);
    });

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
      <p style={{ opacity: 0.8 }}>
        Read-only market discovery surface (Phase D10).
      </p>

      {/* ============================
          EMERGING THEMES (WHY)
      ============================ */}
      <h3 style={{ marginTop: "2.5rem" }}>Emerging Themes</h3>

      {themes.length === 0 ? (
        <p style={{ opacity: 0.6, marginTop: "0.5rem" }}>
          No emerging structural themes detected.
        </p>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {themes.map((t) => (
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
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                <div><strong>Drivers:</strong> {t.drivers.join(", ")}</div>
                <div><strong>Regime:</strong> {t.regimes.join(", ")}</div>
                <div><strong>Symbols:</strong> {t.symbols.join(", ")}</div>
                <div>
                  <strong>Confidence:</strong>{" "}
                  <span style={badgeStyle(t.confidence)}>{t.confidence}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================
          WATCHLIST CANDIDATES (MONITOR)
      ============================ */}
      <h3 style={{ marginTop: "3rem" }}>Watchlist Candidates</h3>

      {watchlistCandidates.length === 0 ? (
        <p style={{ opacity: 0.6, marginTop: "0.5rem" }}>
          No assets currently meet monitoring criteria.
        </p>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {watchlistCandidates.map((w) => (
            <div
              key={w.watchId}
              style={{
                background: "#0b1220",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{w.symbol}</strong>
                <span style={badgeStyle(w.confidenceQualifier)}>
                  {w.confidenceQualifier}
                </span>
              </div>

              <p style={{ marginTop: "0.4rem", opacity: 0.85 }}>
                {w.monitorReason}
              </p>

              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                <div><strong>Regime:</strong> {w.regime}</div>

                <div style={{ marginTop: "0.4rem" }}>
                  <strong>Upgrade Triggers:</strong>
                  <ul>
                    {w.upgradeTriggers.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong>Downgrade Triggers:</strong>
                  <ul>
                    {w.downgradeTriggers.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================
          RANKED MARKET DISCOVERY (WHAT)
      ============================ */}
      <h3 style={{ marginTop: "3rem" }}>Ranked Market Discovery</h3>

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
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [r.rank]: !prev[r.rank],
                    }))
                  }
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
                      <div style={{ padding: "1.25rem" }}>
                        {Object.keys(factors).length > 0 && (
                          <>
                            <strong>Factor Attribution</strong>
                            <table width="100%" cellPadding="6">
                              <tbody>
                                {Object.entries(factors).map(([k, v]) => (
                                  <tr key={k}>
                                    <td>{k}</td>
                                    <td align="right" style={deltaStyle(v)}>
                                      {v > 0 ? "+" : ""}
                                      {v.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
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
  );
}
