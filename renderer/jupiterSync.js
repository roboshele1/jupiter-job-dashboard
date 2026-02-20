// renderer/jupiterSync.js
// JUPITER — Firestore Sync Engine (authoritative)
// Syncs: holdings, decision ledger, LCPE feedback, app settings
// Pattern: local is source of truth — Firestore mirrors it bidirectionally

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { app } from "./firebase";

const db = getFirestore(app);

// ─── Firestore paths ──────────────────────────────────────────────────────────
// users/{uid}/holdings         → array doc
// users/{uid}/settings         → doc
// users/{uid}/memory/events    → subcollection
// users/{uid}/lcpe/executions  → subcollection

// ─── Holdings ─────────────────────────────────────────────────────────────────
export async function pushHoldingsToCloud(uid, holdings) {
  if (!uid || !Array.isArray(holdings)) return;
  await setDoc(doc(db, "users", uid, "data", "holdings"), {
    holdings,
    updatedAt: serverTimestamp(),
  });
  console.log(`[SYNC] Holdings pushed to Firestore (${holdings.length} positions)`);
}

export async function pullHoldingsFromCloud(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid, "data", "holdings"));
  if (!snap.exists()) return null;
  return snap.data().holdings || null;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function pushSettingsToCloud(uid, settings) {
  if (!uid) return;
  await setDoc(doc(db, "users", uid, "data", "settings"), {
    ...settings,
    updatedAt: serverTimestamp(),
  });
  console.log("[SYNC] Settings pushed to Firestore");
}

export async function pullSettingsFromCloud(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid, "data", "settings"));
  if (!snap.exists()) return null;
  return snap.data();
}

// ─── Memory / Decision Ledger ─────────────────────────────────────────────────
export async function pushMemoryEventToCloud(uid, event) {
  if (!uid || !event) return;
  await addDoc(collection(db, "users", uid, "memory"), {
    ...event,
    syncedAt: serverTimestamp(),
  });
}

export async function pullMemoryFromCloud(uid, maxEvents = 200) {
  if (!uid) return [];
  const q = query(
    collection(db, "users", uid, "memory"),
    orderBy("syncedAt", "desc"),
    limit(maxEvents)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Bulk push entire ledger (first-time sync)
export async function pushFullMemoryToCloud(uid, events) {
  if (!uid || !Array.isArray(events) || events.length === 0) return;
  const BATCH_SIZE = 400; // Firestore batch limit is 500
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = events.slice(i, i + BATCH_SIZE);
    chunk.forEach(event => {
      const ref = doc(collection(db, "users", uid, "memory"));
      batch.set(ref, { ...event, syncedAt: serverTimestamp() });
    });
    await batch.commit();
  }
  console.log(`[SYNC] Memory ledger pushed (${events.length} events)`);
}

// ─── LCPE Feedback ────────────────────────────────────────────────────────────
export async function pushLCPEExecutionToCloud(uid, execution) {
  if (!uid || !execution) return;
  await addDoc(collection(db, "users", uid, "lcpe"), {
    ...execution,
    syncedAt: serverTimestamp(),
  });
}

export async function pullLCPEFromCloud(uid, maxRecords = 500) {
  if (!uid) return [];
  const q = query(
    collection(db, "users", uid, "lcpe"),
    orderBy("syncedAt", "desc"),
    limit(maxRecords)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Bulk push entire LCPE history (first-time sync)
export async function pushFullLCPEToCloud(uid, executions) {
  if (!uid || !Array.isArray(executions) || executions.length === 0) return;
  const BATCH_SIZE = 400;
  for (let i = 0; i < executions.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = executions.slice(i, i + BATCH_SIZE);
    chunk.forEach(exec => {
      const ref = doc(collection(db, "users", uid, "lcpe"));
      batch.set(ref, { ...exec, syncedAt: serverTimestamp() });
    });
    await batch.commit();
  }
  console.log(`[SYNC] LCPE history pushed (${executions.length} executions)`);
}

// ─── Full initial sync (call once on first login) ─────────────────────────────
export async function initialSyncToCloud(uid, { holdings, memoryEvents, lcpeExecutions, settings }) {
  console.log("[SYNC] Starting initial full sync to Firestore...");
  const results = await Promise.allSettled([
    holdings       ? pushHoldingsToCloud(uid, holdings)             : Promise.resolve(),
    settings       ? pushSettingsToCloud(uid, settings)             : Promise.resolve(),
    memoryEvents   ? pushFullMemoryToCloud(uid, memoryEvents)       : Promise.resolve(),
    lcpeExecutions ? pushFullLCPEToCloud(uid, lcpeExecutions)       : Promise.resolve(),
  ]);
  const failed = results.filter(r => r.status === "rejected");
  if (failed.length > 0) {
    console.error("[SYNC] Some syncs failed:", failed.map(f => f.reason));
  } else {
    console.log("[SYNC] Initial sync complete ✓");
  }
  return { success: failed.length === 0, failed: failed.length };
}
