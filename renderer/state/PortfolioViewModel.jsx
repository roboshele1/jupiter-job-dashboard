import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * PortfolioViewModel (READ-ONLY)
 * ------------------------------
 * Consumes window.jupiter
 * Does NOT own truth
 * Does NOT derive portfolio
 */

const PortfolioViewModelContext = createContext(null);

export function PortfolioViewModelProvider({ children }) {
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.jupiter?.getPortfolioValuation) return;

    window.jupiter.getPortfolioValuation().then((data) => {
      setValuation(data);
      setLoading(false);
    });
  }, []);

  return (
    <PortfolioViewModelContext.Provider
      value={{
        valuation,
        loading,
        snapshot: window.jupiter.portfolioSnapshot,
      }}
    >
      {children}
    </PortfolioViewModelContext.Provider>
  );
}

export function usePortfolioViewModel() {
  const ctx = useContext(PortfolioViewModelContext);
  if (!ctx) {
    throw new Error("usePortfolioViewModel must be used inside provider");
  }
  return ctx;
}

