import { C } from "../styles/colorScheme.js";
// renderer/pages/DaemonMonitor.jsx
// Background daemon monitor - see what JUPITER is doing while you sleep

import { useEffect, useState, useCallback } from 'react';

const mono = { fontFamily: 'IBM Plex Mono' };

const fmtTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
};

export default function DaemonMonitor() {
  const [status, setStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const result = await window.jupiter.invoke('daemon:status');
      if (result.ok) {
        setStatus(result);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const result = await window.jupiter.invoke('daemon:getAlerts', 20);
      if (result.ok) {
        setAlerts(result.alerts);
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e.message);
    }
  }, []);

  const startDaemon = useCallback(async () => {
    try {
      const result = await window.jupiter.invoke('daemon:start');
      if (result.ok) {
        setTimeout(() => {
          fetchStatus();
          fetchAlerts();
        }, 500);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [fetchStatus, fetchAlerts]);

  const stopDaemon = useCallback(async () => {
    try {
      const result = await window.jupiter.invoke('daemon:stop');
      if (result.ok) {
        setTimeout(() => fetchStatus(), 500);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchStatus();
    }, 30000); // Check status every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStatus, fetchAlerts]);

  if (loading) return <div style={{ padding: '2rem', color: C.textMuted, ...mono }}>Loading daemon status…</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, color: C.text }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ ...mono, fontSize: 24, fontWeight: 800, margin: 0 }}>Daemon Monitor</h1>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '6px 0 0' }}>
            Background conviction monitor — JUPITER working while you sleep
          </p>
        </div>
        <button
          onClick={fetchStatus}
          style={{ ...mono, fontSize: 11, color: C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: 10, padding: '16px', marginBottom: 24, color: C.red, ...mono }}>
          Error: {error}
        </div>
      )}

      {/* Daemon Status */}
      {status && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: '0.12em', marginBottom: 16 }}>
            DAEMON STATUS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Status', value: status.running ? '🟢 RUNNING' : '🔴 STOPPED', color: status.running ? C.green : C.red },
              { label: 'Last Update', value: fmtTime(status.lastUpdate), color: C.text },
              { label: 'Symbols Monitored', value: status.convictionCount, color: C.text },
              { label: 'Total Alerts', value: status.alertCount, color: status.alertCount > 0 ? C.gold : C.text },
            ].map(s => (
              <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ ...mono, fontSize: 14, fontWeight: 800, color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!status.running ? (
              <button
                onClick={startDaemon}
                style={{ ...mono, fontSize: 11, color: C.green, background: `${C.green}20`, border: `1px solid ${C.green}50`, borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}
              >
                ▶ Start Daemon
              </button>
            ) : (
              <button
                onClick={stopDaemon}
                style={{ ...mono, fontSize: 11, color: C.red, background: `${C.red}20`, border: `1px solid ${C.red}50`, borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}
              >
                ⏹ Stop Daemon
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px' }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: '0.12em', marginBottom: 16 }}>
          RECENT ALERTS ({alerts.length})
        </div>

        {alerts.length === 0 ? (
          <div style={{ ...mono, fontSize: 12, color: C.textMuted, padding: '20px' }}>
            No alerts yet. Daemon is monitoring for significant conviction shifts (±15%).
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', color: C.textMuted, fontWeight: 600 }}>TIME</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: C.textMuted, fontWeight: 600 }}>SYMBOL</th>
                  <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>TYPE</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: C.textMuted, fontWeight: 600 }}>MESSAGE</th>
                  <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>SEVERITY</th>
                </tr>
              </thead>
              <tbody>
                {alerts.reverse().map(alert => (
                  <tr key={alert.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 0', color: C.textMuted, fontSize: 10 }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '10px', color: C.cyan, fontWeight: 700 }}>{alert.symbol}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: C.textSec, fontSize: 10 }}>
                      {alert.type}
                    </td>
                    <td style={{ padding: '10px', color: C.text }}>{alert.message}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: alert.severity === 'HIGH' ? C.red : C.gold, fontWeight: 700 }}>
                      {alert.severity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 20, opacity: 0.55 }}>
        Background daemon monitors Kelly convictions every 60 minutes. Alerts generated when conviction shifts exceed ±15%.
        Start daemon to enable 24/7 monitoring. JUPITER works while you sleep.
      </p>
    </div>
  );
}
