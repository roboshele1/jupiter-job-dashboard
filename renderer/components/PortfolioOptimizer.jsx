/**
 * PortfolioOptimizer.jsx
 * Shows optimal allocation recommendation to hit $1M goal by 2037
 * Displays as: 60% core / 40% moonshots (or custom based on holdings)
 */

import { useEffect, useState } from "react";

export default function PortfolioOptimizer({ holdings, goal }) {
  const [optimizer, setOptimizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await window.jupiter.invoke('optimizer:forGoal', {
          holdings: holdings || [],
          target: goal?.target || 1000000,
          year: goal?.year || 2037
        });
        
        if (result?.ok && result.data) {
          setOptimizer(result.data);
        } else {
          setError(result?.error || "Failed to calculate optimal allocation");
        }
      } catch (e) {
        setError(e.message || "Optimizer error");
        console.error('Optimizer error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [holdings, goal]);

  if (loading) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Optimal Allocation</div>
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Calculating…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Optimal Allocation</div>
        <div style={{ color: "#f87171", fontSize: 13 }}>Error: {error}</div>
      </div>
    );
  }

  if (!optimizer) return null;

  const coreAllocation = optimizer.coreAllocation || 60;
  const moonalloction = optimizer.moonshotAllocation || 40;

  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Optimal Allocation</div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 16 }}>
        {/* Core Holdings */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", marginBottom: 8 }}>CORE HOLDINGS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6" }}>{coreAllocation}%</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>Thesis-driven, low volatility</div>
        </div>

        {/* Moonshot Allocation */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", marginBottom: 8 }}>MOONSHOT POSITIONS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>{moonalloction}%</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>High-conviction 2x/3x targets</div>
        </div>
      </div>

      {/* Rationale */}
      {optimizer.rationale && (
        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: "#d1d5db", lineHeight: "1.6" }}>
            {optimizer.rationale}
          </div>
        </div>
      )}

      {/* Metrics */}
      {optimizer.expectedCAGR && (
        <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 12 }}>
          <div style={{ color: "#9ca3af" }}>
            Expected CAGR: <span style={{ color: "#22c55e", fontWeight: 700 }}>{Number(optimizer.expectedCAGR).toFixed(1)}%</span>
          </div>
          {optimizer.probabilityToGoal && (
            <div style={{ color: "#9ca3af" }}>
              Probability to goal: <span style={{ color: "#22c55e", fontWeight: 700 }}>{Number(optimizer.probabilityToGoal).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
