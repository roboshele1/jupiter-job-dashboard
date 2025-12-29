import React from "react";

/**
 * Risk Centre — V13
 * Step 2: Risk Metrics Expansion
 * Read-only • Deterministic • Snapshot-gated
 */

export default function RiskCentre() {
  // Snapshot is assumed to already exist on window / preload contract
  // This preserves prior wiring and avoids adapter import failures
  const snapshot = window?.__JUPITER_SNAPSHOT__ || null;

  const integrity = {
    snapshotPresent: !!snapshot,
    timestampPresent: !!snapshot?.timestamp,
    holdingsPresent: Array.isArray(snapshot?.holdings),
    totalValuePresent: typeof snapshot?.totalValue === "number",
  };

  const integrityComplete =
    integrity.snapshotPresent &&
    integrity.timestampPresent &&
    integrity.holdingsPresent &&
    integrity.totalValuePresent;

  // ---------- SAFE DERIVATIONS (ONLY IF COMPLETE) ----------
  let metrics = null;

  if (integrityComplete) {
    const holdings = snapshot.holdings;
    const totalValue = snapshot.totalValue;

    const weights = holdings.map(h => h.value / totalValue);

    // Herfindahl–Hirschman Index (concentration proxy)
    const hhi =
      weights.reduce((sum, w) => sum + w * w, 0) * 10000;

    // Top-N concentration
    const sorted = [...holdings].sort((a, b) => b.value - a.value);
    const top3Pct =
      (sorted.slice(0, 3).reduce((s, a) => s + a.value, 0) / totalValue) * 100;

    // Asset class split
    const equityValue = holdings
      .filter(h => h.assetType === "equity")
      .reduce((s, a) => s + a.value, 0);

    const cryptoValue = holdings
      .filter(h => h.assetType === "crypto")
      .reduce((s, a) => s + a.value, 0);

    metrics = {
      hhi: hhi.toFixed(0),
      top3Pct: top3Pct.toFixed(1),
      equityPct: ((equityValue / totalValue) * 100).toFixed(1),
      cryptoPct: ((cryptoValue / totalValue) * 100).toFixed(1),
    };
  }

  return (
    <div className="page risk-centre">
      <h1>Risk Centre</h1>
      <div className="mode">
        Mode: Read-only · Deterministic · Intelligence-only
      </div>

      <hr />

      <h2>Snapshot Integrity (V13)</h2>
      <ul>
        <li>Snapshot present: {integrity.snapshotPresent ? "YES" : "NO"}</li>
        <li>Timestamp present: {integrity.timestampPresent ? "YES" : "NO"}</li>
        <li>Holdings present: {integrity.holdingsPresent ? "YES" : "NO"}</li>
        <li>Total value present: {integrity.totalValuePresent ? "YES" : "NO"}</li>
      </ul>

      <strong>
        Integrity Status: {integrityComplete ? "COMPLETE" : "INCOMPLETE"}
      </strong>

      <hr />

      <h2>Risk Metrics</h2>

      {!integrityComplete && (
        <p>Unavailable — snapshot incomplete.</p>
      )}

      {integrityComplete && metrics && (
        <ul>
          <li>HHI Concentration Index: {metrics.hhi}</li>
          <li>Top 3 Positions: {metrics.top3Pct}%</li>
          <li>Equity Exposure: {metrics.equityPct}%</li>
          <li>Crypto Exposure: {metrics.cryptoPct}%</li>
        </ul>
      )}

      <p className="footnote">
        Metrics are deterministic, snapshot-derived, and non-predictive.
      </p>
    </div>
  );
}

