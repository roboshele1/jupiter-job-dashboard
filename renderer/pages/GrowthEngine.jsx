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
  // Inputs
  // -----------------------------
  const [startingValue, setStartingValue] = useState(85000);
  const [targetValue, setTargetValue] = useState(250000);
  const [months, setMonths] = useState(60);
  const [expectedReturn, setExpectedReturn] = useState(0.10);
  const [aggressiveReturn, setAggressiveReturn] = useState(0.18);

  // -----------------------------
  // Core math
  // -----------------------------
  const requiredCAGR = useMemo(() => {
    return Math.pow(targetValue / startingValue, 12 / months) - 1;
  }, [startingValue, targetValue, months]);

  const classification = useMemo(() => {
    if (requiredCAGR > aggressiveReturn) return "EXTREME";
    if (requiredCAGR > expectedReturn) return "OUT_OF_BOUNDS";
    return "FEASIBLE";
  }, [requiredCAGR, aggressiveReturn, expectedReturn]);

  const risk = riskMeta[classification];

  // -----------------------------
  // Feasibility guidance + auto-fix targets
  // -----------------------------
  const feasibility = useMemo(() => {
    const feasibleMonths =
      (12 * Math.log(targetValue / startingValue)) /
      Math.log(1 + expectedReturn);

    const feasibleTarget =
      startingValue *
      Math.pow(1 + expectedReturn, months / 12);

    const feasibleReturn =
      Math.pow(targetValue / startingValue, 12 / months) - 1;

    return {
      feasibleMonths: Math.ceil(feasibleMonths),
      feasibleTarget: Math.round(feasibleTarget),
      feasibleReturn,
    };
  }, [startingValue, targetValue, months, expectedReturn]);

  // -----------------------------
  // One-click Make Feasible
  // Strategy: minimal disruption
  // Priority: time → target → return
  // -----------------------------
  function makeFeasible() {
    if (classification === "FEASIBLE") return;

    if (feasibility.feasibleMonths > months) {
      setMonths(Math.min(240, feasibility.feasibleMonths));
      return;
    }

    if (feasibility.feasibleTarget < targetValue) {
      setTargetValue(Math.max(10000, feasibility.feasibleTarget));
      return;
    }

    setExpectedReturn(
      Math.min(0.40, feasibility.feasibleReturn)
    );
  }

  // -----------------------------
  // Sensitivity heatmap (impact scores)
  // -----------------------------
  const sensitivity = useMemo(() => {
    const deltaMonths =
      Math.abs(
        (Math.pow(targetValue / startingValue, 12 / (months + 12)) -
          1) -
          requiredCAGR
      ) || 0;

    const deltaTarget =
      Math.abs(
        (Math.pow(
          (targetValue * 0.9) / startingValue,
          12 / months
        ) -
          1) -
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
      <p>Renderer-only growth analysis. No IPC. Local computation.</p>

      {/* Risk badge */}
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

      {/* Make feasible */}
      {classification !== "FEASIBLE" && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={makeFeasible}
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
            Make Feasible
          </button>
        </div>
      )}

      {/* Inputs */}
      <section>
        <h3>Inputs</h3>

        <label>
          Starting Value: ${startingValue.toLocaleString()}
          <input
            type="range"
            min="10000"
            max="200000"
            step="5000"
            value={startingValue}
            onChange={(e) => setStartingValue(+e.target.value)}
          />
        </label>

        <label>
          Target Value: ${targetValue.toLocaleString()}
          <input
            type="range"
            min="50000"
            max="500000"
            step="10000"
            value={targetValue}
            onChange={(e) => setTargetValue(+e.target.value)}
          />
        </label>

        <label>
          Months: {months}
          <input
            type="range"
            min="12"
            max="240"
            step="6"
            value={months}
            onChange={(e) => setMonths(+e.target.value)}
          />
        </label>

        <label>
          Expected Return: {(expectedReturn * 100).toFixed(1)}%
          <input
            type="range"
            min="0.04"
            max="0.40"
            step="0.005"
            value={expectedReturn}
            onChange={(e) =>
              setExpectedReturn(+e.target.value)
            }
          />
        </label>

        <label>
          Aggressive Return: {(aggressiveReturn * 100).toFixed(1)}%
          <input
            type="range"
            min="0.10"
            max="0.30"
            step="0.01"
            value={aggressiveReturn}
            onChange={(e) =>
              setAggressiveReturn(+e.target.value)
            }
          />
        </label>
      </section>

      {/* Sensitivity heatmap */}
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

      {/* Chart */}
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
                <line
                  x1={x1}
                  y1={yReq1}
                  x2={x2}
                  y2={yReq2}
                  stroke="#dc2626"
                  strokeWidth="2"
                />
                <line
                  x1={x1}
                  y1={yExp1}
                  x2={x2}
                  y2={yExp2}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        <div style={{ marginTop: 8, fontSize: 12 }}>
          <span style={{ color: "#dc2626" }}>■ Required</span>
          &nbsp;&nbsp;
          <span style={{ color: "#3b82f6" }}>■ Expected</span>
        </div>
      </section>
    </div>
  );
}

