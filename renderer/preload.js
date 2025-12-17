const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("env", {
  POLYGON_API_KEY: process.env.VITE_POLYGON_API_KEY || ""
});

