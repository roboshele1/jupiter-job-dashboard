/**
 * interpretationRules
 * -------------------
 * Deterministic rules for interpreting dashboard truth.
 */

export function interpretSnapshot(snapshot, interpretation) {
  if (!snapshot || !snapshot.snapshotTimestamp) {
    interpretation.snapshot.available = false;
    interpretation.dataQuality.warnings.push("Snapshot timestamp unavailable");
  } else {
    interpretation.snapshot.available = true;
    interpretation.snapshot.timestamp = snapshot.snapshotTimestamp;
  }
}

export function interpretPortfolio(snapshot, interpretation) {
  if (snapshot.portfolioValue == null) {
    interpretation.dataQuality.missingFields.push("portfolioValue");
  } else {
    interpretation.portfolio.totalValue = snapshot.portfolioValue;
  }

  if (snapshot.dailyPL == null) {
    interpretation.dataQuality.missingFields.push("dailyPL");
  } else {
    interpretation.portfolio.dailyPL = snapshot.dailyPL;
  }

  if (snapshot.dailyPLPct == null) {
    interpretation.dataQuality.missingFields.push("dailyPLPct");
  } else {
    interpretation.portfolio.dailyPLPct = snapshot.dailyPLPct;
  }
}

export function interpretAllocation(snapshot, interpretation) {
  if (!snapshot.allocation) {
    interpretation.dataQuality.missingFields.push("allocation");
    return;
  }

  interpretation.allocation.summary = snapshot.allocation;

  if (snapshot.allocation.Equity > 70) {
    interpretation.allocation.notes.push(
      "Portfolio is equity-heavy relative to digital assets."
    );
  }
}

export function interpretHoldings(snapshot, interpretation) {
  if (!snapshot.topHoldings || snapshot.topHoldings.length === 0) {
    interpretation.dataQuality.missingFields.push("topHoldings");
    return;
  }

  interpretation.holdings.top = snapshot.topHoldings;

  if (snapshot.topHoldings.length <= 3) {
    interpretation.holdings.concentrationNote =
      "Portfolio is highly concentrated in top holdings.";
  }
}

