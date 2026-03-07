/**
 * ThesisAccuracyTracker.jsx
 * Displays which bets hit targets, accuracy score, and lessons learned
 * Shows historical performance and learning outcomes
 */

import { useEffect, useState } from "react";

export default function ThesisAccuracyTracker() {
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Note: tracker data comes from memory/learning system
        // This component fetches historical thesis outcomes
        const result = await window.jupiter.invoke('memory:getSummary');
        
        if (result?.ok && result.data) {
          // Extract thesis tracking from memory summary
          setTracker(result.data);
        } else {
          // No data yet — theses are being tracked in background
          setTracker({ outcomes: [], accuracy: 0, lessonsCount: 0 });
        }
      } catch (e) {
        setError(e.message || "Tracker error");
        console.error('Thesis tracker error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Thesis Accuracy Tracker</div>
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading outcome history…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Thesis Accuracy Tracker</div>
        <div style={{ color: "#f87171", fontSize: 13 }}>Error: {error}</div>
      </div>
    );
  }

  if (!tracker || !tracker.outcomes || tracker.outcomes.length === 0) {
    return (
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Thesis Accuracy Tracker</div>
        <div style={{ color: "#9ca3af", fontSize: 13 }}>No thesis outcomes recorded yet. Jupiter learns from outcomes over time.</div>
      </div>
    );
  }

  const accuracy = tracker.accuracy || 0;
  const totalOutcomes = tracker.outcomes?.length || 0;
  const hitsCount = tracker.outcomes?.filter(o => o.hitTarget)?.length || 0;
  const lessonsCount = tracker.lessonsCount || 0;

  const getAccuracyColor = (acc) => {
    const a = Number(acc) || 0;
    if (a >= 0.7) return "#22c55e";
    if (a >= 0.5) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Thesis Accuracy Tracker</div>
      
      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {/* Accuracy Score */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", marginBottom: 6 }}>ACCURACY SCORE</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: getAccuracyColor(accuracy) }}>
            {(Number(accuracy) * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Based on {totalOutcomes} outcomes</div>
        </div>

        {/* Hits vs Total */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", marginBottom: 6 }}>HITS vs TOTAL</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#22c55e" }}>
            {hitsCount}/{totalOutcomes}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Theses that hit targets</div>
        </div>

        {/* Lessons Learned */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", marginBottom: 6 }}>LESSONS LEARNED</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b" }}>
            {lessonsCount}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Patterns extracted from outcomes</div>
        </div>
      </div>

      {/* Recent Outcomes */}
      {tracker.outcomes && tracker.outcomes.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#d1d5db", marginBottom: 10 }}>Recent Outcomes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tracker.outcomes.slice(0, 5).map((outcome, idx) => (
              <div key={idx} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 8,
                borderLeft: `3px solid ${outcome.hitTarget ? "#22c55e" : "#f87171"}`
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{outcome.thesis || "Thesis #" + (idx + 1)}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    Target: {outcome.targetPrice ? `$${Number(outcome.targetPrice).toFixed(2)}` : "—"} 
                    {outcome.timeframe && ` · ${outcome.timeframe}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: outcome.hitTarget ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                    color: outcome.hitTarget ? "#22c55e" : "#f87171",
                    fontWeight: 600
                  }}>
                    {outcome.hitTarget ? "✓ HIT" : "✗ MISSED"}
                  </div>
                </div>
              </div>
            ))}
            {tracker.outcomes.length > 5 && (
              <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", paddingTop: 4 }}>
                +{tracker.outcomes.length - 5} more outcomes in memory
              </div>
            )}
          </div>
        </div>
      )}

      {/* Learning Note */}
      <div style={{ marginTop: 14, padding: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>
          Jupiter learns from thesis outcomes to refine future screening, allocation, and rebalance recommendations. Higher accuracy scores unlock more aggressive position sizing.
        </div>
      </div>
    </div>
  );
}
