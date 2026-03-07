import { useEffect, useState } from "react";
export default function AuditTrail() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    (async () => {
      const r = await window.jupiter.invoke('audit:getTrail');
      if (r?.ok) setEvents(r.data);
    })();
  }, []);
  if (events.length === 0) return null;
  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Audit Trail (Last 10)</div>
      <div style={{ fontSize: 11, color: "#d1d5db", display: "flex", flexDirection: "column", gap: 8 }}>
        {events.slice(-10).reverse().map((e, i) => (
          <div key={i} style={{ padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: 6, borderLeft: "3px solid #3b82f6" }}>
            <div style={{ fontWeight: 700, color: "#fff" }}>{e.event}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(e.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
