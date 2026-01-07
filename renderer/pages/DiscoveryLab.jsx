// renderer/pages/DiscoveryLab.jsx

import React, { useEffect, useState } from "react";

const convictionBadge = (value) => {
  if (!Number.isFinite(value)) return { label: "—", color: "#555" };
  if (value >= 0.7) return { label: "High", color: "#2ecc71" };
  if (value >= 0.4) return { label: "Medium", color: "#f1c40f" };
  return { label: "Low", color: "#e67e22" };
};

export default function DiscoveryLab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = await window.jupiter.invoke("discovery:run");

        if (!result || !Array.isArray(result.canonical)) {
          throw new Error("Invalid discovery payload");
        }

        if (mounted) {
          setRows(result.canonical);
        }
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: 1200 }}>
      <h1>Discovery Lab</h1>
      <p style={{ opacity: 0.8 }}>
        Read-only market discovery surface (Phase 2C).
      </p>

      <section style={{ marginTop: "2rem" }}>
        <h2>Status</h2>
        <ul>
          <li>Mode: Read-only</li>
          <li>Phase: 2C (UI + Ranked Static Discovery)</li>
          <li>Engines: None</li>
          <li>Data Source: Mock / Static</li>
        </ul>
      </section>

      <section style={{ marginTop: "3rem" }}>
        <h2>Ranked Market Discovery</h2>

        {loading && <p style={{ opacity: 0.6 }}>Loading discovery…</p>}

        {error && (
          <p style={{ color: "#f87171" }}>Discovery error: {error}</p>
        )}

        {!loading && !error && (
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
                <th>Conviction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const badge = convictionBadge(r.conviction?.normalized);

                return (
                  <tr key={r.rank} style={{ borderBottom: "1px solid #222" }}>
                    <td>#{r.rank}</td>
                    <td>{r.symbol.symbol}</td>
                    <td>{r.decision.decision}</td>
                    <td>{r.regime.label}</td>
                    <td>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: badge.color,
                          color: "#000",
                        }}
                      >
                        {badge.label}
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

