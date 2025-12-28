import { useEffect, useState } from "react";

/**
 * RISK CENTRE — SCOPE (EXPLICIT, NON-DERIVED)
 * ------------------------------------------
 * What this tab IS:
 * - An independent risk readout
 * - Fed by a standalone Risk Engine
 * - Not coupled to Portfolio or Dashboard lifecycles
 * - Safe to load even if Portfolio/Dashboard are degraded
 *
 * What this tab IS NOT:
 * - Not authoritative valuation
 * - Not a trading signal generator
 * - Not a portfolio constructor
 *
 * Contract:
 * - Read-only
 * - Snapshot-based
 * - Fail-closed (renders safely with partial or mock data)
 */

export default function RiskCentre() {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState("initializing");

  useEffect(() => {
    let mounted = true;

    async function fetchRiskSnapshot() {
      try {
        if (!window.jupiter?.getRiskSnapshot) {
          console.warn("[RISK] getRiskSnapshot not exposed");
          setStatus("unavailable");
          return;
        }

        const data = await window.jupiter.getRiskSnapshot();

        if (mounted) {
          setSnapshot(data);
          setStatus("ready");
        }
      } catch (err) {
        console.error("[RISK] snapshot error", err);
        if (mounted) setStatus("error");
      }
    }

    fetchRiskSnapshot();
    return () => (mounted = false);
  }, []);

  return (
    <div style={{ padding: "32px" }}>
      <h1>Risk Centre</h1>

      {/* Scope Declaration */}
      <section style={{ opacity: 0.75, marginBottom: "24px" }}>
        <p>
          <strong>Purpose:</strong> Independent portfolio risk diagnostics.
        </p>
        <p>
          <strong>Data Source:</strong> Standalone Risk Engine (non-derivative).
        </p>
        <p>
          <strong>Mode:</strong> Read-only • Snapshot-based • Fail-closed.
        </p>
      </section>

      {/* Status */}
      {status !== "ready" && (
        <p>
          Status:{" "}
          {status === "initializing" && "Initializing risk engine…"}
          {status === "unavailable" && "Risk engine not available"}
          {status === "error" && "Risk snapshot error"}
        </p>
      )}

      {/* Snapshot Render */}
      {status === "ready" && snapshot && (
        <section style={{ marginTop: "24px" }}>
          <p>Snapshot time: {new Date(snapshot.asOf).toLocaleTimeString()}</p>
          <p>Total Value: ${snapshot.totals.totalValue}</p>
          <p>Equity: {(snapshot.totals.equityPct * 100).toFixed(1)}%</p>
          <p>Crypto: {(snapshot.totals.cryptoPct * 100).toFixed(1)}%</p>
          <p>Crypto Band: {snapshot.bands.cryptoExposure}</p>
        </section>
      )}
    </div>
  );
}

