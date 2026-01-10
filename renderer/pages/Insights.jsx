import { useEffect, useState } from "react";

export default function Insights() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    interpretations: []
  });

  useEffect(() => {
    let mounted = true;

    async function loadInsights() {
      try {
        // Pull authoritative snapshot already used elsewhere
        const snapshot = await window.api.invoke("portfolio:getValuation");

        const result = await window.api.invoke(
          "insights:v2:get",
          snapshot
        );

        if (!mounted) return;

        if (result.status !== "OK") {
          setState({
            loading: false,
            error: result.message || "Insights unavailable",
            interpretations: []
          });
          return;
        }

        setState({
          loading: false,
          error: null,
          interpretations: result.interpretations || []
        });
      } catch (err) {
        if (!mounted) return;
        setState({
          loading: false,
          error: err.message,
          interpretations: []
        });
      }
    }

    loadInsights();
    return () => (mounted = false);
  }, []);

  if (state.loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights (V2)</h2>
        <p>Loading qualitative interpretations…</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights (V2)</h2>
        <p style={{ color: "red" }}>{state.error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Insights (V2)</h2>
      <p style={{ opacity: 0.7 }}>
        Qualitative interpretations of portfolio structure. Read-only.
      </p>

      <ul style={{ marginTop: 16 }}>
        {state.interpretations.map((item, idx) => (
          <li key={idx} style={{ marginBottom: 12 }}>
            <strong>{item.type}</strong>{" "}
            <span style={{ opacity: 0.7 }}>
              ({item.severity})
            </span>
            <div>{item.message}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
