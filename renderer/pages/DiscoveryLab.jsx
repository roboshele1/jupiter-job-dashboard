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
          window.jupiter
            .invoke("discovery:divergence:explanations")
            .catch(() => null),
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
      const result = await window.jupiter.invoke("confidence:history:get", {
        symbol,
      });
      setConfidenceHistory(Array.isArray(result) ? result : []);
    } catch {
      setConfidenceHistory([]);
    }
  }

  async function runManualResearch() {
    const sym = manualSymbol.trim().toUpperCase();
    if (!sym) return;

    setManualLoading(true);
    setManualError("");
    setManualResult(null);

    try {
      const r = await window.jupiter.invoke("discovery:analyze:symbol", {
        symbol: sym,
        ownership: true,
      });
      setManualResult(r || null);
    } catch (e) {
      console.error(e);
      setManualError("Manual analysis failed.");
    } finally {
      setManualLoading(false);
    }
  }

  const manual = manualResult?.result || null;
  const manualDecision = manual?.decision?.decision || "NONE";
  const manualConv = Number(manual?.conviction?.normalized ?? 0);
  const manualConvPct = (manualConv * 100).toFixed(1);

  const fundamentals = manual?.fundamentals?.factors || {};

  const rankedRows = useMemo(() => rows, [rows]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading discovery intelligence…</div>;
  }

  return (
    <div style={{ display: "flex", height: "100%", padding: "2rem", gap: "1.5rem" }}>
      {/* LEFT */}
      <div style={{ flex: 3 }}>
        <h1>Discovery Lab</h1>
        <p style={{ opacity: 0.8 }}>
          Read-only market discovery surface (Phase D12+). Shadow autonomy preserved.
        </p>

        {/* MANUAL RESEARCH */}
        <div style={{ background: "#0b1220", padding: "1rem", borderRadius: "10px" }}>
          <h3>
            Manual Research
            <span style={cadenceStyle()}>User-driven · Immediate</span>
          </h3>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              value={manualSymbol}
              onChange={(e) => setManualSymbol(e.target.value)}
              placeholder="Enter ticker (e.g., NVDA)"
              style={{ flex: 1, padding: "0.6rem", borderRadius: "8px" }}
              onKeyDown={(e) => e.key === "Enter" && runManualResearch()}
            />
            <button onClick={runManualResearch} disabled={manualLoading}>
              {manualLoading ? "Analyzing…" : "Analyze"}
            </button>
          </div>

          {manualError && <p style={{ color: "#fca5a5" }}>{manualError}</p>}

          {manual && (
            <>
              <div style={{ marginTop: "1rem" }}>
                <strong>{manual.symbol}</strong>{" "}
                <span style={badgeStyle(manualDecision)}>{manualDecision}</span>{" "}
                <span>Conviction {manualConvPct}%</span>
              </div>

              {/* FUNDAMENTALS PANEL (NEW, MANUAL ONLY) */}
              <div
                style={{
                  marginTop: "1rem",
                  background: "#020617",
                  padding: "0.75rem",
                  borderRadius: "8px",
                }}
              >
                <h4>Fundamentals (Read-only)</h4>
                <ul>
                  <li>Growth: {fundamentals.growth ?? "—"}</li>
                  <li>Quality (Margins): {fundamentals.quality ?? "—"}</li>
                  <li>Cash Generation: {fundamentals.cash ?? "—"}</li>
                  <li>Balance Sheet Risk: {fundamentals.risk ?? "—"}</li>
                  <li>
                    <strong>Total Score: {manual?.conviction?.score ?? "—"} / 10</strong>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* THEMES */}
        <h3 style={{ marginTop: "2.5rem" }}>Emerging Themes</h3>
        {themes.length === 0 ? (
          <p>No emerging themes.</p>
        ) : (
          themes.map((t) => (
            <div key={t.themeId}>
              <strong>{t.label}</strong>
              <p>{t.explanation}</p>
            </div>
          ))
        )}

        {/* WATCHLIST */}
        <h3>Watchlist Candidates</h3>
        {watchlistCandidates.length === 0 ? (
          <p>No monitoring candidates.</p>
        ) : (
          watchlistCandidates.map((w) => <div key={w.watchId}>{w.symbol}</div>)
        )}

        {/* RANKED DISCOVERY */}
        <h3>Ranked Market Discovery</h3>
        {rankedRows.length === 0 ? (
          <p>No assets passed discovery thresholds.</p>
        ) : (
          <table width="100%">
            <tbody>
              {rankedRows.map((r) => (
                <tr
                  key={r.rank}
                  onClick={() => {
                    setSelectedInsight({ row: r, divergence: divergenceMap[getSymbol(r)] });
                    loadConfidenceHistory(getSymbol(r));
                  }}
                >
                  <td>#{r.rank}</td>
                  <td>{getSymbol(r)}</td>
                  <td>
                    <span style={badgeStyle(r.decision.decision)}>
                      {r.decision.decision}
                    </span>
                  </td>
                  <td>
                    <span style={badgeStyle(convictionLabelFromNormalized(r.conviction.normalized))}>
                      {convictionLabelFromNormalized(r.conviction.normalized)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* RIGHT: INSIGHTS */}
      <div style={{ flex: 1, padding: "1rem", background: "#020617" }}>
        {!selectedInsight ? (
          <p>Select a row to view insight.</p>
        ) : (
          <>
            <h2>{getSymbol(selectedInsight.row)}</h2>
            <p>{selectedInsight.row.explanation?.plainEnglishSummary}</p>
          </>
        )}
      </div>
    </div>
  );
}
