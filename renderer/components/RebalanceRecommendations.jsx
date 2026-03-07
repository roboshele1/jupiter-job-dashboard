/**
 * RebalanceRecommendations.jsx
 * Shows which positions to trim/add with conviction scores
 * Table format: Symbol | Action | Current % | Target % | Conviction
 */

import { useEffect, useState } from "react";

export default function RebalanceRecommendations({ holdings, targets }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await window.jupiter.invoke('rebalance:getRecommendations', {
          holdings: holdings || [],
          targets: targets || {}
        });
        
        if (result?.ok && result.data) {
          setRecommendations(result.data);
        } else {
          setError(result?.error || "Failed to fetch rebalance recommendations");
        }
      } catch (e) {
        setError(e.message || "Rebalance error");
        console.error('Rebalance error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [holdings, targets]);

  if (loading) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Rebalance Recommendations</div>
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Analyzing thesis drift…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Rebalance Recommendations</div>
        <div style={{ color: "#f87171", fontSize: 13 }}>Error: {error}</div>
      </div>
    );
  }

  if (!recommendations || !recommendations.actions || recommendations.actions.length === 0) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Rebalance Recommendations</div>
        <div style={{ color: "#4ade80", fontSize: 13 }}>✓ Portfolio is well-aligned with thesis targets</div>
      </div>
    );
  }

  const getActionColor = (action) => {
    if (action === "TRIM" || action === "TRIM_TO_MINIMAL") return "#fb923c";
    if (action === "ADD") return "#4ade80";
    if (action === "EXIT") return "#f87171";
    return "#9ca3af";
  };

  const getConvictionColor = (conviction) => {
    const c = Number(conviction) || 0;
    if (c >= 0.8) return "#22c55e";
    if (c >= 0.6) return "#f59e0b";
    return "#6b7280";
  };

  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Rebalance Recommendations</div>
      
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <th style={{ textAlign: "left", padding: "10px 0", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em" }}>SYMBOL</th>
              <th style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em" }}>ACTION</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em" }}>CURRENT</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em" }}>TARGET</th>
              <th style={{ textAlign: "center", padding: "10px 0", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em" }}>CONVICTION</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.actions.map(rec => (
              <tr key={rec.symbol} style={{ borderBottom: "1px solid #1f2937" }}>
                <td style={{ padding: "12px 0", color: "#fff", fontWeight: 700 }}>{rec.symbol}</td>
                <td style={{ padding: "12px 12px" }}>
                  <span style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: `${getActionColor(rec.action)}20`,
                    color: getActionColor(rec.action),
                    fontWeight: 600
                  }}>
                    {rec.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: "12px 12px", textAlign: "center", color: "#e5e7eb" }}>{Number(rec.currentPct || 0).toFixed(1)}%</td>
                <td style={{ padding: "12px 12px", textAlign: "center", color: "#e5e7eb" }}>{Number(rec.targetPct || 0).toFixed(1)}%</td>
                <td style={{ padding: "12px 0", textAlign: "center" }}>
                  <span style={{ color: getConvictionColor(rec.conviction), fontWeight: 700 }}>
                    {Number(rec.conviction || 0).toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {recommendations.summary && (
        <div style={{ marginTop: 14, padding: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#d1d5db" }}>
            {recommendations.summary}
          </div>
        </div>
      )}
    </div>
  );
}
