import { useState, useMemo } from "react";

const riskMeta = {
  FEASIBLE: {
    label: "FEASIBLE",
    color: "#16a34a",
    background: "rgba(22,163,74,0.15)",
    tooltip:
      "The required return is within normal long-term market expectations.",
  },
  OUT_OF_BOUNDS: {
    label: "OUT OF BOUNDS",
    color: "#f59e0b",
    background: "rgba(245,158,11,0.15)",
    tooltip:
      "The required return exceeds expected performance and would require higher risk.",
  },
  EXTREME: {
    label: "EXTREME RISK",
    color: "#dc2626",
    background: "rgba(220,38,38,0.15)",
    tooltip:
      "The required return is historically uncommon without leverage or concentration.",
  },
};

export default function GrowthEngine() {
  // -----------------------------
  // Inputs (renderer-only, UNCONSTRAINED)
  // -----------------------------
  const [startingValue, setStartingValue] = useState(85_000);
  const [targetValue, setTargetValue] = useState(250_000);
  const [months, setMonths] = useState(60);
  const [expectedReturn, setExpectedReturn] = useState(0.10);
  const [aggressiveReturn, setAggressiveReturn] = useState(0.18);

  // -----------------------------
  // Growth Engine IPC (read-only)
  // -----------------------------
  const [growthResult, setGrowthResult] = useState(null);
  const [growthLoading, setGrowthLoading] = useState(false);

  async function runGrowthEngineIpc() {
    setGrowthLoading(true);
    setGrowthResult(null);

    try {
      const result = await window.api.invoke("growthEngine:run");
      setGrowthResult(result);
    } catch (err) {
      console.error("Growth Engine IPC error:", err);
    } finally {
      setGrowthLoading(false);
    }
  }

  // -----------------------------
  // Core math (local intuition)
  // -----------------------------
  const requiredCAGR = useMemo(() => {
    if (startingValue <= 0 || targetValue <= 0 || months <= 0) return 0;
    return Math.pow(targetValue / startingValue, 12 / months) - 1;
  }, [startingValue, targetValue, months]);

  const classification = useMemo(() => {
    if (requiredCAGR > aggressiveReturn) return "EXTREME";
    if (requiredCAGR > expectedReturn) return "OUT_OF_BOUNDS";
    return "FEASIBLE";
  }, [requiredCAGR, aggressiveReturn, expectedReturn]);

  const risk = riskMeta[classification];

  // -----------------------------
  // Feasibility math (informational only)
  // -----------------------------
  const feasibility = useMemo(() => {
    if (startingValue <= 0 || targetValue <= 0) {
      return {
        feasibleMonths: null,
        feasibleTarget: null,
        feasibleReturn: null,
      };
    }

    const feasibleMonths =
      (12 * Math.log(targetValue / startingValue)) /
      Math.log(1 + expectedReturn);

    const feasibleTarget =
      startingValue * Math.pow(1 + expectedReturn, months / 12);

    const feasibleReturn =
      Math.pow(targetValue / startingValue, 12 / months) - 1;

    return {
      feasibleMonths: Math.ceil(feasibleMonths),
      feasibleTarget: Math.round(feasibleTarget),
      feasibleReturn,
    };
  }, [startingValue, targetValue, months, expectedReturn]);

  // -----------------------------
  // Sensitivity heatmap
  // -----------------------------
  const sensitivity = useMemo(() => {
    const deltaMonths =
      Math.abs(
        (Math.pow(targetValue / startingValue, 12 / (months + 12)) - 1) -
          requiredCAGR
      ) || 0;

    const deltaTarget =
      Math.abs(
        (Math.pow((targetValue * 0.9) / startingValue, 12 / months) - 1) -
          requiredCAGR
      ) || 0;

    const deltaReturn =
      Math.abs(expectedReturn - requiredCAGR) || 0;

    const max = Math.max(deltaMonths, deltaTarget, deltaReturn) || 1;

    return [
      { key: "Time", value: deltaMonths / max },
      { key: "Target", value: deltaTarget / max },
      { key: "Return", value: deltaReturn / max },
    ];
  }, [
    requiredCAGR,
    months,
    targetValue,
    startingValue,
    expectedReturn,
  ]);

  // -----------------------------
  // Chart data
  // -----------------------------
  const chartData = useMemo(() => {
    const points = [];
    const monthlyRequired =
      Math.pow(1 + requiredCAGR, 1 / 12) - 1;
    const monthlyExpected = expectedReturn / 12;

    let required = startingValue;
    let expected = startingValue;

    for (let i = 0; i <= months; i++) {
      points.push({ month: i, required, expected });
      required *= 1 + monthlyRequired;
      expected *= 1 + monthlyExpected;
    }

    return points;
  }, [startingValue, months, expectedReturn, requiredCAGR]);

  const maxValue = Math.max(
    ...chartData.map((p) => Math.max(p.required, p.expected))
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ padding: 24 }}>
      <h1>Growth Engine</h1>
      <p>
        Renderer-only growth analysis. No IPC math. Governed engine via IPC.
      </p>

      <div
        title={risk.tooltip}
        style={{
          display: "inline-block",
          marginTop: 12,
          marginBottom: 16,
          padding: "8px 16px",
          borderRadius: 999,
          color: risk.color,
          background: risk.background,
          fontWeight: 600,
        }}
      >
        {risk.label}
      </div>

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={runGrowthEngineIpc}
          disabled={growthLoading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {growthLoading ? "Running…" : "Run Growth Intelligence"}
        </button>
      </div>

      {/* Inputs */}
      <section>
        <h3>Inputs</h3>

        <label>
          Starting Value
          <input
            type="number"
            value={startingValue}
            onChange={(e) => setStartingValue(+e.target.value)}
          />
        </label>

        <label>
          Target Value
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(+e.target.value)}
          />
        </label>

        <label>
          Months
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(+e.target.value)}
          />
        </label>

        <label>
          Expected Return (%)
          <input
            type="number"
            step="0.1"
            value={(expectedReturn * 100).toFixed(2)}
            onChange={(e) =>
              setExpectedReturn(+e.target.value / 100)
            }
          />
        </label>

        <label>
          Aggressive Return (%)
          <input
            type="number"
            step="0.1"
            value={(aggressiveReturn * 100).toFixed(2)}
            onChange={(e) =>
              setAggressiveReturn(+e.target.value / 100)
            }
          />
        </label>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>What matters most</h3>
        {sensitivity.map((s) => (
          <div key={s.key} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12 }}>{s.key}</div>
            <div
              style={{
                height: 10,
                borderRadius: 6,
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  width: `${Math.round(s.value * 100)}%`,
                  height: "100%",
                  borderRadius: 6,
                  background:
                    s.key === "Time"
                      ? "#3b82f6"
                      : s.key === "Target"
                      ? "#f59e0b"
                      : "#dc2626",
                }}
              />
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Growth Curve</h3>
        <svg width="100%" height="240">
          {chartData.map((p, i) => {
            if (i === 0) return null;
            const prev = chartData[i - 1];

            const x1 = ((i - 1) / months) * 100 + "%";
            const x2 = (i / months) * 100 + "%";

            const yReq1 = 220 - (prev.required / maxValue) * 200;
            const yReq2 = 220 - (p.required / maxValue) * 200;

            const yExp1 = 220 - (prev.expected / maxValue) * 200;
            const yExp2 = 220 - (p.expected / maxValue) * 200;

            return (
              <g key={i}>
                <line x1={x1} y1={yReq1} x2={x2} y2={yReq2} stroke="#dc2626" strokeWidth="2" />
                <line x1={x1} y1={yExp1} x2={x2} y2={yExp2} stroke="#3b82f6" strokeWidth="2" />
              </g>
            );
          })}
        </svg>
      </section>

      {growthResult && (
        <section style={{ marginTop: 40 }}>
          <h3>Growth Intelligence (Read-only)</h3>
          <div style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            maxWidth: 900,
          }}>
            <div><strong>Contract:</strong> {growthResult.contract}</div>
            <div><strong>Status:</strong> {growthResult.status}</div>
            <div><strong>Timestamp:</strong> {new Date(growthResult.timestamp).toLocaleString()}</div>
          </div>
        </section>
      )}

      {/* =============================
          G5 — Candidate Asset Impact
          READ-ONLY | APPEND-ONLY
      ============================== */}
      {growthResult?.growthProfile?.candidateInjection?.outputs && (
        <section style={{ marginTop: 48 }}>
          <h3>Candidate Asset Impact (Read-only)</h3>

          <table style={{
            width: "100%",
            maxWidth: 900,
            borderCollapse: "collapse",
            marginTop: 12,
            fontSize: 14,
          }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <th>Symbol</th>
                <th>Amount</th>
                <th>Assumed CAGR</th>
                <th>Weight</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              {growthResult.growthProfile.candidateInjection.outputs.contributions.map((row) => (
                <tr key={row.symbol} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td>{row.symbol}</td>
                  <td>{row.amount.toLocaleString()}</td>
                  <td>{(row.assumedCAGR * 100).toFixed(2)}%</td>
                  <td>{(row.weight * 100).toFixed(2)}%</td>
                  <td>{(row.contribution * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
            Δ CAGR: {(growthResult.growthProfile.candidateInjection.outputs.deltaCAGR * 100).toFixed(2)}%
          </div>
        </section>
      )}
    </div>
  );
}
