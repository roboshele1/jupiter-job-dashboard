import { useEffect, useState } from "react";
export default function KellyInstitutional({ holdings }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      const r = await window.jupiter.invoke('decisions:getUnifiedDecisions', { holdings });
      if (r?.ok) {
        setData(r.data);
        // Auto-log unified decisions to ledger
        await window.jupiter.invoke('insights:record', {
          type: 'decisions:unified',
          timestamp: Date.now(),
          data: r.data,
        }).catch(err => console.warn('[KellyInstitutional] Log failed:', err));
      }
    })();
  }, [holdings]);
  if (!data) return null;
  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Kelly Criterion (Institutional)</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <th style={{ textAlign: "left", padding: "10px 0", color: "#9ca3af", fontWeight: 600 }}>SYMBOL</th>
              <th style={{ textAlign: "center", padding: "10px", color: "#9ca3af", fontWeight: 600 }}>WIN %</th>
              <th style={{ textAlign: "center", padding: "10px", color: "#9ca3af", fontWeight: 600 }}>PAYOFF</th>
              <th style={{ textAlign: "center", padding: "10px", color: "#9ca3af", fontWeight: 600 }}>KELLY</th>
              <th style={{ textAlign: "center", padding: "10px", color: "#9ca3af", fontWeight: 600 }}>EDGE</th>
            </tr>
          </thead>
          <tbody>
            {data.holdings.slice(0, 8).map(h => (
              <tr key={h.symbol} style={{ borderBottom: "1px solid #1f2937" }}>
                <td style={{ padding: "10px 0", color: "#fff", fontWeight: 700 }}>{h.symbol}</td>
                <td style={{ padding: "10px", textAlign: "center", color: "#22c55e" }}>{h.winProbability}</td>
                <td style={{ padding: "10px", textAlign: "center", color: "#e5e7eb" }}>{h.payoffRatio}</td>
                <td style={{ padding: "10px", textAlign: "center", color: "#3b82f6", fontWeight: 700 }}>{h.kelly}</td>
                <td style={{ padding: "10px", textAlign: "center", color: h.edge.includes('-') ? "#f87171" : "#4ade80" }}>{h.edge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
