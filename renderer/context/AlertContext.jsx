/**
 * AlertContext — Persistent in-app alert system
 */

import React, { createContext, useState, useCallback } from 'react';

export const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((alert) => {
    const id = Date.now();
    const newAlert = {
      id,
      timestamp: new Date(),
      severity: alert.severity || 'info',
      title: alert.title,
      message: alert.message,
      dismissed: false,
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    
    if (newAlert.severity === 'info') {
      setTimeout(() => dismissAlert(id), 8000);
    }

    return id;
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, addAlert, dismissAlert, clearAllAlerts }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = React.useContext(AlertContext);
  if (!context) throw new Error('useAlerts must be used within AlertProvider');
  return context;
}
