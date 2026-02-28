// renderer/jupiterSync.js
// JUPITER — Firestore Sync Engine (stub — Firebase disabled)

import { app } from "./firebase";

// If Firebase is disabled, stub all functions
const db = app ? (() => {
  try {
    const { getFirestore } = require("firebase/firestore");
    return getFirestore(app);
  } catch (e) {
    return null;
  }
})() : null;

// Stub all sync functions
export async function initialSyncToCloud() {
  if (!db) return console.log("[SYNC] Firebase disabled — skipping cloud sync");
}

export async function syncHoldingsToCloud() {
  if (!db) return null;
}

export async function syncLCPEToCloud() {
  if (!db) return null;
}

export async function fetchCloudHoldings() {
  if (!db) return [];
}
