import React, { useState, useCallback } from "react";

/* ===== Memoized Forecast Panel ===== */
const ForecastPanel = React.memo(function ForecastPanel({
  result,
  loading,
  error,
  onRun
}) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2>Forecast Engine</h2>

      <button
        onClick={onRun}
        disabled={loading}
        style={{
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "default" : "pointer",
          marginBottom: "12px"
        }}
      >
        {loading ? "Forecasting…" : "Run Forecast"}
      </button>

      {loading && (
        <div style={{ opacity: 0.7, fontSize: "14px" }}>
          Generating forecast…
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#2a1215",
            color: "#fca5a5",
            borderRadius: "8px",
            fontSize: "14px",
            border: "1px solid rgba(248,113,113,0.3)"
          }}
        >
          {error}
        </div>
      )}

      {result && !error && (
        <pre
          style={{
            marginTop: "12px",
            background: "#18191c",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            overflowX: "auto"
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
});

export default function Forecast() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runForecast = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await window.api.runForecast();
      setResult(res);
    } catch (err) {
      setError("Forecast engine failed to generate a forecast.");
      console.error("Forecast error:", err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <ForecastPanel
      result={result}
      loading={loading}
      error={error}
      onRun={runForecast}
    />
  );
}

