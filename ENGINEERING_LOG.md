## Signals Tab – Snapshot Disappearance (OPEN)

**Status:** Unresolved, frozen intentionally  
**First observed:** 2026-01-02  
**Impact:** Signals data disappears on tab navigation  
**Scope:** Signals tab only  
**Other tabs:** Dashboard & Portfolio confirmed stable  

### Symptoms
- Static snapshot renders consistently.
- Live IPC snapshot renders briefly, then disappears on tab click / remount.
- No console crash at time of disappearance.
- IPC returns valid snapshot at least once per session.
- Renderer re-hydration invalidates snapshot state.

### What This Is NOT
- Not a data fetch failure.
- Not a Polygon pricing issue.
- Not a Portfolio/Dashboard regression.
- Not a UI rendering bug.

### Likely Root Cause (Hypothesis)
Signals snapshot lifecycle is tied to renderer mount/unmount or IPC handler re-registration.
Snapshot object becomes null or overwritten during navigation.

### Actions Taken
- IPC-level pin attempted → insufficient.
- Renderer-level pin attempted → rejected (violates UI stability).
- Snapshot rehydration disabled → disappearance persists.

### Decision
Freeze Signals as-is and proceed with other tabs.
Return later with focused lifecycle instrumentation.

**Owner:** Engineer  
**Priority:** Medium (post-V1 stabilization)

