import { useEffect } from "react";
import { usePortfolioStore } from "../state/portfolioStore";

export default function Dashboard() {
  const { snapshot, hydrate, loading } = usePortfolioStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (loading || !snapshot) return <div>Loading dashboard…</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div>Total Portfolio Value</div>
      <h1>${snapshot.totalValue.toFixed(2)}</h1>
      <div>Assets: {snapshot.positions.length}</div>
    </div>
  );
}

