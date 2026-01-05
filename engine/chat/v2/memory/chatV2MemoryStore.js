/**
 * CHAT_V2_MEMORY_STORE
 * ====================
 * Phase 28 — Read-only persistent memory layer
 *
 * PURPOSE
 * -------
 * - Persist factual chat context across sessions
 * - Store ONLY non-sensitive, non-executing memory
 * - Allow recall for intelligence enrichment (not decisions)
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No learning loops
 * - No mutation of portfolio
 * - No automatic behavior changes
 */

import fs from "fs";
import path from "path";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_MEMORY_CONTRACT = {
  name: "CHAT_V2_MEMORY_STORE",
  version: "1.0",
  mode: "READ_ONLY",
  persistence: "FILE_SYSTEM",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   STORAGE CONFIG
========================================================= */

const MEMORY_DIR = path.resolve("engine/data/memory");
const MEMORY_FILE = path.join(MEMORY_DIR, "chat_memory.json");

function ensureStore() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify([]));
  }
}

/* =========================================================
   READ MEMORY
========================================================= */

export function readChatMemory() {
  ensureStore();
  const raw = fs.readFileSync(MEMORY_FILE, "utf8");
  return JSON.parse(raw);
}

/* =========================================================
   WRITE MEMORY (CONTROLLED)
========================================================= */

export function appendChatMemory(entry = {}) {
  ensureStore();

  const memory = readChatMemory();

  const safeEntry = {
    timestamp: Date.now(),
    type: entry.type || "CONTEXT",
    summary: entry.summary || "",
    source: entry.source || "CHAT_V2",
  };

  memory.push(safeEntry);
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));

  return {
    contract: CHAT_V2_MEMORY_CONTRACT.name,
    status: "STORED",
    entry: safeEntry,
  };
}
