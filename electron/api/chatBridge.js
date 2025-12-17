// electron/api/chatBridge.js
// Jupiter AI (Chat) IPC Bridge — final tab, mirrors all prior contract patterns

const { ipcMain } = require("electron");
const chatEngine = require("../../engine/chatEngine");

function registerChatIPC() {
  ipcMain.handle("chat:getSnapshot", async () => {
    try {
      return chatEngine.getChatSnapshot();
    } catch (err) {
      return {
        status: "error",
        ts: new Date().toISOString(),
        error: err.message,
      };
    }
  });
}

module.exports = {
  registerChatIPC,
};

