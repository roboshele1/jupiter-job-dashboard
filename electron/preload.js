import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("prices", {
  getCryptoPrices: () => ipcRenderer.invoke("prices:getCryptoPrices"),
  getEquityPrices: () => ipcRenderer.invoke("prices:getEquityPrices"),
});

