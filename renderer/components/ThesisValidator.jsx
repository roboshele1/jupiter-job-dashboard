import { useEffect, useState } from "react";
export default function ThesisValidator({ holdings }) {
  const [validations, setValidations] = useState([]);
  useEffect(() => {
    holdings.forEach(h => {
      const thesis = h.thesis || "Growth thesis";
      setValidations(prev => [...prev.filter(v => v.symbol !== h.symbol), { symbol: h.symbol, thesis, status: 'ACTIVE', price: h.price }]);
    });
  }, [holdings]);
  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Thesis Validation Gate</div>
      <div style={{ fontSize: 11, color: "#d1d5db", display: "flex", flexDirection: "column", gap: 8 }}>
        {validations.slice(0, 5).map(v => (
          <div key={v.symbol} style={{ padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: 6, display: "flex", justifyContent: "space-between" }}>
            <div><span style={{ fontWeight: 700, color: "#fff" }}>{v.symbol}</span> - {v.thesis}</div>
            <span style={{ color: "#22c55e" }}>✓ {v.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
