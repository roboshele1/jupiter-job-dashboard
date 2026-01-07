import React, { useEffect, useState } from "react";

const badgeStyle = (level) => ({
  padding: "4px 8px",
  borderRadius: 6,
  fontWeight: 600,
  background:
    level === "High" ? "#2ecc71" : level === "Medium" ? "#f1c40f" : "#e67e22",
  color: "#000",
});

export default function DiscoveryLab() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.jupiter
      .invoke("discovery:run")
      .then((res) => setRows(res.canonical || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading discovery…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <h1>Discovery Lab</h1>

      <table width="100%" cellPadding="10">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Symbol</th>
            <th>Decision</th>
            <th>Regime</th>
            <th>Why It Surfaced</th>
            <th>Confidence</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const open = expanded[r.rank];
            const e = r.explanation;

            return (
              <React.Fragment key={r.rank}>
                <tr
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setExpanded((p) => ({ ...p, [r.rank]: !p[r.rank] }))
                  }
                >
                  <td>#{r.rank}</td>
                  <td>{r.symbol.symbol}</td>
                  <td>{r.decision.decision}</td>
                  <td>{r.regime.label}</td>
                  <td style={{ opacity: 0.85 }}>{e.plainEnglishSummary}</td>
                  <td>
                    <span style={badgeStyle(e.convictionContext?.confidence || "Low")}>
                      {e.convictionContext?.confidence || "Low"}
                    </span>
                  </td>
                </tr>

                {open && (
                  <tr>
                    <td colSpan={6} style={{ background: "#0f172a" }}>
                      <div style={{ padding: 16 }}>
                        <h4>Confidence</h4>
                        <p>{e.convictionContext.summary}</p>

                        <h4>Business Fundamentals</h4>
                        <ul>
                          {e.fundamentals.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>

                        <h4>Market Behavior</h4>
                        <ul>
                          {e.tacticalContext.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>

                        <h4>Regime Sensitivity</h4>
                        <p>{e.regime.assumption}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
