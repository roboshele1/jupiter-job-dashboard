// hooks/useJupiterChat.js
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Renderer-only, read-only.
 * Reads the same Market Snapshot source the Market Monitor uses: http://localhost:3001/snapshot
 * No IPC. No engine writes. No fake data.
 */

const SNAPSHOT_URL = "http://localhost:3001/snapshot";
const POLL_MS = 5000;

function fmtMoney(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "N/A";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtTime(ts) {
  const ms = typeof ts === "number" ? ts : Number(ts);
  if (!ms || Number.isNaN(ms)) return "Unknown";
  try {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "Unknown";
  }
}

function normalizeSnapshot(raw) {
  if (!raw || typeof raw !== "object") return null;
  const crypto = Array.isArray(raw.crypto) ? raw.crypto : [];
  const equities = Array.isArray(raw.equities) ? raw.equities : [];
  const timestamp = raw.timestamp ?? null;

  const bySymbol = new Map();
  for (const row of [...crypto, ...equities]) {
    if (row && row.symbol && typeof row.price === "number") {
      bySymbol.set(String(row.symbol).toUpperCase(), row);
    }
  }

  return { crypto, equities, timestamp, bySymbol };
}

function answerFromSnapshot(userText, snap) {
  const q = String(userText || "").trim();
  const qUpper = q.toUpperCase();

  if (!snap) {
    return "No market snapshot available yet.";
  }

  // Market live check
  if (qUpper.includes("MARKET LIVE") || qUpper.includes("LIVE?") || qUpper === "LIVE" || qUpper.includes("IS THE MARKET LIVE")) {
    return `Market snapshot is live. Last update: ${fmtTime(snap.timestamp)}.`;
  }

  // Last update / timestamp
  if (qUpper.includes("LAST UPDATE") || qUpper.includes("TIMESTAMP") || qUpper.includes("UPDATED")) {
    return `Last market snapshot update: ${fmtTime(snap.timestamp)}.`;
  }

  // If they asked about a specific ticker/symbol
  const knownSymbols = [
    "BTC-USD",
    "ETH-USD",
    "ASML",
    "NVDA",
    "AVGO",
    "MSTR",
    "HOOD",
    "BMNR",
    "APLD",
  ];

  // Direct match first
  for (const sym of knownSymbols) {
    if (qUpper.includes(sym)) {
      const row = snap.bySymbol.get(sym);
      if (!row) return `I don’t have ${sym} in the current snapshot. Last update: ${fmtTime(snap.timestamp)}.`;
      return `${sym}: ${fmtMoney(row.price)} (source: ${row.source || "unknown"}) • Last update: ${fmtTime(snap.timestamp)}.`;
    }
  }

  // Common wording (“BTC”, “ETH”)
  if (qUpper.includes("BTC")) {
    const row = snap.bySymbol.get("BTC-USD");
    if (!row) return `I don’t have BTC-USD in the current snapshot. Last update: ${fmtTime(snap.timestamp)}.`;
    return `BTC-USD: ${fmtMoney(row.price)} (source: ${row.source || "unknown"}) • Last update: ${fmtTime(snap.timestamp)}.`;
  }
  if (qUpper.includes("ETH")) {
    const row = snap.bySymbol.get("ETH-USD");
    if (!row) return `I don’t have ETH-USD in the current snapshot. Last update: ${fmtTime(snap.timestamp)}.`;
    return `ETH-USD: ${fmtMoney(row.price)} (source: ${row.source || "unknown"}) • Last update: ${fmtTime(snap.timestamp)}.`;
  }

  // Portfolio-style prompt (still read-only)
  if (qUpper.includes("PORTFOLIO") || qUpper.includes("HOW IS MY PORTFOLIO")) {
    // We cannot compute P/L here without holdings/valuation wiring. Stay honest.
    return `I can see current market prices via snapshot (last update: ${fmtTime(snap.timestamp)}), but portfolio valuation/P&L isn’t wired into Chat yet. Ask for a ticker price (e.g., BTC, NVDA, ASML) or “last update”.`;
  }

  // Default: help / capabilities grounded in snapshot
  return `I’m snapshot-driven right now (read-only). Ask: “Is the market live?”, “last update”, or a ticker (BTC, ETH, NVDA, ASML, AVGO, MSTR, HOOD, BMNR, APLD).`;
}

export default function useJupiterChat() {
  const [snapshot, setSnapshot] = useState(null);
  const [snapshotError, setSnapshotError] = useState(null);
  const [isSnapshotLive, setIsSnapshotLive] = useState(false);
  const lastOkRef = useRef(0);

  const snapshotMeta = useMemo(() => {
    if (!snapshot) return { lastUpdateLabel: "Unknown", hasSnapshot: false };
    return { lastUpdateLabel: fmtTime(snapshot.timestamp), hasSnapshot: true };
  }, [snapshot]);

  useEffect(() => {
    let alive = true;

    async function pull() {
      try {
        const res = await fetch(SNAPSHOT_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const norm = normalizeSnapshot(raw);
        if (!norm) throw new Error("Invalid snapshot payload");

        if (!alive) return;
        setSnapshot(norm);
        setSnapshotError(null);
        lastOkRef.current = Date.now();
        setIsSnapshotLive(true);
      } catch (e) {
        if (!alive) return;
        setSnapshotError(String(e?.message || e));
        // mark as not live if we haven't had a good snapshot recently
        const age = Date.now() - lastOkRef.current;
        if (age > POLL_MS * 2) setIsSnapshotLive(false);
      }
    }

    pull();
    const id = setInterval(pull, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  function reply(userText) {
    return answerFromSnapshot(userText, snapshot);
  }

  return {
    snapshot,
    snapshotMeta,
    snapshotError,
    isSnapshotLive,
    reply,
  };
}

