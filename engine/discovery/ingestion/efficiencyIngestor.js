/**
 * Capital Efficiency Ingestor
 */

export function ingestEfficiency(raw) {
  return {
    roic: raw.roic ?? null,
    roe: raw.roe ?? null,
  };
}
