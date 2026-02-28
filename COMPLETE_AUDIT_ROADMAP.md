# Jupiter Beta Readiness — Complete Audit & Roadmap

## Executive Summary
- **Tabs 1-4 (Dashboard, Portfolios, Signals, Discovery Lab):** 13 documented bugs (7 P0/P1 + 6 P2)
- **Tabs 5-12 (Growth Engine, Insights, Risk Centre, Market Monitor, Moonshot Lab, Goal Engine, Decisions, Jupiter AI):** Clean (only logging statements, not bugs)
- **Overall:** App is functionally complete but has 13 known issues blocking beta release

## All Issues (From Audit Report)

### CRITICAL (P0) — Data Corruption
1. **portfolioValuation.js line 31** — getCostBasis() override ignores h.totalCostBasis, corrupts P&L across all tabs
2. **Signals.jsx line 363-365** — CRYPTO_HOLDINGS hardcoded, stale BTC/ETH data after portfolio edits

### HIGH (P1) — Functional Breaks
3. **registerIpc.js loadHoldingsFull()** — ETF assetClass coerced to 'equity', breaks TSX ETF resolution
4. **registerIpc.js watchlist:candidates** — Permanently stubbed, Discovery monitoring tab always empty
5. **signalsIpc.js pinnedSnapshot** — No TTL, serves stale signals after portfolio changes
6. **registerIpc.js discovery scan** — Called twice on rejection tab (wasteful), should cache result
7. **resolveInvestableSymbol.js** — XEQT.TO blocked by 5-char limit, manual research fails for TSX ETFs

### MEDIUM (P2) — Quality Issues
8. **Dashboard.jsx ASSET_BUCKET** — Hardcoded sector map, new holdings show as 'Cash'
9. **Dashboard.jsx GOAL_TARGET** — Duplicated with Kelly IPC, not driven by engine
10. **Dashboard.jsx Goal constants** — Should read from kellyData.goal instead
11. **DiscoveryLab.jsx useEffect** — Full scan runs on every mount, no caching
12. **GoalChip projection floor** — Uses 0.05 CAGR floor instead of 0, masks low-conviction candidates
13. **ThemeCard acceleration** — Excludes rejected symbols from score, misrepresents theme strength

## Fix Priority Queue

### Phase 1: Data Integrity (P0) — 2 bugs
- [ ] Fix portfolioValuation.js cost basis override
- [ ] Fix Signals CRYPTO_HOLDINGS hardcoding

### Phase 2: Functional Breaks (P1) — 5 bugs
- [ ] Wire or stub watchlist:candidates properly
- [ ] Add TTL to signals pinnedSnapshot
- [ ] Cache discovery scan, dedup execution
- [ ] Fix ETF assetClass coercion in loadHoldingsFull
- [ ] Whitelist .TO in resolveInvestableSymbol

### Phase 3: Quality (P2) — 6 bugs
- [ ] Remove hardcoded sector/goal maps from Dashboard
- [ ] Cache Discovery Lab scan in React state
- [ ] Fix GoalChip CAGR projection floor
- [ ] Fix ThemeCard acceleration calculation

## Beta Gate
**MUST FIX before beta release:** All 7 P0/P1 bugs
**NICE TO FIX before beta release:** All 6 P2 bugs
**OK TO DEFER to post-beta:** None (all should be fixed for investor confidence)

## Tabs Status Summary
| Tab | LOC | Status | Issues |
|-----|-----|--------|--------|
| Dashboard | 306 | ⚠️ | 3 (hardcoding) |
| Portfolios | 602 | ⚠️ | 1 (cascade from P0) |
| Signals | 825 | ❌ | 4 (hardcoding + caching) |
| Discovery Lab | 955 | ❌ | 5 (caching + logic) |
| Growth Engine | 739 | ✅ | 0 |
| Insights | 783 | ✅ | 0 |
| Risk Centre | 340 | ✅ | 0 |
| Market Monitor | 367 | ✅ | 0 |
| Moonshot Lab | 1,169 | ✅ | 0 (to be removed) |
| Goal Engine | 613 | ✅ | 0 |
| Decisions | 247 | ✅ | 0 |
| Jupiter AI | 384 | ✅ | 0 |

**Total:** 12/12 tabs audited. 7 tabs clean. 5 tabs have 13 documented issues.

