import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import NavigationShell from "./layout/NavigationShell";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <NavigationShell>
      <App />
    </NavigationShell>
  </React.StrictMode>
);

