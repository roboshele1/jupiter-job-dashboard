#!/usr/bin/env python3
"""
JUPITER BETA HARDENING — macOS-safe fix script
Run from: ~/JUPITER
Usage:    python3 jupiter_fix_macos.py
"""

import os, re, sys, subprocess

JUPITER = os.path.expanduser("~/JUPITER")
PAGES   = os.path.join(JUPITER, "renderer/pages")
IPC     = os.path.join(JUPITER, "electron/ipc")

def patch(path, fn, label):
    if not os.path.exists(path):
        print(f"  ⚠  NOT FOUND: {path}")
        return
    with open(path) as f:
        src = f.read()
    new_src, changes = fn(src)
    if changes:
        with open(path, "w") as f:
            f.write(new_src)
        for c in changes:
            print(f"  ✓  {c}")
    else:
        print(f"  –  {label}: nothing to patch (already clean)")

print()
print("╔══════════════════════════════════════════════════════╗")
print("║  JUPITER BETA HARDENING — macOS Python Fix           ║")
print("╚══════════════════════════════════════════════════════╝")
print()

# 1. Dashboard
print("▸ [1] Dashboard — throttle refresh interval...")
def fix_dashboard(src):
    changes = []
    for old, new in [
        ("setInterval(() => poll(), 15_000)", "setInterval(() => poll(), 60_000 + Math.random() * 5000) // rate-limited"),
        ("setInterval(() => poll(), 15000)",  "setInterval(() => poll(), 60_000 + Math.random() * 5000) // rate-limited"),
        ("setInterval(poll, 15_000)",         "setInterval(poll, 60_000 + Math.random() * 5000) // rate-limited"),
        ("setInterval(poll, 15000)",          "setInterval(poll, 60_000 + Math.random() * 5000) // rate-limited"),
    ]:
        if old in src:
            src = src.replace(old, new)
            changes.append(f"Dashboard: 15s -> 60s+jitter")
    old = "window.jupiter.refreshPortfolioValuation()"
    new = "window.jupiter.invoke('portfolio:refreshValuation')"
    if old in src:
        src = src.replace(old, new)
        changes.append("Dashboard: refreshPortfolioValuation -> invoke")
    return src, changes
patch(os.path.join(PAGES, "Dashboard.jsx"), fix_dashboard, "Dashboard")

# 2. Signals
print("▸ [2] Signals — fix CSS gap + refreshPortfolioValuation...")
def fix_signals(src):
    changes = []
    for old, new in [
        ('gap: "08px 20px"', 'gap: "8px 20px"'),
        ('gap: "08px 24px"', 'gap: "8px 24px"'),
    ]:
        if old in src:
            src = src.replace(old, new)
            changes.append(f"Signals: CSS gap fixed: {old}")
    old = "await window.jupiter.refreshPortfolioValuation();"
    new = 'await window.jupiter.invoke("portfolio:refreshValuation"); // fixed: was non-invoke call'
    if old in src:
        src = src.replace(old, new)
        changes.append("Signals: refreshPortfolioValuation -> invoke")
    return src, changes
patch(os.path.join(PAGES, "Signals.jsx"), fix_signals, "Signals")

# 3. Decisions
print("▸ [3] Decisions — null guards + root background/font...")
def fix_decisions(src):
    changes = []
    old = "<div style={{ padding: 32, overflowY: 'auto' }}>"
    new = "<div style={{ padding: 32, overflowY: 'auto', background: '#060910', minHeight: '100vh', fontFamily: \"'IBM Plex Mono', monospace\", color: '#e2e8f0' }}>"
    if old in src:
        src = src.replace(old, new, 1)
        changes.append("Decisions: root bg + font")
    replacements = [
        ("`$${decisions.portfolioValue.toLocaleString()}`",
         "`$${(decisions.portfolioValue ?? 0).toLocaleString()}`"),
        ("`$${decisions.totalBookCost.toLocaleString()}`",
         "`$${(decisions.totalBookCost ?? 0).toLocaleString()}`"),
        ("${decisions.totalReturnPct.toFixed(1)}",
         "${(decisions.totalReturnPct ?? 0).toFixed(1)}"),
        ("decisions.goal.remaining.toLocaleString()",
         "(decisions.goal?.remaining ?? 0).toLocaleString()"),
        ("{decisions.goal.requiredCAGR}%",
         "{decisions.goal?.requiredCAGR ?? '—'}%"),
        ("`${Math.min(decisions.goal.progressPct, 100)}%`",
         "`${Math.min(decisions.goal?.progressPct ?? 0, 100)}%`"),
        ("{decisions.goal.progressPct}%",
         "{(decisions.goal?.progressPct ?? 0).toFixed(1)}%"),
        ("decisions.heatCheck.totalHeat.toFixed(1)",
         "(decisions.heatCheck?.totalHeat ?? 0).toFixed(1)"),
        ("decisions.heatCheck.maxAllowedHeat",
         "(decisions.heatCheck?.maxAllowedHeat ?? 0)"),
        ("{decisions.heatCheck.isOverheated && (",
         "{decisions.heatCheck?.isOverheated && ("),
        ("decisions.cashManagement.optimalCashPct.toFixed(1)",
         "(decisions.cashManagement?.optimalCashPct ?? 0).toFixed(1)"),
        ("decisions.cashManagement.optimalCashReserve.toLocaleString()",
         "(decisions.cashManagement?.optimalCashReserve ?? 0).toLocaleString()"),
        ("heatColor(decisions.heatCheck.status)",
         "heatColor(decisions.heatCheck?.status)"),
    ]
    for old, new in replacements:
        if old in src:
            src = src.replace(old, new)
            changes.append(f"Decisions: null guard: {old[:55]}")
    return src, changes
patch(os.path.join(PAGES, "Decisions.jsx"), fix_decisions, "Decisions")

# 4. GrowthEngine
print("▸ [4] GrowthEngine — fix a.ticker + dead import...")
def fix_growth(src):
    changes = []
    for imp in [
        'import { CAGR, getCAGR } from "../constants/cagrAssumptions.js";',
        "import { CAGR, getCAGR } from '../constants/cagrAssumptions.js';",
    ]:
        if imp in src:
            src = src.replace(imp, "// cagrAssumptions import removed — projections computed inline")
            changes.append("GrowthEngine: removed dead cagrAssumptions import")
    count_before = src.count("a.ticker")
    src = src.replace("a.ticker", "a.symbol")
    fixed = count_before - src.count("a.ticker")
    if fixed:
        changes.append(f"GrowthEngine: a.ticker -> a.symbol ({fixed} occurrences)")
    return src, changes
patch(os.path.join(PAGES, "GrowthEngine.jsx"), fix_growth, "GrowthEngine")

# 5. MarketMonitor
print("▸ [5] MarketMonitor — throttle polling + fix regime prop...")
def fix_marketmonitor(src):
    changes = []
    for old, new in [
        ("setInterval(poll, 10_000)", "setInterval(poll, 30_000) // rate-limited: was 10s"),
        ("setInterval(poll, 10000)",  "setInterval(poll, 30000)  // rate-limited: was 10s"),
    ]:
        if old in src:
            src = src.replace(old, new)
            changes.append(f"MarketMonitor: polling -> 30s")
    old = "regime={regimeData?.regime}"
    new = "regime={typeof regimeData === 'string' ? regimeData : regimeData?.regime ?? regimeData}"
    if old in src:
        src = src.replace(old, new, 1)
        changes.append("MarketMonitor: fixed regime double-nesting in RegimeBanner prop")
    return src, changes
patch(os.path.join(PAGES, "MarketMonitor.jsx"), fix_marketmonitor, "MarketMonitor")

# 6. Insights
print("▸ [6] Insights — fix handleUndo 'amount' undefined...")
def fix_insights(src):
    changes = []
    old = (
        "  const handleUndo = useCallback(async (symbol) => {\n"
        "    const updated = executions.filter(e => e.symbol !== symbol);\n"
        "    setExecutions(updated);\n"
        "    await saveExecutions(updated);\n"
        "    // Log to LCPE feedback loop for 30/60/90 day outcome scoring\n"
        "    const pos = positions.find(p => p.symbol === symbol);\n"
        "    const lcpeEntry = lcpe?.ranked?.find(r => r.symbol === symbol);\n"
        "    window.jupiter.invoke(\"lcpe:recordExecution\", {\n"
        "      symbol,\n"
        "      amount,"
    )
    new = (
        "  const handleUndo = useCallback(async (symbol) => {\n"
        "    const updated = executions.filter(e => e.symbol !== symbol);\n"
        "    setExecutions(updated);\n"
        "    await saveExecutions(updated);\n"
        "    // Log undo to LCPE feedback loop — fix: look up amount from executions (was undefined)\n"
        "    const undoneExec = executions.find(e => e.symbol === symbol);\n"
        "    const undoAmount = undoneExec?.amount ?? 0;\n"
        "    const pos = positions.find(p => p.symbol === symbol);\n"
        "    const lcpeEntry = lcpe?.ranked?.find(r => r.symbol === symbol);\n"
        "    window.jupiter.invoke(\"lcpe:recordExecution\", {\n"
        "      symbol,\n"
        "      amount: undoAmount,"
    )
    if old in src:
        src = src.replace(old, new, 1)
        changes.append("Insights: handleUndo amount undefined fixed")
    return src, changes
patch(os.path.join(PAGES, "Insights.jsx"), fix_insights, "Insights")

# 7. marketRegimeIpc
print("▸ [7] marketRegimeIpc — flag hardcoded VIX/breadth...")
def fix_regime_ipc(src):
    changes = []
    banner = (
        "// WARNING: HARDCODED INPUTS — BETA KNOWN ISSUE\n"
        "// vixLevel and breadthPctAbove50DMA are static placeholder values.\n"
        "// TODO before v1.0: wire to live data:\n"
        "//   vixLevel:             Polygon options API or FRED (^VIX)\n"
        "//   breadthPctAbove50DMA: Polygon snapshot across SPY constituents\n"
        "// ---------------------------------------------------------------\n"
    )
    if "HARDCODED INPUTS" not in src:
        src = banner + src
        changes.append("marketRegimeIpc: hardcoded inputs warning added")
    return src, changes

regime_path = os.path.join(IPC, "marketRegimeIpc.js")
if not os.path.exists(regime_path):
    for root, dirs, files in os.walk(IPC):
        for fn in files:
            if "regime" in fn.lower() and fn.endswith(".js") and "bak" not in fn:
                regime_path = os.path.join(root, fn)
                print(f"  Found at: {regime_path}")
                break
patch(regime_path, fix_regime_ipc, "marketRegimeIpc")

# 8. Commit
print()
print("▸ Committing...")
os.chdir(JUPITER)
subprocess.run(["git", "add", "-A"])
result = subprocess.run(
    ["git", "commit", "-m", "BETA_HARDENING: null guards, rate limits, ticker bug, regime nesting, CSS fixes"],
    capture_output=True, text=True
)
print(" ", (result.stdout + result.stderr).strip())

print()
print("╔══════════════════════════════════════════════════════╗")
print("║  DONE. Run verification command to confirm.          ║")
print("╚══════════════════════════════════════════════════════╝")
print()
print("Manual fixes still needed:")
print("  Signals:        wire BTC/ETH qty from holdings:getRaw (hardcoded 0.281212/0.25)")
print("  marketRegimeIpc: wire VIX + breadth to live Polygon/FRED data")
print("  JupiterAI:      move API key call to main process for security")
print()
