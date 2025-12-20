import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("JUPITER", {
  version: "2.0",
  mode: "V2_LEARNING_READY"
});

