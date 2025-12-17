import React, { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  function pushAlert(alert) {
    setAlerts((prev) => [...prev, alert]);
  }

  return (
    <AlertContext.Provider value={{ alerts, pushAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertContext);
}

