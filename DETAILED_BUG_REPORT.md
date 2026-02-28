# Detailed Bug Report — All 13 Issues

## P0 Issues (Data Corruption)

### Bug #1: portfolioValuation.js Cost Basis Override
**File:** engine/portfolio/portfolioValuation.js  
**Line:** ~31  
**Severity:** P0 (Data corruption)  
**Impact:** All P&L calculations wrong across Dashboard, Portfolios, Signals, Decisions  
**Root Cause:** `getCostBasis(h.symbol)` reads from separate authority instead of `h.totalCostBasis` from holdings.json  
**Current Code:**
\`\`\`javascript
const totalCostBasis = Number(getCostBasis(h.symbol)) || 0;
\`\`\`
**Should Be:**
\`\`\`javascript
const totalCostBasis = Number(h.totalCostBasis) || 0;
\`\`\`
**Affected Tabs:** Dashboard, Portfolios, Signals, Decisions, Insights  
**Estimate:** 1 line change, full regression test  

### Bug #2: Signals.jsx Hardcoded CRYPTO_HOLDINGS
**File:** renderer/pages/Signals.jsx  
**Lines:** 363-365, 402 (usage)  
**Severity:** P0 (Stale financial data)  
**Impact:** BTC/ETH quantities and costs don't reflect portfolio edits, P&L wrong  
**Root Cause:** Constants hardcoded in component, not read from holdings or Kelly IPC  
**Current Code:**
\`\`\`javascript
const CRYPTO_HOLDINGS = [
  { symbol: 'BTC', qty: 0.281212, totalCostBasis: 24764.31, ... },
  { symbol: 'ETH', qty: 0.25, totalCostBasis: 597.90, ... },
];
// Later...
{CRYPTO_HOLDINGS.map(h => ( ... ))}
\`\`\`
**Fix Option A:** Remove const, read from kellyData.actions (requires adding qty/totalCostBasis to Kelly IPC response)  
**Fix Option B:** Add separate holdings IPC call, cross-reference  
**Estimate:** 10-15 line changes, need Kelly IPC contract update  

## P1 Issues (Functional Breaks)

### Bug #3: registerIpc.js ETF assetClass Coercion
**File:** electron/ipc/registerIpc.js  
**Line:** ~45 in loadHoldingsFull()  
**Severity:** P1 (Breaks TSX ETF resolution)  
**Impact:** XEQT.TO and other TSX ETFs treated as equity, wrong price resolution path  
**Current Code:**
\`\`\`javascript
assetClass: x.assetClass === 'crypto' ? 'crypto' : 'equity'
\`\`\`
**Should Be:**
\`\`\`javascript
assetClass: x.assetClass === 'crypto' ? 'crypto' : x.assetClass === 'etf' ? 'etf' : 'equity'
\`\`\`
**Estimate:** 1 line change, ETF resolution test  

### Bug #4: watchlist:candidates Permanently Stubbed
**File:** electron/ipc/registerIpc.js  
**Impact:** Discovery Lab Monitoring tab always empty  
**Current Code:**
\`\`\`javascript
registerHandler(ipcMain, 'watchlist:candidates', async () => {
  return Object.freeze({
    contract: 'WATCHLIST_CANDIDATES_V0_STUB',
    candidates: [],
    note: 'Stubbed — engine to be wired later'
  });
});
\`\`\`
**Fix:** Wire to engine/watchlist/runWatchlistScan.js OR show "Coming Soon" UI state  
**Estimate:** 20-30 lines (full wire) or 5 lines (stub with UI message)  

### Bug #5: signalsIpc.js Session-Pinned Snapshot (No TTL)
**File:** engine/signals/signalsIpc.js (or signals IPC handler)  
**Impact:** Equity signals stale after portfolio edits, user sees old data  
**Current Code:** pinnedSnapshot persists in module scope indefinitely  
**Fix:** Add 5-min TTL, clear on timeout  
**Estimate:** 5-10 lines  

### Bug #6: registerIpc.js Discovery Scan Called Twice on Rejection Tab
**File:** electron/ipc/registerIpc.js (discovery:run and discovery:evaluation:rejected handlers)  
**Impact:** Wasteful double execution, slow UX  
**Fix:** Cache scan result with TTL, serve both channels from same cached result  
**Estimate:** 15-20 lines (cache logic)  

### Bug #7: resolveInvestableSymbol.js Blocks .TO Symbols
**File:** engine/symbolUniverse/resolveInvestableSymbol.js  
**Impact:** XEQT.TO fails manual research in Discovery Lab  
**Current Code:** 5-char symbol limit applied before .TO pattern check  
**Fix:** Check .TO whitelist BEFORE enforcing char limit  
**Estimate:** 3-5 lines  

## P2 Issues (Quality/UX)

### Bug #8: Dashboard.jsx ASSET_BUCKET Hardcoding
**File:** renderer/pages/Dashboard.jsx  
**Impact:** New holdings show as 'Cash' until code updated  
**Fix:** Remove hardcoded map, use assetClass field or add sector to holdings  
**Estimate:** 5-10 lines  

### Bug #9: Dashboard.jsx GOAL_TARGET Duplication
**File:** renderer/pages/Dashboard.jsx  
**Impact:** Goal not driven by engine, inconsistent with Kelly IPC  
**Fix:** Read from kellyData.goal instead of hardcoded 1_000_000  
**Estimate:** 3-5 lines  

### Bug #10: Dashboard.jsx Goal Constants Duplication
**File:** renderer/pages/Dashboard.jsx  
**Impact:** Goal computation duplicated between UI and Kelly engine  
**Fix:** Remove goal computation, read from Kelly IPC response  
**Estimate:** 5 lines  

### Bug #11: DiscoveryLab.jsx useEffect Runs Every Mount (No Caching)
**File:** renderer/pages/DiscoveryLab.jsx  
**Impact:** Full scan executes every time user navigates back to tab, slow/wasteful  
**Fix:** Cache scan results in React state with timestamp, TTL-based invalidation  
**Estimate:** 10-15 lines  

### Bug #12: GoalChip Projection Floor at 0.05 (Masks Low-Conviction)
**File:** renderer/pages/DiscoveryLab.jsx (GoalChip component)  
**Impact:** Terrible candidates still project positive gains (0.05 CAGR floor)  
**Fix:** Change floor from 0.05 to 0  
**Estimate:** 1 line  

### Bug #13: ThemeCard Acceleration Excludes Rejected Symbols
**File:** renderer/pages/DiscoveryLab.jsx (ThemeCard component)  
**Impact:** Themes with many rejections appear weaker than they are  
**Fix:** Include rejected symbols in acceleration calculation  
**Estimate:** 5 lines  

## Summary Table

| Bug | File | LOC | Priority | Est. Effort |
|-----|------|-----|----------|-------------|
| 1 | portfolioValuation.js | 1 | P0 | 1h (+ regression test) |
| 2 | Signals.jsx | 15 | P0 | 2-3h (+ Kelly IPC change) |
| 3 | registerIpc.js | 1 | P1 | 15m |
| 4 | registerIpc.js | 20 | P1 | 1-2h (depends on design) |
| 5 | signalsIpc.js | 10 | P1 | 30m |
| 6 | registerIpc.js | 20 | P1 | 1h |
| 7 | resolveInvestableSymbol.js | 5 | P1 | 15m |
| 8 | Dashboard.jsx | 10 | P2 | 30m |
| 9 | Dashboard.jsx | 5 | P2 | 15m |
| 10 | Dashboard.jsx | 5 | P2 | 15m |
| 11 | DiscoveryLab.jsx | 15 | P2 | 45m |
| 12 | DiscoveryLab.jsx | 1 | P2 | 5m |
| 13 | DiscoveryLab.jsx | 5 | P2 | 15m |

**Total Effort Estimate:**
- P0/P1 fixes: ~8-10 hours
- P2 fixes: ~3 hours
- Testing & validation: ~4 hours
- **Total:** ~15-17 hours

## Beta Gate
**P0/P1 must be fixed before beta release.**
**P2 should be fixed, but can be deferred if needed for launch timeline.**

