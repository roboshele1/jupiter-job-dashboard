import React, { useEffect, useState } from "react";

const badgeStyle = (level) => {
  const map = {
    High: "#2ecc71",
    Medium: "#f1c40f",
    Low: "#e67e22",
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
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDiscovery() {
      try {
        const result = await window.jupiter.invoke("discovery:run");
        if (mounted && Array.isArray(result?.canonical)) {
          setRows(result.canonical);
        }
      } catch (err) {
        console.error("Discovery load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDiscovery();
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

      <h3 style={{ marginTop: "2rem" }}>Ranked Market Discovery</h3>

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
            const deltas = r.regimeDeltaSummary;
            const validation = explanation.historicalValidation;

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
                        {/* CONFIDENCE */}
                        {explanation.convictionContext && (
                          <>
                            <strong>Confidence</strong>
                            <p style={{ opacity: 0.85, marginTop: "0.4rem" }}>
                              {explanation.convictionContext.summary}
                            </p>
                          </>
                        )}

                        {/* BUSINESS FUNDAMENTALS */}
                        {explanation.fundamentalContext && (
                          <>
                            <div style={{ marginTop: "1.25rem" }}>
                              <strong>Business Fundamentals</strong>
                            </div>
                            <ul style={{ marginTop: "0.5rem", opacity: 0.85 }}>
                              {explanation.fundamentalContext.details?.map(
                                (d, i) => (
                                  <li key={i}>{d}</li>
                                )
                              )}
                            </ul>
                          </>
                        )}

                        {/* MARKET BEHAVIOR */}
                        {explanation.tacticalContext && (
                          <>
                            <div style={{ marginTop: "1.25rem" }}>
                              <strong>Market Behavior</strong>
                            </div>
                            <ul style={{ marginTop: "0.5rem", opacity: 0.85 }}>
                              {explanation.tacticalContext.details?.map(
                                (d, i) => (
                                  <li key={i}>{d}</li>
                                )
                              )}
                            </ul>
                          </>
                        )}

                        {/* REGIME CONTEXT */}
                        {explanation.regimeContext && (
                          <>
                            <div style={{ marginTop: "1.25rem" }}>
                              <strong>Regime Context</strong>
                            </div>
                            <ul style={{ marginTop: "0.5rem", opacity: 0.85 }}>
                              {explanation.regimeContext.details?.map(
                                (d, i) => (
                                  <li key={i}>{d}</li>
                                )
                              )}
                            </ul>
                          </>
                        )}

                        {/* FACTOR ATTRIBUTION */}
                        {Object.keys(factors).length > 0 && (
                          <>
                            <div style={{ marginTop: "1.25rem" }}>
                              <strong>Factor Attribution</strong>
                            </div>

                            <table
                              style={{ marginTop: "0.75rem" }}
                              width="100%"
                              cellPadding="6"
                            >
                              <thead>
                                <tr style={{ opacity: 0.7 }}>
                                  <th align="left">Factor</th>
                                  <th align="right">Contribution</th>
                                </tr>
                              </thead>
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

                        {/* REGIME SENSITIVITY */}
                        {deltas && (
                          <>
                            <div style={{ marginTop: "1.25rem" }}>
                              <strong>Regime Sensitivity</strong>
                            </div>

                            <table
                              style={{ marginTop: "0.5rem" }}
                              width="100%"
                              cellPadding="6"
                            >
                              <thead>
                                <tr style={{ opacity: 0.7 }}>
                                  <th align="left">Alternate Regime</th>
                                  <th align="right">Conviction Δ</th>
                                  <th align="left">Explanation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {deltas.deltas.map((d) => (
                                  <tr key={d.regime}>
                                    <td>{d.regime}</td>
                                    <td
                                      align="right"
                                      style={deltaStyle(d.convictionDelta)}
                                    >
                                      {d.convictionDelta > 0 ? "+" : ""}
                                      {d.convictionDelta.toFixed(2)}
                                    </td>
                                    <td style={{ opacity: 0.85 }}>
                                      {d.explanation}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}

                        {/* HISTORICAL VALIDATION */}
                        {validation && (
                          <>
                            <div style={{ marginTop: "1.25rem" }}>
                              <strong>Historical Validation</strong>
                            </div>
                            <p
                              style={{
                                marginTop: "0.4rem",
                                fontSize: "0.85rem",
                                opacity: 0.8,
                              }}
                            >
                              {validation.summary}
                            </p>
                          </>
                        )}

                        {/* SYNTHESIS */}
                        {explanation.plainEnglishSummary && (
                          <>
                            <div style={{ marginTop: "1.5rem" }}>
                              <strong>Overall Assessment</strong>
                            </div>
                            <p
                              style={{
                                marginTop: "0.5rem",
                                fontSize: "0.9rem",
                                opacity: 0.85,
                                lineHeight: "1.4rem",
                              }}
                            >
                              {explanation.plainEnglishSummary}
                            </p>
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
