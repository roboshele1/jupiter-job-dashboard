import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export default function RiskCentre() {
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);

  // -----------------------------
  // Snapshot presence & fields
  // -----------------------------
  const hasSnapshot = snapshot && typeof snapshot === "object";

  const timestamp =
    typeof snapshot?.timestamp === "number" ? snapshot.timestamp : null;

  const holdings = Array.isArray(snapshot?.holdings)
    ? snapshot.holdings
    : null;

  const totalValue =
    typeof snapshot?.totalValue === "number" ? snapshot.totalValue : null;

  // -----------------------------
  // Completeness diagnostics
  // -----------------------------
  const completeness = {
    snapshot: !!hasSnapshot,
    timestamp: !!timestamp,
    holdings: Array.isArray(holdings),
    totalValue: typeof totalValue === "number",
  };

  const missingFields = Object.entries(completeness)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  // -----------------------------
  // Escalation tiers
  // -----------------------------
  const tier = {
    structural: completeness.holdings,
    valuation: completeness.holdings && completeness.totalValue,
    temporal: completeness.timestamp,
  };

  // -----------------------------
  // Risk confidence logic
  // -----------------------------
  let riskConfidence = "LOW";
  let confidenceNote =
    "Risk confidence reflects snapshot completeness — not market prediction.";

  if (tier.structural && !tier.valuation) {
    riskConfidence = "MEDIUM (Structural)";
    confidenceNote =
      "Structural risk intelligence available; valuation data incomplete.";
  }

  if (tier.structural && tier.valuation && tier.temporal) {
    riskConfidence = "HIGH";
    confidenceNote =
      "Snapshot complete and fresh; full risk intelligence available.";
  }

  // -----------------------------
  // Structural intelligence
  // -----------------------------
  const assetCount = tier.structural ? holdings.length : null;

  // -----------------------------
  // Render helpers
  // -----------------------------
  const renderUnavailable = (label) => (
    <div style={{ opacity: 0.6 }}>{label}: Unavailable</div>
  );

  return (
    <div className="page risk-centre">
      <h1>Risk Centre</h1>
      <div className="subtle">
        Mode: Read-only · Deterministic · Intelligence-only
      </div>

      <hr />

      {/* Snapshot Lineage */}
      <section>
        <h2>Snapshot Lineage & Freshness (V11.4)</h2>
        <ul>
          <li>Lineage: {hasSnapshot ? "BOOTSTRAPPED" : "NONE"}</li>
          <li>
            Snapshot Timestamp:{" "}
            {timestamp !== null ? timestamp : "Unavailable"}
          </li>
          <li>
            Snapshot Age:{" "}
            {timestamp !== null ? "Derivable" : "Unavailable"}
          </li>
        </ul>
      </section>

      <hr />

      {/* Risk Confidence */}
      <section>
        <h2>Risk Confidence (V11)</h2>
        <strong>{riskConfidence}</strong>
        <div className="subtle">{confidenceNote}</div>
      </section>

      <hr />

      {/* Snapshot Diagnostics */}
      <section>
        <h2>Snapshot Diagnostics</h2>
        <div>Status: {missingFields.length === 0 ? "COMPLETE" : "PARTIAL"}</div>
        {missingFields.length > 0 && (
          <>
            <div>Missing Fields:</div>
            <ul>
              {missingFields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <hr />

      {/* Exposure */}
      <section>
        <h2>Exposure</h2>
        {tier.valuation ? (
          <>
            <div>Equity: Derivable</div>
            <div>Crypto: Derivable</div>
          </>
        ) : (
          <>
            {renderUnavailable("Equity")}
            {renderUnavailable("Crypto")}
          </>
        )}
      </section>

      <hr />

      {/* Structural Concentration */}
      <section>
        <h2>Structural Concentration</h2>
        {tier.structural ? (
          <div>Total distinct assets: {assetCount}</div>
        ) : (
          <div>Unavailable due to missing holdings.</div>
        )}
      </section>

      <hr />

      {/* Risk Decomposition */}
      <section>
        <h2>Risk Decomposition — By Asset</h2>
        {tier.valuation ? (
          <div>Valuation-based decomposition available.</div>
        ) : tier.structural ? (
          <div>
            Structural decomposition only (valuation data missing).
          </div>
        ) : (
          <div>Unavailable due to incomplete snapshot.</div>
        )}
      </section>

      <hr />

      <div className="footnote">
        Snapshot intelligence enforces data integrity before risk computation.
      </div>
    </div>
  );
}

