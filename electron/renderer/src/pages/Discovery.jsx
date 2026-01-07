// electron/renderer/src/pages/Discovery.jsx

import { useEffect, useState } from "react";

/**
 * Discovery Lab — Phase 2C
 * --------------------------------------------------
 * Read-only Ranked Market Discovery surface
 * Canonical binding only (engine → IPC → UI)
 *
 * Source:
 * window.jupiter.invoke("discovery:run").canonical
 */

export default function Discovery() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDiscovery() {
      try {
        const result = await window.jupiter.invoke("discovery:run");

        if (!result || !Array.isArray(result.canonical)) {
          throw new Error("Invalid discovery payload");
        }

        if (mounted) {
          setRows(result.canonical);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    loadDiscovery();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading discovery intelligence…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: "#f87171" }}>
        Discovery error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Discovery Lab</h2>

      <p style={{ opacity: 0.8 }}>
        Read-only ranked market discovery surface (Phase 2C).
      </p>

      <h3 style={{ marginTop: 24 }}>Ranked Market Discovery</h3>

      <table width="100%" cellPadding="10">
        <thead>
          <tr>
            <th align="left">Rank</th>
            <th align="left">Symbol</th>
            <th align="left">Decision</th>
            <th align="left">Regime</th>
            <th align="right">Conviction</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.rank}>
              <td>#{r.rank}</td>
              <td>{r.symbol.symbol}</td>
              <td>{r.decision.decision}</td>
              <td>{r.regime.label}</td>
              <td align="right">
                {Number.isFinite(r.conviction.normalized)
                  ? r.conviction.normalized.toFixed(2)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
        Discovery outputs are mathematical classifications only. No actions are executed.
      </p>
    </div>
  );
}

