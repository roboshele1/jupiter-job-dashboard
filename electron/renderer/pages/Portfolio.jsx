import React, { useEffect } from "react";
import { usePortfolioStore } from "../state/portfolioStore";

export default function Portfolio() {
  const snapshot = usePortfolioStore((s) => s.snapshot);
  const loading = usePortfolioStore((s) => s.loading);
  const error = usePortfolioStore((s) => s.error);
  const load = usePortfolioStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div>Loading portfolio…</div>;
  if (error) return <div>Error: {error}</div>;
  if (!snapshot) return null;

  return (
    <div>
      <h2>Portfolio</h2>
      <div>Total Value: ${Number(snapshot.totalValue).toFixed(2)}</div>

      <ul>
        {snapshot.positions.map((p) => (
          <li key={p.symbol}>
            {p.symbol} — {p.qty} @ ${Number(p.price).toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}

