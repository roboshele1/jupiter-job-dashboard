#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  JUPITER — One-command macOS DMG builder                                   ║
# ║  Run this from your JUPITER project root:                                  ║
# ║    cd ~/Downloads/jupiter  &&  bash jupiter-build-dmg.sh                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -e  # exit immediately on any error
trap 'echo ""; echo "❌  Script failed at line $LINENO. See error above."; exit 1' ERR

# ── Colours for output ─────────────────────────────────────────────────────────
BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
step() { echo ""; echo -e "${CYAN}${BOLD}▸ $1${RESET}"; }
ok()   { echo -e "${GREEN}  ✓ $1${RESET}"; }
warn() { echo -e "${YELLOW}  ⚠  $1${RESET}"; }

# ── Verify we're in the JUPITER project root ───────────────────────────────────
step "Checking project root"
if [ ! -f "package.json" ]; then
  echo "❌  No package.json found. Run this script from your JUPITER project root."
  echo "    Example:  cd ~/path/to/jupiter  &&  bash jupiter-build-dmg.sh"
  exit 1
fi
if [ ! -d "electron" ] && [ ! -d "renderer" ]; then
  echo "❌  Can't find electron/ or renderer/ directories."
  echo "    Make sure you're in the JUPITER project root."
  exit 1
fi
ok "Project root confirmed: $(pwd)"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — Write all config files into the project
# ══════════════════════════════════════════════════════════════════════════════

step "Creating directory structure"
mkdir -p build-resources/icons
mkdir -p scripts
mkdir -p electron
ok "Directories ready"

# ─────────────────────────────────────────────────────────────────────────────
step "Writing electron-builder.yml"
cat > electron-builder.yml << 'EBEOF'
appId: com.jupiter.portfoliointelligence
productName: JUPITER
copyright: Copyright © 2025 JUPITER

directories:
  buildResources: build-resources
  output: dist-electron

files:
  - electron/**/*
  - renderer/dist/**/*
  - engine/**/*
  - main.js
  - preload.js
  - "!**/node_modules/.cache/**"
  - "!**/node_modules/.vite/**"
  - "!**/*.map"
  - "!**/test*/**"
  - "!**/spec*/**"
  - "!**/__tests__/**"
  - "!**/coverage/**"
  - "!renderer/src/**"
  - "!*.md"
  - "!*.log"
  - "!.env*"

mac:
  category: public.app-category.finance
  icon: build-resources/icons/icon.icns
  minimumSystemVersion: "12.0"
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build-resources/entitlements.mac.plist
  entitlementsInherit: build-resources/entitlements.mac.plist
  identity: null
  notarize: false
  target:
    - target: dmg
      arch:
        - arm64
        - x64

dmg:
  title: "JUPITER Installer"
  icon: build-resources/icons/icon.icns
  iconSize: 120
  window:
    width: 660
    height: 400
  contents:
    - x: 180
      y: 200
      type: file
    - x: 480
      y: 200
      type: link
      path: /Applications

asar: true
asarUnpack:
  - "engine/data/**"
  - "**/*.node"

publish: null
EBEOF
ok "electron-builder.yml written"

# ─────────────────────────────────────────────────────────────────────────────
step "Writing build-resources/entitlements.mac.plist"
cat > build-resources/entitlements.mac.plist << 'PLISTEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
  </dict>
</plist>
PLISTEOF
ok "entitlements.mac.plist written"

# ─────────────────────────────────────────────────────────────────────────────
step "Writing electron/pathResolver.js"
cat > electron/pathResolver.js << 'PREOF'
'use strict';
/**
 * pathResolver.js — resolves engine/data paths in both dev and packaged app.
 * In production, user data lives in ~/Library/Application Support/JUPITER/
 * so holdings survive app reinstalls.
 */
const path = require('path');
const fs   = require('fs');

let _app;
try { _app = require('electron').app; } catch (_) {}

function isPackaged() {
  try { return _app && _app.isPackaged; } catch (_) { return false; }
}

function getEngineDataDir() {
  if (isPackaged()) {
    return path.join(_app.getPath('userData'), 'engine-data');
  }
  // Dev: <project-root>/engine/data
  return path.join(__dirname, '..', 'engine', 'data');
}

function getBundledDataDir() {
  if (isPackaged()) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'engine', 'data');
  }
  return path.join(__dirname, '..', 'engine', 'data');
}

function initDataDir() {
  const dest = getEngineDataDir();
  fs.mkdirSync(dest, { recursive: true });
  fs.mkdirSync(path.join(dest, 'users'), { recursive: true });

  const src = getBundledDataDir();
  if (!fs.existsSync(src)) return;

  // Seed userConfig.json on first launch
  const srcConfig  = path.join(src, 'userConfig.json');
  const destConfig = path.join(dest, 'userConfig.json');
  if (fs.existsSync(srcConfig) && !fs.existsSync(destConfig)) {
    fs.copyFileSync(srcConfig, destConfig);
    console.log('[pathResolver] Seeded userConfig.json');
  }

  // Seed per-user holdings on first launch
  const srcUsers = path.join(src, 'users');
  if (fs.existsSync(srcUsers)) {
    for (const uid of fs.readdirSync(srcUsers)) {
      const srcDir  = path.join(srcUsers, uid);
      const destDir = path.join(dest, 'users', uid);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        for (const f of fs.readdirSync(srcDir)) {
          const df = path.join(destDir, f);
          if (!fs.existsSync(df)) fs.copyFileSync(path.join(srcDir, f), df);
        }
        console.log(`[pathResolver] Seeded holdings for user: ${uid}`);
      }
    }
  }
}

function getHoldingsFilePath(userId) {
  const dir = path.join(getEngineDataDir(), 'users', userId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'holdings.json');
}

function getUserConfigPath() {
  return path.join(getEngineDataDir(), 'userConfig.json');
}

function resolveDataPath(...segments) {
  return path.join(getEngineDataDir(), ...segments);
}

const isDev = !isPackaged();

module.exports = {
  isDev,
  getEngineDataDir,
  initDataDir,
  getHoldingsFilePath,
  getUserConfigPath,
  resolveDataPath,
};
PREOF
ok "electron/pathResolver.js written"

# ─────────────────────────────────────────────────────────────────────────────
step "Writing scripts/gen-icons.js"
cat > scripts/gen-icons.js << 'GIEOF'
#!/usr/bin/env node
/**
 * Generates build-resources/icons/icon.icns from icon-source.png
 * Requires macOS (uses sips + iconutil, both built-in).
 */
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const SRC_PNG    = path.join(ROOT, 'build-resources', 'icons', 'icon-source.png');
const ICONSET    = path.join(ROOT, 'build-resources', 'icons', 'icon.iconset');
const OUTPUT     = path.join(ROOT, 'build-resources', 'icons', 'icon.icns');

if (!fs.existsSync(SRC_PNG)) {
  console.error(`
  ✗ Missing: build-resources/icons/icon-source.png

  Create a 1024×1024 PNG and save it there, then re-run: npm run gen-icons

  Quick option: use any square PNG — the script just needs something to convert.
  `);
  process.exit(1);
}

fs.mkdirSync(ICONSET, { recursive: true });

const sizes = [16, 32, 64, 128, 256, 512, 1024];
for (const s of sizes) {
  const out = path.join(ICONSET, `icon_${s}x${s}.png`);
  execSync(`sips -z ${s} ${s} "${SRC_PNG}" --out "${out}" --setProperty format png 2>/dev/null`);
  if (s <= 512) {
    const s2 = s * 2;
    const out2 = path.join(ICONSET, `icon_${s}x${s}@2x.png`);
    execSync(`sips -z ${s2} ${s2} "${SRC_PNG}" --out "${out2}" --setProperty format png 2>/dev/null`);
  }
}
execSync(`iconutil -c icns "${ICONSET}" -o "${OUTPUT}"`);
fs.rmSync(ICONSET, { recursive: true, force: true });
console.log('✓ icon.icns generated at', OUTPUT);
GIEOF
ok "scripts/gen-icons.js written"

# ─────────────────────────────────────────────────────────────────────────────
step "Writing scripts/notarize.js"
cat > scripts/notarize.js << 'NOTEOF'
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
NOTEOF
ok "scripts/notarize.js written"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — Patch existing project files
# ══════════════════════════════════════════════════════════════════════════════

step "Patching package.json"

# Use Node.js to safely merge fields into existing package.json
node << 'NODEEOF'
const fs   = require('fs');
const path = require('path');
const pkg  = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Scripts
pkg.scripts = pkg.scripts || {};
pkg.scripts.build         = pkg.scripts.build         || 'vite build';
pkg.scripts['gen-icons']  = 'node scripts/gen-icons.js';
pkg.scripts.pack          = 'electron-builder --dir';
pkg.scripts.dist          = 'npm run build && electron-builder';
pkg.scripts['dist:arm64'] = 'npm run build && electron-builder --arm64';
pkg.scripts['dist:x64']   = 'npm run build && electron-builder --x64';

// Required metadata
if (!pkg.author) pkg.author = { name: 'JUPITER', email: 'hello@jupiter.app' };
if (!pkg.description) pkg.description = 'JUPITER — Portfolio Intelligence';

// Must NOT be "module" — engine is CommonJS
if (pkg.type === 'module') {
  console.warn('[patch] Removed "type":"module" from package.json — engine is CommonJS.');
  delete pkg.type;
}

// devDependencies
pkg.devDependencies = pkg.devDependencies || {};
if (!pkg.devDependencies['electron-builder'])  pkg.devDependencies['electron-builder']  = '^25.1.8';
if (!pkg.devDependencies['@electron/notarize']) pkg.devDependencies['@electron/notarize'] = '^2.5.0';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json patched successfully');
NODEEOF
ok "package.json patched"

# ─────────────────────────────────────────────────────────────────────────────
step "Patching vite.config.js — adding base: './' for production"

# Detect the actual vite config filename
VITE_CONFIG=""
for f in vite.config.js vite.config.ts vite.config.mjs; do
  if [ -f "$f" ]; then VITE_CONFIG="$f"; break; fi
done

if [ -z "$VITE_CONFIG" ]; then
  warn "No vite.config.js found — writing a fresh one"
  cat > vite.config.js << 'VCEOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? './' : '/',
  build: {
    outDir: 'renderer/dist',
    emptyOutDir: true,
    assetsInlineLimit: 4096,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './renderer/src') },
  },
  server: { port: 5173, strictPort: true },
}));
VCEOF
  ok "Fresh vite.config.js written"
else
  # Check if base is already set
  if grep -q "base:" "$VITE_CONFIG"; then
    warn "$VITE_CONFIG already has a 'base:' setting — skipping (verify it's set to './' for prod builds)"
  else
    # Inject base after the first defineConfig( or export default {
    node << VITEEOF
const fs = require('fs');
const content = fs.readFileSync('$VITE_CONFIG', 'utf8');

// If it uses defineConfig with a function (most common), inject after the arrow
let patched = content;
// Try to inject base right after the opening of the config object
const patterns = [
  // defineConfig(({ command }) => ({
  [/defineConfig\s*\(\s*\(\s*\{[^}]*\}\s*\)\s*=>\s*\(\s*\{/, (m) => m + "\n  base: process.env.NODE_ENV === 'production' ? './' : '/',"],
  // defineConfig({
  [/defineConfig\s*\(\s*\{/, (m) => m + "\n  base: './',"],
];

let applied = false;
for (const [re, replacer] of patterns) {
  if (re.test(patched)) {
    patched = patched.replace(re, replacer);
    applied = true;
    break;
  }
}

if (applied) {
  // Also ensure outDir is renderer/dist
  if (!patched.includes('outDir')) {
    patched = patched.replace(
      /build\s*:\s*\{/,
      "build: {\n      outDir: 'renderer/dist',"
    );
  }
  fs.writeFileSync('$VITE_CONFIG', patched);
  console.log('vite.config patched: base:./ added');
} else {
  console.log('WARN: Could not auto-patch vite.config — please manually add: base: "./"');
}
VITEEOF
    ok "$VITE_CONFIG patched"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
step "Patching main.js — adding pathResolver + isDev load logic"

# Detect main entry point
MAIN_JS=""
for f in main.js electron/main.js src/main.js; do
  if [ -f "$f" ]; then MAIN_JS="$f"; break; fi
done

if [ -z "$MAIN_JS" ]; then
  warn "Could not find main.js — you'll need to manually add pathResolver (see BUILD_GUIDE.md)"
else
  node << MAINEOF
const fs = require('fs');
const content = fs.readFileSync('$MAIN_JS', 'utf8');

// Only patch if not already patched
if (content.includes('pathResolver')) {
  console.log('main.js already has pathResolver — skipping');
  process.exit(0);
}

// Figure out the relative path from main.js to electron/pathResolver.js
const mainPath = '$MAIN_JS';
const relPath = mainPath.includes('electron/') ? './pathResolver' : './electron/pathResolver';

const patch = \`
// ── JUPITER DMG patch: path resolver for packaged app ──────────────────────
const { initDataDir, isDev } = require('\${relPath}');
initDataDir(); // seeds engine/data to ~/Library/Application Support/JUPITER/ on first run
// ───────────────────────────────────────────────────────────────────────────
\`;

// Insert after the last require/const at the top
const lines = content.split('\\n');
let insertAt = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^('use strict'|const |var |let |require\()/)) insertAt = i + 1;
  if (lines[i].includes('app.whenReady') || lines[i].includes('app.on(')) break;
}

lines.splice(insertAt, 0, patch);

// Fix loadURL/loadFile if using hardcoded path
let patched = lines.join('\\n');

// Replace hardcoded loadFile paths with isDev conditional
if (patched.includes('loadFile') && !patched.includes('isDev')) {
  patched = patched.replace(
    /win\.loadFile\([^)]+\)/g,
    \`isDev
      ? win.loadURL('http://localhost:5173')
      : win.loadFile(require('path').join(__dirname, 'renderer', 'dist', 'index.html'))\`
  );
}

fs.writeFileSync('$MAIN_JS', patched);
console.log('main.js patched: pathResolver added');
MAINEOF
  ok "$MAIN_JS patched"
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 3 — Install dependencies
# ══════════════════════════════════════════════════════════════════════════════

step "Installing electron-builder and @electron/notarize"
npm install --save-dev electron-builder @electron/notarize
ok "Dependencies installed"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 4 — Generate app icon
# ══════════════════════════════════════════════════════════════════════════════

step "Generating app icon"

if [ -f "build-resources/icons/icon.icns" ]; then
  ok "icon.icns already exists — skipping generation"
elif [ -f "build-resources/icons/icon-source.png" ]; then
  npm run gen-icons
  ok "icon.icns generated"
else
  warn "No icon-source.png found — generating a placeholder JUPITER icon"

  # Generate a minimal valid placeholder PNG using Python (available on macOS)
  python3 << 'PYEOF'
import struct, zlib

def make_png(size, r, g, b):
    """Create a minimal solid-colour PNG."""
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    IHDR = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))

    raw = b''
    row = b'\x00' + bytes([r, g, b] * size)
    compressed = zlib.compress(row * size)
    IDAT = chunk(b'IDAT', compressed)
    IEND = chunk(b'IEND', b'')

    return b'\x89PNG\r\n\x1a\n' + IHDR + IDAT + IEND

png = make_png(1024, 6, 9, 16)   # #060910 — JUPITER dark background
with open('build-resources/icons/icon-source.png', 'wb') as f:
    f.write(png)
print('Placeholder icon-source.png created (1024×1024, #060910)')
PYEOF

  npm run gen-icons
  ok "Placeholder icon.icns generated (replace build-resources/icons/icon-source.png with your real icon later)"
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 5 — Build renderer
# ══════════════════════════════════════════════════════════════════════════════

step "Building renderer (Vite)"
npm run build
ok "Renderer built → renderer/dist/"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 6 — Test unpacked app first
# ══════════════════════════════════════════════════════════════════════════════

step "Building unpacked .app (fast test — no DMG yet)"
npx electron-builder --dir 2>&1 | grep -v "^  •" || true

# Find the built .app
APP_PATH=$(find dist-electron -name "JUPITER.app" -maxdepth 3 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
  warn "Could not locate JUPITER.app in dist-electron/ — check output above for errors"
else
  ok "Unpacked app built: $APP_PATH"
  echo ""
  echo -e "${YELLOW}  → Testing unpacked app now. Check it looks right, then close it.${RESET}"
  echo -e "${YELLOW}    If it doesn't open, run:  open \"$APP_PATH\"${RESET}"
  open "$APP_PATH" 2>/dev/null || warn "Could not auto-open app — open it manually from $APP_PATH"
  echo ""
  echo -e "${YELLOW}  Press Enter when you're ready to build the full DMG...${RESET}"
  read -r
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 7 — Build the real DMG
# ══════════════════════════════════════════════════════════════════════════════

step "Building DMG (this takes 1–3 minutes)"
npx electron-builder 2>&1 | grep -E "^  •|error|Error|warning" || true

# ── Find the DMG ──────────────────────────────────────────────────────────────
DMG_PATH=$(find dist-electron -name "*.dmg" -maxdepth 2 2>/dev/null | head -1)

echo ""
echo "════════════════════════════════════════════════════════════════════════"
if [ -n "$DMG_PATH" ]; then
  DMG_SIZE=$(du -sh "$DMG_PATH" 2>/dev/null | cut -f1)
  echo -e "${GREEN}${BOLD}  ✓ JUPITER.dmg built successfully!${RESET}"
  echo ""
  echo -e "  📦 File:  $DMG_PATH"
  echo -e "  📏 Size:  $DMG_SIZE"
  echo ""
  echo "  To install:"
  echo "    1. Double-click the .dmg file"
  echo "    2. Drag JUPITER → Applications"
  echo "    3. Eject the DMG"
  echo ""
  echo "  If macOS says 'App is damaged':"
  echo "    xattr -cr /Applications/JUPITER.app"
  echo ""
  echo "  Opening DMG folder now..."
  open "$(dirname "$DMG_PATH")"
else
  echo -e "${YELLOW}${BOLD}  ⚠  DMG not found in dist-electron/ — check build output above${RESET}"
  echo ""
  echo "  Common fixes:"
  echo "    • 'renderer/dist not found'  → your vite build output path may differ (check vite.config)"
  echo "    • 'cannot find module'       → check electron/pathResolver.js was written correctly"
  echo "    • 'No identity found'        → this is just a warning, DMG should still build"
  echo ""
  echo "  Run manually to see full output:  npx electron-builder"
fi
echo "════════════════════════════════════════════════════════════════════════"
