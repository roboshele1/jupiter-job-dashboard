import React, { useContext, useMemo } from "react";
import { PortfolioSnapshotContext } from "../App";

export default function RiskCentre() {
  const { snapshot, asOf } = useContext(PortfolioSnapshotContext);

  /**
   * ============================================================
   * Fail-closed guard (institutional behavior)
   * ============================================================
   */
  if (!snapshot || !snapshot.holdings) {
    return (
      <div style={{ padding: "32px" }}>
        <h1>Risk Centre</h1>
        <p><strong>Mode:</strong> Read-only · Deterministic · Intelligence-only</p>
        <p><strong>Data Source:</strong> Renderer snapshot store (no IPC)</p>
        <p><strong>Status:</strong> Snapshot read failed (fail-closed)</p>
        <p>Awaiting portfolio snapshot…</p>
      </div>
    );
  }

  /**
   * ============================================================
   * Derived analytics (pure, deterministic)
   * ============================================================
   */
  const diagnostics = useMemo(() => {
    const totalValue = snapshot.holdings.reduce(
      (sum, h) => sum + (h.live ?? 0),
      0
    );

    const equityValue = snapshot.holdings
      .filter(h => h.assetClass === "equity")
      .reduce((s, h) => s + (h.live ?? 0), 0);

    const cryptoValue = snapshot.holdings
      .filter(h => h.assetClass === "crypto")
      .reduce((s, h) => s + (h.live ?? 0), 0);

    const sorted = [...snapshot.holdings].sort(
      (a, b) => (b.live ?? 0) - (a.live ?? 0)
    );

    const top = sorted[0];
    const topWeight = totalValue > 0 ? (top.live / totalValue) * 100 : 0;

    return {
      totalValue,
      equityPct: (equityValue / totalValue) * 100,
      cryptoPct: (cryptoValue / totalValue) * 100,
      top,
      topWeight,
      holdings: sorted
    };
  }, [snapshot]);

  /**
   * ============================================================
   * Forward stress (structural, not predictive)
   * ============================================================
   */
  const stress = [
    { label: "Equity −20%", impact: -(diagnostics.equityPct / 100) * 20 },
    { label: "Crypto −30%", impact: -(diagnostics.cryptoPct / 100) * 30 },
    { label: "Equity −20% + Crypto −30%", impact: -(
        (diagnostics.equityPct / 100) * 20 +
        (diagnostics.cryptoPct / 100) * 30
      )
    },
    { label: "Macro Shock (−15%)", impact: -15 }
  ];

  /**
   * ============================================================
   * Render
   * ============================================================
   */
  return (
    <div style={{ padding: "32px" }}>
      <h1>Risk Centre</h1>

      <p><strong>Mode:</strong> Read-only · Deterministic · Intelligence-only</p>
      <p><strong>Data Source:</strong> Renderer snapshot store (no IPC)</p>
      <p><strong>Snapshot as of:</strong> {new Date(asOf).toLocaleString()}</p>

      <hr />

      <h2>Exposure</h2>
      <p>Equity: {diagnostics.equityPct.toFixed(1)}%</p>
      <p>Crypto: {diagnostics.cryptoPct.toFixed(1)}%</p>

      <h2>Concentration</h2>
      <p>
        Top position: {diagnostics.top.symbol} —{" "}
        {diagnostics.topWeight.toFixed(1)}%
      </p>

      <h2>Top Risk Contributors</h2>
      <ul>
        {diagnostics.holdings.slice(0, 5).map(h => (
          <li key={h.symbol}>
            {h.symbol} — {((h.live / diagnostics.totalValue) * 100).toFixed(1)}%
          </li>
        ))}
      </ul>

      <h2>Forward Stress Scenarios</h2>
      <ul>
        {stress.map(s => (
          <li key={s.label}>
            {s.label}: {s.impact.toFixed(1)}%
          </li>
        ))}
      </ul>

      <h2>Risk Regime</h2>
      <p>
        {diagnostics.topWeight > 50
          ? "Concentration + Volatility Driven"
          : "Balanced"}
      </p>

      <p style={{ opacity: 0.7 }}>
        Regime classification describes structure — not actions.
      </p>
    </div>
  );
}

