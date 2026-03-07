import { useState } from "react";
export default function APIResilience() {
  const [status] = useState({ polygon: 'LIVE', coinbase: 'LIVE', yahoo: 'LIVE' });
  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>API Resilience (Rate Limited)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {Object.entries(status).map(([api, stat]) => (
          <div key={api} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{api.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: "#22c55e", marginTop: 4 }}>● {stat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
