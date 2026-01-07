import React, { useEffect, useState } from "react";

/**
 * DISCOVERY LAB — Phase 2C
 * --------------------------------------------------
 * Read-only, deterministic market discovery surface.
 * This UI renders canonical discovery output produced
 * by the engine (no opinions, no overrides).
 */

const confidenceBadge = (level) => {
  const map = {
    High: "#2ecc71",
    Medium: "#f1c40f",
    Low: "#e67e22",
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

  return (
    <div style={{ padding: "2rem", maxWidth: 1400 }}>
      <h1>Discovery Lab</h1>

      <p style={{ opacity: 0.8 }}>
        Read-only market discovery surface (Phase 2C).
      </p>

      {/* STATUS */}
      <section style={{ marginTop: "1.5rem" }}>
        <h3>Status</h3>
        <ul style={{ opacity: 0.85 }}>
          <li>Mode: Read-only</li>
          <li>Phase: 2C (UI + Ranked Static Discovery)</li>
          <li>Engines: None</li>
          <li>Data Source: Mock / Static</li>
        </ul>
      </section>

      {/* RANKED MARKET DISCOVERY */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2>Ranked Market Discovery</h2>

        {loading && <p style={{ opacity: 0.6 }}>Loading discovery…</p>}

        {!loading && rows.length === 0 && (
          <p style={{ opacity: 0.6 }}>No discovery results available.</p>
        )}

        {!loading && rows.length > 0 && (
          <table
            style={{
              width: "100%",
              marginTop: "1rem",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
                <th>Rank</th>
                <th>Symbol</th>
                <th>Decision</th>
                <th>Regime</th>
                <th>Why It Surfaced</th>
                <th style={{ textAlign: "right" }}>Confidence</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const confidence =
                  r.conviction?.normalized >= 0.66
                    ? "High"
                    : r.conviction?.normalized >= 0.33
                    ? "Medium"
                    : "Low";

                return (
                  <tr key={r.rank} style={{ borderBottom: "1px solid #222" }}>
                    <td>#{r.rank}</td>
                    <td>{r.symbol.symbol}</td>
                    <td>{r.decision.decision}</td>
                    <td>{r.regime.label}</td>
                    <td style={{ opacity: 0.85 }}>
                      {r.explanation?.plainEnglishSummary ||
                        "No explanation available."}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={confidenceBadge(confidence)}>
                        {confidence}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
          Discovery outputs are classification-only. No actions are executed.
        </p>
      </section>
    </div>
  );
}

