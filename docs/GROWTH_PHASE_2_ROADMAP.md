# JUPITER — Phase 2 Growth Engine Roadmap

## Status
- Phase: **Phase 2 (Growth Intelligence)**
- Current State: **Renderer-only Growth Engine (no IPC, no market data)**
- Stability: **Dashboard + Portfolio untouched and stable**
- Goal: **Add intelligence without regression**

---

## Phase 2A — Growth UX Completion (Renderer-Only, Safe)
**Rule:** No IPC, no main.js changes, no shared state.

### Completed
- Local growth computation (deterministic math)
- Interactive inputs (goal value, timeframe)
- Risk classification badges (Normal / Out-of-Bounds / Extreme)
- Growth curve chart
- Tooltips explaining risk states
- “What must change to become feasible” hints
- One-click “Make Feasible” auto-adjust
- Sensitivity visualization (which lever matters most)

### Lock Criteria
- UI responsive
- No console errors
- Dashboard + Portfolio unchanged

---

## Phase 2B — Scenario Intelligence (Still Renderer-Only)
**Purpose:** Make Growth a decision lab without external dependencies.

### Planned
- Save scenario snapshots (local state only)
- Compare multiple goals side-by-side
- Snapshot labeling (timeframe, aggressiveness)
- Clear/reset scenarios safely

### Explicitly Deferred
- No persistence to disk
- No IPC
- No portfolio injection

---

## Phase 2C — Controlled IPC Introduction (Read-Only)
**Rule:** Growth consumes data, never owns it.

### Planned
- Read-only IPC for:
  - Portfolio summary (aggregate only)
  - Market assumptions (static bands first)
- Strict contract: IPC exposed only via preload
- Zero writes, zero mutations

### Lock Criteria
- Growth works without IPC enabled
- IPC failure does not break UI

---

## Phase 2D — Market & Portfolio Awareness
**Purpose:** Anchor growth feasibility to reality.

### Planned
- Inject portfolio value + allocation bands
- Inject historical market distributions
- Show deltas vs current portfolio trajectory

---

## Phase 2E — Persistence & History
**Planned**
- Save/load scenario snapshots
- Compare past vs current goals
- Versioned snapshot format

---

## Non-Negotiable Contracts
- ❌ Do not touch `main.js` unless explicitly approved
- ❌ No regression in Dashboard or Portfolio
- ✅ One change layer at a time
- ✅ One command per step
- ✅ Freeze + tag after each stable milestone

---

## Definition of Success
- Growth Engine becomes a **decision-grade lab**
- Portfolio and Dashboard remain **authoritative and untouched**
- Each phase is independently runnable and revertible

---

**Next Immediate Step (after this doc):**
→ Decide whether to **lock Phase 2A** or proceed to **Phase 2B (Snapshots + Comparison)**.

