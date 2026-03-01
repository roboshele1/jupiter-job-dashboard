import React from 'react';
import { useAlerts } from '../context/AlertContext';

const C = {
  critical: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#fca5a5', icon: '🚨' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#fcd34d', icon: '⚠️' },
  info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#93c5fd', icon: 'ℹ️' },
};

export default function AlertBanner() {
  const { alerts, dismissAlert } = useAlerts();
  const activeAlerts = alerts.filter(a => !a.dismissed).slice(0, 3);

  if (activeAlerts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: '#060910',
      borderBottom: '1px solid #1e2530',
      padding: '12px 24px',
    }}>
      {activeAlerts.map(alert => {
        const style = C[alert.severity] || C.info;
        return (
          <div
            key={alert.id}
            style={{
              padding: '12px 16px',
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: 6,
              marginBottom: activeAlerts.length > 1 ? 8 : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <span style={{ fontSize: 16 }}>{style.icon}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: style.text, marginBottom: 2 }}>
                  {alert.title}
                </p>
                <p style={{ fontSize: 11, color: style.text, opacity: 0.8 }}>
                  {alert.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{
                background: 'none',
                border: 'none',
                color: style.text,
                cursor: 'pointer',
                fontSize: 16,
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
