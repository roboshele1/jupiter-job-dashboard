import React, { useEffect, useMemo, useState } from "react";

const badgeStyle = (level) => {
  const map = {
    High: "#2ecc71",
    Medium: "#f1c40f",
    Low: "#e67e22",
    AVOID: "#e74c3c",
    HOLD: "#3498db",
    BUY: "#2ecc71",
    BUY_MORE: "#1abc9c",
    NONE: "#777",
    PASS: "#2ecc71",
    WARN: "#f1c40f",
    FAIL: "#e74c3c",
  };
  return {
    display: "inline-block",
    padding: "0.25rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    background: map[level] || "#777",
    color: "#000",
    fontWeight: 700,
  };
};

const cadenceStyle = () => ({
  fontSize: "0.75rem",
  opacity: 0.7,
  marginLeft: "0.5rem",
});

const deltaStyle = (value) => ({
  color: value > 0 ? "#2ecc71" : value < 0 ? "#e74c3c" : "#aaa",
  fontWeight: 700,
});

function getSymbol(r) {
  return r?.symbol?.symbol || r?.symbol || "";
}

function convictionLabelFromNormalized(n) {
  const x = Number(n ?? 0);
  if (x >= 0.7) return "High";
  if (x >= 0.4) return "Medium";
  return "Low";
}

export default function DiscoveryLab() {
  const [rows, setRows] = useState([]);
  const [themes, setThemes] = useState([]);
  const [watchlistCandidates, setWatchlistCandidates] = useState([]);
  const [divergenceMap, setDivergenceMap] = useState({});
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  const [manualSymbol, setManualSymbol] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState(null);
  const [manualError, setManualError] = useState("");

  const [confidenceHistory, setConfidenceHistory] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        const [discovery, watchlist, divergence] = await Promise.all([
          window.jupiter.invoke("discovery:run"),
          window.jupiter.invoke("watchlist:candidates"),
          window.jupiter.invoke("discovery:divergence:explanations").catch(() => null),
        ]);

        if (!mounted) return;

        setRows(Array.isArray(discovery?.canonical) ? discovery.canonical : []);
        setThemes(discovery?.emergingThemes?.themes || []);
        setTelemetry(discovery?.telemetry || null);
        setWatchlistCandidates(watchlist?.candidates || []);

        const map = {};
        (divergence?.explanations || []).forEach((e) => {
          if (e?.symbol) map[e.symbol] = e;
        });
        setDivergenceMap(map);
      } catch (err) {
        console.error("Discovery Lab load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  async function loadConfidenceHistory(symbol) {
    try {
      const result = await window.jupiter.invoke("confidence:history:get", { symbol });
      setConfidenceHistory(Array.isArray(result) ? result : []);
    } catch {
      setConfidenceHistory([]);
    }
  }

  async function runManualResearch() {
    const sym = (manualSymbol || "").trim().toUpperCase();
    if (!sym) return;

    setManualLoading(true);
    setManualResult(null);
    setManualError("");

    try {
      const r = await window.jupiter.invoke("discovery:analyze:symbol", {
        symbol: sym,
        ownership: true,
      });
      setManualResult(r || null);
    } catch (e) {
      console.error("Manual research failed:", e);
      setManualError("Manual analysis failed.");
    } finally {
      setManualLoading(false);
    }
  }

  const manual = manualResult?.result || null;
  const manualDecision = manual?.decision?.decision || "NONE";
  const manualConv = Number(manual?.conviction?.normalized ?? 0);
  const manualConvPct = (manualConv * 100).toFixed(1);
  const fundamentalContext = manual?.explanation?.fundamentalContext || null;

  const rankedRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading discovery intelligence…</div>;
  }

  return (
    <div style={{ display: "flex", height: "100%", padding: "2rem", gap: "1.5rem" }}>
      {/* LEFT */}
      <div style={{ flex: 3, maxWidth: 1400 }}>
        <h1>Discovery Lab</h1>
        <p style={{ opacity: 0.8 }}>
          Read-only market discovery surface (Phase D12+). Shadow autonomy preserved.
        </p>

        {/* MANUAL RESEARCH */}
        <div style={{ background: "#0b1220", padding: "1rem", borderRadius: "10px", marginTop: "1.25rem" }}>
          <h3 style={{ margin: 0 }}>
            Manual Research
            <span style={cadenceStyle()}>User-driven · Immediate</span>
          </h3>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
            <input
              value={manualSymbol}
              onChange={(e) => setManualSymbol(e.target.value)}
              placeholder="Enter ticker (e.g., NVDA)"
              style={{ flex: 1, padding: "0.55rem 0.75rem", background: "#020617", color: "#fff", borderRadius: "8px" }}
              onKeyDown={(e) => e.key === "Enter" && runManualResearch()}
            />
            <button onClick={runManualResearch} disabled={manualLoading}>
              {manualLoading ? "Analyzing…" : "Analyze"}
            </button>
          </div>

          {manual && (
            <div style={{ marginTop: "0.9rem" }}>
              <h3>{manual.symbol}</h3>
              <span style={badgeStyle(manualDecision)}>{manualDecision}</span>
              <span style={{ marginLeft: "0.5rem" }}>Conviction {manualConvPct}%</span>

              <h4>Fundamental Assessment</h4>
              <p>{fundamentalContext?.summary}</p>
              {Array.isArray(fundamentalContext?.details) && (
                <ul>
                  {fundamentalContext.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* EMERGING THEMES */}
        <h3 style={{ marginTop: "2.5rem" }}>
          Emerging Themes
          <span style={cadenceStyle()}>Structural · Slow cadence</span>
        </h3>
        {themes.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No emerging structural themes detected.</p>
        ) : (
          themes.map((t) => (
            <div key={t.themeId} style={{ background: "#0f172a", padding: "1rem", borderRadius: "10px", marginBottom: "0.75rem" }}>
              <strong>{t.label}</strong>
              <p style={{ opacity: 0.85 }}>{t.explanation}</p>
            </div>
          ))
        )}

        {/* WATCHLIST */}
        <h3 style={{ marginTop: "2.5rem" }}>
          Watchlist Candidates
          <span style={cadenceStyle()}>Observational · Medium cadence</span>
        </h3>
        {watchlistCandidates.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No assets currently meet monitoring criteria.</p>
        ) : (
          watchlistCandidates.map((w) => (
            <div key={w.watchId} style={{ background: "#0b1220", padding: "0.9rem", borderRadius: "10px", marginBottom: "0.6rem" }}>
              <strong>{w.symbol}</strong>
              <p style={{ opacity: 0.7 }}>{w.monitorReason}</p>
            </div>
          ))
        )}

        {/* RANKED DISCOVERY */}
        <h3 style={{ marginTop: "2.5rem" }}>
          Ranked Market Discovery
          <span style={cadenceStyle()}>Tactical · Fast cadence</span>
        </h3>

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
            {rankedRows.map((r) => {
              const sym = getSymbol(r);
              const factors = r.factorAttribution || {};
              return (
                <React.Fragment key={`${sym}-${r.rank}`}>
                  <tr
                    onClick={() => {
                      setExpanded((p) => ({ ...p, [r.rank]: !p[r.rank] }));
                      setSelectedInsight({ row: r });
                      loadConfidenceHistory(sym);
                    }}
                  >
                    <td>#{r.rank}</td>
                    <td>{sym}</td>
                    <td><span style={badgeStyle(r?.decision?.decision)}>{r?.decision?.decision}</span></td>
                    <td>{r?.regime?.label}</td>
                    <td>{r?.explanation?.plainEnglishSummary}</td>
                    <td>{convictionLabelFromNormalized(r?.conviction?.normalized)}</td>
                  </tr>

                  {expanded[r.rank] && (
                    <tr>
                      <td colSpan={6} style={{ background: "#0f172a" }}>
                        {Object.keys(factors).length === 0 ? (
                          <p>No factor attribution available.</p>
                        ) : (
                          Object.entries(factors).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>{k}</span>
                              <span style={deltaStyle(v)}>{v.toFixed(2)}</span>
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* TRAJECTORY WATCHLIST */}
        <h3 style={{ marginTop: "2.5rem" }}>
          Trajectory Watchlist
          <span style={cadenceStyle()}>Structural · Long horizon</span>
        </h3>

        {rankedRows.filter((r) => r?.trajectoryMatch?.available).length === 0 ? (
          <p style={{ opacity: 0.6 }}>No early trajectory patterns currently flagged.</p>
        ) : (
          rankedRows
            .filter((r) => r?.trajectoryMatch?.available)
            .map((r, i) => (
              <div key={`${getSymbol(r)}-trajectory-${i}`} style={{ background: "#0b1220", padding: "0.9rem", borderRadius: "10px", marginBottom: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <strong>{getSymbol(r)}</strong>
                  <span style={{ marginLeft: "0.5rem" }}>{r.trajectoryMatch.label}</span>
                  <span style={{ opacity: 0.75, fontWeight: 700 }}>
                    {(Number(r.trajectoryMatch.confidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <p style={{ opacity: 0.75 }}>{r.trajectoryMatch.explanation}</p>
              </div>
            ))
        )}
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, background: "#020617", padding: "1.25rem", borderRadius: "12px" }}>
        {!selectedInsight ? (
          <p>Select a row to view insight.</p>
        ) : (
          <>
            <h2>{getSymbol(selectedInsight.row)}</h2>

            <h4>Factor Attribution</h4>
            {Object.entries(selectedInsight.row.factorAttribution || {}).length === 0 ? (
              <p>No factor attribution available.</p>
            ) : (
              Object.entries(selectedInsight.row.factorAttribution).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{k}</span>
                  <span style={deltaStyle(v)}>{v.toFixed(2)}</span>
                </div>
              ))
            )}

            {selectedInsight.row?.fundamentalsAudit && (
              <>
                <h4>Fundamentals Audit</h4>
                {Object.entries(selectedInsight.row.fundamentalsAudit.categories).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{k}</span>
                    <span style={badgeStyle(v.status)}>{v.status}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
