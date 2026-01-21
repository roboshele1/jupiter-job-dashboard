/**
 * Moonshot Registry IPC
 * --------------------------------------------------
 * Read-only exposure of persisted moonshot candidates
 *
 * HARD RULES:
 * - No mutation
 * - No clearing
 * - No filtering
 * - UI is a viewer only
 */

const { readRegistry } = require('./moonshotRegistry');

function registerMoonshotRegistryIpc(ipcMain) {
  ipcMain.handle('moonshot:registry:read', () => {
    return readRegistry();
  });
}

module.exports = { registerMoonshotRegistryIpc };
