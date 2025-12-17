/**
 * JUPITER — System (Command Center)
 * --------------------------------
 * PERMANENT FIX:
 * - System page now derives totals directly from the canonical portfolio engine
 * - No mocks, no cached math, no divergence from Portfolio tab
 * - Single source of truth via IPC
 */

import { useEffect, useState } from "react";

export default function System() {
  const [totalValue, setTotalValue] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTotal() {
      try {
        const getFn =
          window.jupiter?.portfolio?.get ||
          window.engine?.getPortfolio ||
          window.api?.getPortfolio ||
          window.electronAPI?.getPortfolio;

        if (!getFn) {
          throw new Error("No IPC portfolio getter available");
        }

        const portfolio = await getFn();

        if (!Array.isArray(portfolio)) {
          throw new Error("Invalid portfolio payload");
        }

        const total = portfolio.reduce((sum, row) => {
          const v = Number(row.value ?? row.marketValue);
          return sum + (Number.isFinite(v) ? v : 0);
        }, 0);

        if (mounted) setTotalValue(total);
      } catch (e) {
        console.error("System page portfolio load failed:", e);
        if (mounted) setError(true);
      }
    }

    loadTotal();

    return () => {
      mounted = false;
    };
  }, []);

  const formatted =
    typeof totalValue === "number"
      ? totalValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      : null;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 56, marginBottom: 32 }}>
        JUPITER — Command Center
      </h1>

      <div
        style={{
          maxWidth: 560,
          borderRadius: 24,
          padding: 32,
          background: "rgba(255,255,255,0.06)"
        }}
      >
        <div style={{ fontSize: 22, opacity: 0.85, marginBottom: 12 }}>
          Total Portfolio Value
        </div>

        <div style={{ fontSize: 56, fontWeight: 700 }}>
          {error ? "—" : formatted ? `$${formatted}` : "—"}
        </div>
      </div>
    </div>
  );
}

