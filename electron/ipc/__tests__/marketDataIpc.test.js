// electron/ipc/__tests__/marketDataIpc.test.js
// Pure Node IPC validation — no Electron runtime

import { registerMarketDataIpc } from "../marketDataIpc.js";

// --- MOCK IPC MAIN ---
const handlers = {};
const ipcMock = {
  handle: (channel, fn) => {
    handlers[channel] = fn;
  },
};

// --- TEST EXECUTION ---
(async () => {
  try {
    registerMarketDataIpc(ipcMock);

    if (!handlers["market:getSnapshot"]) {
      throw new Error("market:getSnapshot not registered");
    }

    const snapshot = await handlers["market:getSnapshot"]();

    console.log("IPC SNAPSHOT OK");
    console.log(JSON.stringify(snapshot, null, 2));
  } catch (e) {
    console.error("IPC SNAPSHOT FAIL", e);
  }
})();

