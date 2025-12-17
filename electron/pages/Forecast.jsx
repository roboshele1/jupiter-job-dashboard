import { useState } from "react";

export default function Forecast() {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);

  const runForecast = async () => {
    setLoading(true);
    setForecast(null);

    try {
      const result = await window.JupiterAPI.runForecast();
      setForecast(result);
    } catch (err) {
      console.error("Forecast error:", err);
      setForecast({ error: "Forecast failed." });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>Jupiter Forecasting Layer</h1>
      <p style={{ opacity: 0.7, marginBottom: "30px" }}>
        Prototype forecasting engine (Day 34A).  
        Generates directional market signals using placeholder logic.
      </p>

      <button
        onClick={runForecast}
        style={{
          background: "#5A4BFF",
          padding: "12px 22px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          color: "white",
          fontSize: "16px",
          fontWeight: "600",
          marginBottom: "30px",
        }}
      >
        {loading ? "Running Forecast..." : "Run Forecast"}
      </button>

      {forecast && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "8px",
            background: "#1a1a1a",
            border: "1px solid #333",
          }}
        >
          {forecast.error ? (
            <p style={{ color: "red" }}>{forecast.error}</p>
          ) : (
            <>
              <p>
                <strong>Direction:</strong> {forecast.direction}
              </p>
              <p>
                <strong>Confidence:</strong> {forecast.confidence}%
              </p>
              <p>
                <strong>Timestamp:</strong> {forecast.timestamp}
              </p>
              <p style={{ opacity: 0.8 }}>{forecast.message}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

