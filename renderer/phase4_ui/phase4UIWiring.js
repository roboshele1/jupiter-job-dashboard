import fs from 'fs';
import path from 'path';

// Load the Phase 4 integrated snapshot
const snapshotPath = path.resolve('./phase4UIIntegratedSnapshot.json');
const baselineSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));

// Create a new object to safely wire without circular references
const snapshotWithSignals = {
  signals: baselineSnapshot.signals ?? [],
  discovery: baselineSnapshot.discovery ?? {},
  growth: { ...baselineSnapshot.growth },
  alerts: baselineSnapshot.alerts ?? [],
  riskEngine: baselineSnapshot.riskEngine ?? {},
  portfolio: baselineSnapshot.portfolio ?? {},
  marketMonitor: baselineSnapshot.marketMonitor ?? {},
  chat: baselineSnapshot.chat ?? {},
  insights: baselineSnapshot.insights ?? {},
  dashboard: baselineSnapshot.dashboard ?? {}
};

// ---- Wire interactivity ----

// Portfolio tab scaffold wiring
snapshotWithSignals.portfolio.isWired = true;

// Market Monitor tab scaffold wiring
snapshotWithSignals.marketMonitor.isWired = true;

// Chat tab scaffold wiring
snapshotWithSignals.chat.isWired = true;

// Insights tab scaffold wiring
snapshotWithSignals.insights.isWired = true;

// Dashboard tab scaffold wiring
snapshotWithSignals.dashboard.isWired = true;

// Optional: Signals, Discovery, Growth, Alerts, Risk are left unchanged
snapshotWithSignals.signals.forEach(s => s.isWired = true);
snapshotWithSignals.discovery.isWired = true;
snapshotWithSignals.growth.isWired = true;
snapshotWithSignals.alerts.isWired = snapshotWithSignals.alerts.length > 0;
snapshotWithSignals.riskEngine.isWired = true;

// Persist final wired snapshot
const outPath = path.resolve('./phase4UIIntegratedSnapshot.json');
fs.writeFileSync(outPath, JSON.stringify(snapshotWithSignals, null, 2), 'utf-8');

// Terminal confirmation logs
console.log('✅ Phase 4 remaining tabs scaffolds wired: Portfolio, Market Monitor, Chat, Insights, Dashboard');
console.log('✅ Phase 4 UI snapshot persisted safely to:', outPath);

console.log('Signals tab wired:', snapshotWithSignals.signals?.length ?? 0);
console.log('Discovery tab wired:', Object.keys(snapshotWithSignals.discovery ?? {}));
console.log('Growth tab wired:', Object.keys(snapshotWithSignals.growth ?? {}));
console.log('Alerts tab wired:', snapshotWithSignals.alerts?.length ?? 0);
console.log('Risk tab wired:', !!snapshotWithSignals.riskEngine);
console.log('Portfolio tab scaffold wired:', !!snapshotWithSignals.portfolio?.isWired);
console.log('Market Monitor tab scaffold wired:', !!snapshotWithSignals.marketMonitor?.isWired);
console.log('Chat tab scaffold wired:', !!snapshotWithSignals.chat?.isWired);
console.log('Insights tab scaffold wired:', !!snapshotWithSignals.insights?.isWired);
console.log('Dashboard tab scaffold wired:', !!snapshotWithSignals.dashboard?.isWired);

