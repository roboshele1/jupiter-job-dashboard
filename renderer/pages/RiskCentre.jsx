// renderer/pages/RiskCentre.jsx

import React from "react";

/**
 * 🔒 CANONICAL SNAPSHOT ACCESS (READ-ONLY)
 * NEVER default-import Zustand stores or adapters.
 */
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";
import {
  getSnapshotHoldings,
  getSnapshotTotalValue,
  deriveExposure,
} from "../state/portfolioSnapshotAdapter";

/**
 * RiskCentre
 * Read-only • Deterministic • Intelligence-only
 */
export default function RiskCentre() {
  // --- Snapshot source of truth
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);

  // --- Integrity checks (V12)
  const snapshotPresent = !!snapshot;
  const timestampPresent = typeof snapshot?.timestamp === "number";
  const holdingsPresent = Array.isArray(snapshot?.holdings);
  const totalValuePresent = typeof snapshot?.totalValue === "number";

  const integrityComplete =
    snapshotPresent &&
    timestampPresent &&
    holdingsPresent &&
    totalValuePresent;

  // --- Safe derivations (only allowed if integrity passes)
  const holdings = integrityComplete ? getSnapshotHoldings(snapshot) : [];
  const totalValue = integrityComplete
    ? getSnapshotTotalValue(snapshot)
    : null;

  const exposure = integrityComplete
    ? deriveExposure(snapshot)
    : { equityPct: null, cryptoPct: null };

  return (
    <div className="page risk-centre">
      <h1>Risk Centre</h1>
      <p className="mode">
        Mode: Read-only · Deterministic · Intelligence-only
      </p>

      {/* ===============================
          SNAPSHOT INTEGRITY (V12)
         =============================== */}
      <section className="panel">
        <h2>Snapshot Integrity (V12)</h2>
        <ul>
          <li>Snapshot present: {snapshotPresent ? "YES" : "NO"}</li>
          <li>Timestamp present: {timestampPresent ? "YES" : "NO"}</li>
          <li>Holdings present: {holdingsPresent ? "YES" : "NO"}</li>
          <li>Total value present: {totalValuePresent ? "YES" : "NO"}</li>
        </ul>
        <strong>
          Integrity Status:{" "}
          {integrityComplete ? "COMPLETE" : "INCOMPLETE"}
        </strong>
      </section>

      {/* ===============================
          EXPOSURE
         =============================== */}
      <section className="panel">
        <h2>Exposure</h2>
        {integrityComplete ? (
          <>
            <p>Equity: {exposure.equityPct.toFixed(1)}%</p>
            <p>Crypto: {exposure.cryptoPct.toFixed(1)}%</p>
          </>
        ) : (
          <p>Unavailable — snapshot incomplete.</p>
        )}
      </section>

      {/* ===============================
          STRUCTURAL CONCENTRATION
         =============================== */}
      <section className="panel">
        <h2>Structural Concentration</h2>
        {integrityComplete && holdings.length > 0 ? (
          <p>
            Top position: {holdings[0].symbol} —{" "}
            {((holdings[0].value / totalValue) * 100).toFixed(1)}%
          </p>
        ) : (
          <p>Unavailable.</p>
        )}
      </section>

      {/* ===============================
          RISK DECOMPOSITION
         =============================== */}
      <section className="panel">
        <h2>Risk Decomposition — By Asset</h2>
        {integrityComplete ? (
          <ul>
            {holdings.map((h) => (
              <li key={h.symbol}>
                {h.symbol}:{" "}
                {((h.value / totalValue) * 100).toFixed(1)}% (
                CA${h.value.toFixed(2)})
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Unavailable due to snapshot limitations.
            <br />
            Derived engines execute only after snapshot integrity
            verification.
          </p>
        )}
      </section>
    </div>
  );
}

