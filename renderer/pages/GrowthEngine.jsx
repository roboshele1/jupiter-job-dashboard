import React, { useState } from "react";
import { buildSnapshot } from "../services/snapshotAdapter";
import { buildGrowthPlan } from "../../engine/growthPlanning";
import { buildScenarios } from "../../engine/scenarioSimulation";

export default function GrowthEngine() {
  const [mode, setMode] = useState("planning"); // planning | simulation

  const snapshot = buildSnapshot();

  const growthPlan = buildGrowthPlan({
    snapshot,
    reasoning: {},
  });

  const scenarios =
    mode === "simulation"
      ? buildScenarios({ growthPlan })
      : null;

  return (
    <div style={{ padding: "24px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1>Growth Engine</h1>
        <p style={{ maxWidth: "820px" }}>
          Phase 4–5 — Growth Planning & Scenario Simulation (read-only).
          <br />
          No calculations. No simulations. No IPC. Observer mode.
        </p>

        <div style={{ marginTop: "12px" }}>
          <button
            onClick={() => setMode("planning")}
            disabled={mode === "planning"}
          >
            Growth Planning
          </button>
          <button
            onClick={() => setMode("simulation")}
            disabled={mode === "simulation"}
            style={{ marginLeft: "8px" }}
          >
            Scenario Simulation
          </button>
        </div>
      </header>

      {mode === "planning" && (
        <section>
          <h3>Growth Paths</h3>

          {!growthPlan.available ? (
            <p style={{ opacity: 0.7 }}>
              Growth planning unavailable — portfolio snapshot missing.
            </p>
          ) : (
            growthPlan.paths.map((path) => (
              <div
                key={path.id}
                style={{
                  marginBottom: "16px",
                  padding: "16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  opacity: 0.85,
                }}
              >
                <h4>{path.title}</h4>
                <p>{path.description}</p>
                <p style={{ opacity: 0.7 }}>
                  <strong>Risk profile:</strong> {path.riskProfile} ·{" "}
                  <strong>Confidence:</strong> {path.confidence}
                </p>
              </div>
            ))
          )}
        </section>
      )}

      {mode === "simulation" && (
        <section>
          <h3>Scenario Simulation</h3>

          {!scenarios?.available ? (
            <p style={{ opacity: 0.7 }}>
              Scenarios unavailable — growth plan missing.
            </p>
          ) : (
            scenarios.scenarios.map((s) => (
              <div
                key={s.id}
                style={{
                  marginBottom: "16px",
                  padding: "16px",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  opacity: 0.85,
                }}
              >
                <h4>{s.title}</h4>
                <p>{s.narrative}</p>
                <ul>
                  {s.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <p style={{ opacity: 0.6 }}>
                  {s.limitations.join(" · ")}
                </p>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

