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
  // Core discovery
  const [rows, setRows] = useState([]);
  const [themes, setThemes] = useState([]);
  const [watchlistCandidates, setWatchlistCandidates] = useState([]);
  const [divergenceMap, setDivergenceMap] = useState({});
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [telemetry, setTelemetry] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual research
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
        setPreview(Array.isArray(discovery?.preview) ? discovery.preview : []);
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
      setManualError("Manual analysis failed. Check IPC handler + engine availability.");
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
        <div
          style={{
            background: "#0b1220",
            padding: "1rem",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            marginTop: "1.25rem",
          }}
        >
          <h3 style={{ margin: 0 }}>
            Manual Research
            <span style={cadenceStyle()}>User-driven · Immediate</span>
          </h3>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
            <input
              value={manualSymbol}
              onChange={(e) => setManualSymbol(e.target.value)}
              placeholder="Enter ticker (e.g., NVDA)"
              style={{
                flex: 1,
                padding: "0.55rem 0.75rem",
                background: "#020617",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                borderRadius: "8px",
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && runManualResearch()}
            />
            <button
              onClick={runManualResearch}
              disabled={manualLoading}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {manualLoading ? "Analyzing…" : "Analyze"}
            </button>
          </div>

          {manualError && (
            <p style={{ marginTop: "0.75rem", color: "#fca5a5", fontWeight: 600 }}>
              {manualError}
            </p>
          )}

          {manual && (
            <div style={{ marginTop: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h3 style={{ margin: 0 }}>{manual.symbol}</h3>
                <span style={badgeStyle(manualDecision)}>{manualDecision}</span>
                <span style={{ opacity: 0.8, fontWeight: 700 }}>
                  Conviction: {manualConvPct}%
                </span>
              </div>

              {/* FUNDAMENTALS EXPLANATION (DEDICATED) */}
              <div
                style={{
                  marginTop: "0.75rem",
                  background: "#020617",
                  padding: "0.75rem",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ marginTop: 0 }}>Fundamental Assessment</h4>
                <p style={{ opacity: 0.85 }}>
                  {fundamentalContext?.summary || "Fundamental context unavailable."}
                </p>
                {Array.isArray(fundamentalContext?.details) && (
                  <ul style={{ paddingLeft: "1.1rem", opacity: 0.85 }}>
                    {fundamentalContext.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
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
            <div
              key={t.themeId}
              style={{
                background: "#0f172a",
                padding: "1rem",
                borderRadius: "10px",
                marginBottom: "0.75rem",
              }}
            >
              <strong>{t.label}</strong>
              <p style={{ marginTop: "0.4rem", opacity: 0.85 }}>{t.explanation}</p>
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
            <div
              key={w.watchId}
              style={{
                background: "#0b1220",
                padding: "0.9rem",
                borderRadius: "10px",
                marginBottom: "0.6rem",
              }}
            >
              <strong>{w.symbol}</strong>
              <p style={{ opacity: 0.7, marginTop: "0.3rem" }}>{w.monitorReason}</p>
            </div>
          ))
        )}

        {/* RANKED DISCOVERY */}
        <h3 style={{ marginTop: "2.5rem" }}>
          Ranked Market Discovery
          <span style={cadenceStyle()}>Tactical · Fast cadence</span>
        </h3>

        {rankedRows.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No assets passed discovery thresholds.</p>
        ) : (
          <table width="100%" cellPadding="10">
            <thead>
              <tr>
                <th align="left">Rank</th>
                <th align="left">Symbol</th>
                <th align="left">Decision</th>
                <th align="left">Regime</th>
                <th align="left">Why It Surfaced</th>
                <th align="right">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {rankedRows.map((r) => {
                const sym = getSymbol(r);
                const explanation = r.explanation || {};
                const factors = r.factorAttribution || {};
                const divergence = divergenceMap[sym];

                const convLabel = convictionLabelFromNormalized(r?.conviction?.normalized);
                const decision = r?.decision?.decision || "NONE";
                const regimeLabel = r?.regime?.label || "UNKNOWN";

                return (
                  <React.Fragment key={`${sym}-${r.rank}`}>
                    <tr
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setExpanded((p) => ({ ...p, [r.rank]: !p[r.rank] }));
                        setSelectedInsight({ row: r, divergence, factors });
                        loadConfidenceHistory(sym);
                      }}
                    >
                      <td>#{r.rank}</td>
                      <td>{sym}</td>
                      <td>
                        <span style={badgeStyle(decision)}>{decision}</span>
                      </td>
                      <td>{regimeLabel}</td>
                      <td style={{ opacity: 0.85 }}>
                        {explanation.plainEnglishSummary || explanation.summary || "—"}
                      </td>
                      <td align="right">
                        <span style={badgeStyle(convLabel)}>{convLabel}</span>
                      </td>
                    </tr>

                    {expanded[r.rank] && (
                      <tr>
                        <td colSpan={6} style={{ background: "#0f172a" }}>
                          <div style={{ padding: "1rem" }}>
                            {Object.keys(factors).length === 0 ? (
                              <p style={{ opacity: 0.65, margin: 0 }}>
                                No factor attribution available.
                              </p>
                            ) : (
                              Object.entries(factors).map(([k, v]) => (
                                <div
                                  key={k}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "0.15rem 0",
                                  }}
                                >
                                  <span style={{ opacity: 0.85 }}>{k}</span>
                                  <span style={deltaStyle(Number(v || 0))}>
                                    {Number(v || 0) > 0 ? "+" : ""}
                                    {Number(v || 0).toFixed(2)}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* RIGHT: INSIGHT PANEL */}
      <div
        style={{
          flex: 1,
          background: "#020617",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          padding: "1.25rem",
          borderRadius: "12px",
          height: "fit-content",
        }}
      >
        {!selectedInsight ? (
          <p style={{ opacity: 0.55 }}>Select a row to view insight.</p>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>{getSymbol(selectedInsight.row)}</h2>
            <p style={{ opacity: 0.7, marginTop: "0.25rem" }}>
              Insight Panel · Read-only
            </p>

            <h4 style={{ marginTop: "1.25rem" }}>Interpretation</h4>
            <p style={{ opacity: 0.85, marginTop: "0.25rem" }}>
              {selectedInsight.divergence?.summary ||
                selectedInsight.row?.explanation?.plainEnglishSummary ||
                "No divergence summary available."}
            </p>

            <h4 style={{ marginTop: "1.25rem" }}>Decision</h4>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <span
                style={badgeStyle(
                  selectedInsight.row?.decision?.decision || "NONE"
                )}
              >
                {selectedInsight.row?.decision?.decision || "NONE"}
              </span>
              <span style={{ opacity: 0.8, fontWeight: 700 }}>
                Conviction{" "}
                {(Number(selectedInsight.row?.conviction?.normalized ?? 0) * 100).toFixed(
                  1
                )}
                %
              </span>
            </div>

            <h4 style={{ marginTop: "1.25rem" }}>Confidence History</h4>
            {confidenceHistory.length === 0 ? (
              <p style={{ opacity: 0.5 }}>
                No confidence history recorded (or IPC not wired).
              </p>
            ) : (
              <ul style={{ paddingLeft: "1rem" }}>
                {confidenceHistory.map((h, i) => (
                  <li key={i}>
                    <span style={badgeStyle(h.confidence)}>{h.confidence}</span>{" "}
                    <span style={{ opacity: 0.6 }}>({h.regime})</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
