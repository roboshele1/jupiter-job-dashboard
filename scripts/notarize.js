'use strict';
/**
 * Notarisation hook — only runs when CSC_LINK is set (code-signed builds).
 * For unsigned personal builds this file is never called.
 */
const { notarize } = require('@electron/notarize');
const path = require('path');

module.exports = async function afterSign(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== 'darwin') return;
  if (!process.env.CSC_LINK && !process.env.CSC_NAME) {
    console.log('[notarize] No signing identity — skipping.');
    return;
  }
  const appName     = packager.appInfo.productName;
  const appBundleId = packager.config.appId;
  const appPath     = path.join(appOutDir, `${appName}.app`);
  console.log(`[notarize] Notarising ${appBundleId}…`);
  await notarize({
    tool: 'notarytool',
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
  console.log('[notarize] ✓ Done.');
};
