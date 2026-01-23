// renderer/pages/GrowthEngine.jsx
import React, { useEffect, useMemo, useState } from "react";
import { runAssetInjectionIntelligence } from "../insights/assetInjectionIntelligenceEngine.js";

// NOTE: The portfolio growth intelligence module referenced by this file does not exist in the repo.
// To prevent Vite from hard-failing on import, we provide a deterministic stub with the same call shape.
// This preserves the original UI and flow without truncation or refactoring.
function runPortfolioGrowthIntelligence() {
  return {
    requiredCAGR: 0,
    feasibility: "EXTREME",
    interpretation: "—",
  };
}

const RISK_UI = {
  FEASIBLE: {
    label: "FEASIBLE",
    color: "#16a34a",
    background: "rgba(22,163,74,0.15)",
    tooltip: "Required return is within normal long-term expectations.",
  },
  OUT_OF_BOUNDS: {
    label: "OUT OF BOUNDS",
    color: "#f59e0b",
    background: "rgba(245,158,11,0.15)",
    tooltip: "Required return exceeds expected performance; implies higher risk.",
  },
  EXTREME: {
    label: "EXTREME RISK",
    color: "#dc2626",
    background: "rgba(220,38,38,0.15)",
    tooltip: "Historically uncommon without leverage or concentration.",
  },
};

function money(n) {
  const x = Number(n || 0);
  return `$${x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct2(n) {
  const x = Number(n || 0);
  return `${x.toFixed(2)}%`;
}

export default function GrowthEngine() {
  // =========================
  // PORTFOLIO INPUTS (LEFT AS-IS)
  // =========================
  const [startingValue, setStartingValue] = useState(85000);
  const [targetValue, setTargetValue] = useState(250000);
  const [months, setMonths] = useState(60);
  const [expectedReturnPct, setExpectedReturnPct] = useState(10.0);
  const [aggressiveReturnPct, setAggressiveReturnPct] = useState(18.0);

  // =========================
  // CANDIDATE INPUTS (LEFT AS-IS + candidateMonths)
  // =========================
  const [symbol, setSymbol] = useState("MSTR");
  const [amount, setAmount] = useState(13466);
  const [assumedCagrPct, setAssumedCagrPct] = useState(30.0);
  const [targetedValue, setTargetedValue] = useState(50000);

  // Decoupled horizon for candidate injections
  const [candidateMonths, setCandidateMonths] = useState(60);

  // Back-solve required PV for candidate-only math
  useEffect(() => {
    if (targetedValue > 0 && assumedCagrPct > 0 && candidateMonths > 0) {
      const r = assumedCagrPct / 100;
      const tYears = candidateMonths / 12;
      const pv = targetedValue / Math.pow(1 + r, tYears);
      setAmount(Math.round(pv));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetedValue, assumedCagrPct, candidateMonths]);

  // =========================
  // RESULTS (DECOUPLED)
  // =========================
  const [portfolioOut, setPortfolioOut] = useState(null);
  const [candidateOut, setCandidateOut] = useState(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  async function runPortfolio() {
    setLoadingPortfolio(true);
    try {
      const out = runPortfolioGrowthIntelligence({
        startingValue,
        targetValue,
        horizonMonths: months,
        expectedReturnPct,
        aggressiveReturnPct,
      });
      setPortfolioOut(out);
    } finally {
      setLoadingPortfolio(false);
    }
  }

  async function runCandidate() {
    setLoadingCandidate(true);
    try {
      const out = runAssetInjectionIntelligence({
        symbol,
        startingAmount: amount,
        targetAmount: targetedValue,
        horizonMonths: candidateMonths,
        assumedCagrPct,
      });
      setCandidateOut(out);
    } finally {
      setLoadingCandidate(false);
    }
  }

  // Default compute once so UI isn’t blank
  useEffect(() => {
    runPortfolio();
    runCandidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requiredCagrPct = portfolioOut?.requiredCAGR ?? 0;
  const feasibilityKey = portfolioOut?.feasibility ?? "EXTREME";
  const riskBadge = RISK_UI[feasibilityKey] || RISK_UI.EXTREME;

  // What matters most bars (portfolio-only)
  const mattersMost = useMemo(() => {
    const pv = Number(startingValue || 0);
    const fv = Number(targetValue || 0);
    const m = Number(months || 0);

    if (pv <= 0 || fv <= 0 || m <= 0) {
      return [
        { key: "Time", value: 0.33 },
        { key: "Target", value: 0.33 },
        { key: "Return", value: 0.34 },
      ];
    }

    const reqNow = Math.pow(fv / pv, 12 / m) - 1;
    const reqMoreTime = Math.pow(fv / pv, 12 / (m + 12)) - 1;
    const reqLowerTarget = Math.pow((fv * 0.9) / pv, 12 / m) - 1;

    const timeImpact = Math.abs(reqMoreTime - reqNow);
    const targetImpact = Math.abs(reqLowerTarget - reqNow);
    const returnImpact = Math.abs((expectedReturnPct / 100) - reqNow);

    const max = Math.max(timeImpact, targetImpact, returnImpact, 1e-9);

    return [
      { key: "Time", value: timeImpact / max },
      { key: "Target", value: targetImpact / max },
      { key: "Return", value: returnImpact / max },
    ];
  }, [startingValue, targetValue, months, expectedReturnPct]);

  // Growth curve (portfolio-only)
  const curve = useMemo(() => {
    const pv = Number(startingValue || 0);
    const m = Number(months || 0);
    if (pv <= 0 || m <= 0) return [];

    const reqAnnual = (requiredCagrPct || 0) / 100;
    const reqMonthly = Math.pow(1 + reqAnnual, 1 / 12) - 1;
    const expMonthly = (Number(expectedReturnPct || 0) / 100) / 12;

    const pts = [];
    let req = pv;
    let exp = pv;

    for (let i = 0; i <= m; i++) {
      pts.push({ month: i, required: req, expected: exp });
      req = req * (1 + reqMonthly);
      exp = exp * (1 + expMonthly);
    }
    return pts;
  }, [startingValue, months, requiredCagrPct, expectedReturnPct]);

  const curveMax = useMemo(() => {
    if (!curve.length) return 1;
    return Math.max(...curve.map(p => Math.max(p.required, p.expected)), 1);
  }, [curve]);

  // Candidate rows (candidate-only; no portfolio fields)
  const candidateRows = useMemo(() => {
    if (!candidateOut) return [];
    return [
      {
        symbol: candidateOut.symbol,
        amount: Number(candidateOut.startingAmount || 0),
        assumedCAGR: Number(candidateOut.assumedCagrPct || 0) / 100,
        projectedValue: Number(candidateOut.projectedValue || 0),
        gapAtHorizon: Number(candidateOut.gapAtHorizon || 0),
      },
    ];
  }, [candidateOut]);

  const howCalculated = useMemo(() => {
    return {
      summary: `To grow from ${Number(startingValue).toLocaleString()} to ${Number(targetValue).toLocaleString()} over ${Number(months)} months, the portfolio must compound at ${pct2(requiredCagrPct)} annually.`,
      variables: [
        `Starting value: ${Number(startingValue).toLocaleString()}`,
        `Target value: ${Number(targetValue).toLocaleString()}`,
        `Time horizon: ${Number(months)} months`,
        `Expected return assumption: ${pct2(expectedReturnPct)}`,
        `Aggressive return threshold: ${pct2(aggressiveReturnPct)}`,
      ],
      interpretation: portfolioOut?.interpretation || "—",
    };
  }, [startingValue, targetValue, months, requiredCagrPct, expectedReturnPct, aggressiveReturnPct, portfolioOut]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Growth Engine</h1>
      <p>Renderer-only growth analysis. No IPC math. Governed engine via IPC.</p>

      <div
        title={riskBadge.tooltip}
        style={{
          display: "inline-block",
          marginTop: 12,
          marginBottom: 16,
          padding: "8px 16px",
          borderRadius: 999,
          color: riskBadge.color,
          background: riskBadge.background,
          fontWeight: 600,
          marginRight: 12,
        }}
      >
        {riskBadge.label}
      </div>

      <button
        onClick={runPortfolio}
        disabled={loadingPortfolio}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "none",
          background: "#2563eb",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
          marginRight: 10,
        }}
      >
        {loadingPortfolio ? "Running…" : "Run Portfolio Intelligence"}
      </button>

      <button
        onClick={runCandidate}
        disabled={loadingCandidate}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "none",
          background: "rgba(255,255,255,0.12)",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {loadingCandidate ? "Evaluating…" : "Evaluate Candidate Injection"}
      </button>

      {/* Inputs */}
      <section style={{ marginTop: 32 }}>
        <h3>Inputs</h3>

        <label>
          Starting Value
          <input type="number" value={startingValue} onChange={e => setStartingValue(+e.target.value)} />
        </label>

        <label>
          Target Value
          <input type="number" value={targetValue} onChange={e => setTargetValue(+e.target.value)} />
        </label>

        <label>
          Months
          <input type="number" value={months} onChange={e => setMonths(+e.target.value)} />
        </label>

        <label>
          Expected Return (%)
          <input
            type="number"
            step="0.1"
            value={Number(expectedReturnPct).toFixed(2)}
            onChange={e => setExpectedReturnPct(+e.target.value)}
          />
        </label>

        <label>
          Aggressive Return (%)
          <input
            type="number"
            step="0.1"
            value={Number(aggressiveReturnPct).toFixed(2)}
            onChange={e => setAggressiveReturnPct(+e.target.value)}
          />
        </label>
      </section>

      {/* Candidate Injection */}
      <section style={{ marginTop: 40 }}>
        <h3>Candidate Injection (Interactive)</h3>

        <label>
          Symbol
          <select value={symbol} onChange={e => setSymbol(e.target.value)}>
            <option value="MSTR">MSTR</option>
            <option value="NVDA">NVDA</option>
            <option value="ASML">ASML</option>
            <option value="AVGO">AVGO</option>
          </select>
        </label>

        <label>
          Amount
          <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} />
        </label>

        <label>
          Assumed CAGR (%)
          <input
            type="number"
            step="0.1"
            value={Number(assumedCagrPct).toFixed(2)}
            onChange={e => setAssumedCagrPct(+e.target.value)}
          />
        </label>

        <label>
          Horizon (Months)
          <input type="number" value={candidateMonths} onChange={e => setCandidateMonths(+e.target.value)} />
        </label>

        <label>
          Targeted Value ($)
          <input type="number" value={targetedValue} onChange={e => setTargetedValue(+e.target.value)} />
        </label>
      </section>

      {/* What matters most */}
      <section style={{ marginTop: 40 }}>
        <h3>What matters most</h3>
        {mattersMost.map(x => (
          <div key={x.key} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12 }}>{x.key}</div>
            <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.08)" }}>
              <div
                style={{
                  width: `${Math.round(x.value * 100)}%`,
                  height: "100%",
                  borderRadius: 6,
                  background: x.key === "Time" ? "#3b82f6" : x.key === "Target" ? "#f59e0b" : "#dc2626",
                }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Growth Curve */}
      <section style={{ marginTop: 40 }}>
        <h3>Growth Curve</h3>
        <svg width="100%" height="240">
          {curve.map((p, i) => {
            if (i === 0) return null;
            const prev = curve[i - 1];
            const x1 = `${((i - 1) / months) * 100}%`;
            const x2 = `${(i / months) * 100}%`;

            const y1Req = 220 - (prev.required / curveMax) * 200;
            const y2Req = 220 - (p.required / curveMax) * 200;

            const y1Exp = 220 - (prev.expected / curveMax) * 200;
            const y2Exp = 220 - (p.expected / curveMax) * 200;

            return (
              <g key={i}>
                <line x1={x1} y1={y1Req} x2={x2} y2={y2Req} stroke="#dc2626" strokeWidth="2" />
                <line x1={x1} y1={y1Exp} x2={x2} y2={y2Exp} stroke="#3b82f6" strokeWidth="2" />
              </g>
            );
          })}
        </svg>
      </section>

      {/* How calculated */}
      <section style={{ marginTop: 48 }}>
        <h3>How this was calculated</h3>
        <p>{howCalculated.summary}</p>
        <ul>
          {howCalculated.variables.map(v => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <p>
          <strong>Interpretation:</strong> {howCalculated.interpretation}
        </p>
      </section>

      {/* Candidate Asset Impact (Read-only) */}
      <section style={{ marginTop: 48 }}>
        <h3>Candidate Asset Impact (Read-only)</h3>

        <div style={{ marginTop: 16, opacity: 0.85 }}>
          <strong>Approximate required monthly contribution:</strong>{" "}
          {candidateOut?.results?.approximateRequiredMonthlyContribution !== undefined
            ? money(candidateOut.results.approximateRequiredMonthlyContribution)
            : "—"}
          <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
            Deterministic mathematical projection based on the selected amount,
            assumed CAGR, horizon, and target. Not a recommendation.
          </div>
        </div>

        <div style={{ opacity: 0.85, marginBottom: 12, lineHeight: 1.5 }}>
          <strong>Candidate Injection is evaluated in isolation.</strong>
          <br />
          <br />
          <ul>
            <li>
              <strong>Amount</strong> = the <em>total capital committed to this asset</em> today
              (existing position + any new capital you intend to add).
            </li>
            <li>
              <strong>Targeted Value</strong> = the desired <em>future value of this asset alone</em>
              at the end of the selected horizon.
            </li>
            <li>
              <strong>Horizon (Months)</strong> = the time window for this asset only.
              It is <em>not</em> shared with the portfolio.
            </li>
            <li>
              <strong>Assumed CAGR</strong> = your hypothetical growth rate for this asset
              (used only for math projection, not prediction).
            </li>
          </ul>
          <br />
          This analysis answers one question only:
          <br />
          <strong>
            “Given this amount, this horizon, and this assumed CAGR — does this single asset
            mathematically reach the target value?”
          </strong>
          <br />
          <br />
          No portfolio weights, diversification logic, or allocation advice are applied here.
        </div>

        <table style={{ width: "100%", maxWidth: 900 }}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Amount</th>
              <th>Assumed CAGR</th>
              <th>Projected Value</th>
              <th>Gap at Horizon</th>
            </tr>
          </thead>
          <tbody>
            {candidateRows.map(r => (
              <tr key={r.symbol}>
                <td>{r.symbol}</td>
                <td>{Number(r.amount).toLocaleString()}</td>
                <td>{pct2(r.assumedCAGR * 100)}</td>
                <td>{money(r.projectedValue)}</td>
                <td>{money(r.gapAtHorizon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
