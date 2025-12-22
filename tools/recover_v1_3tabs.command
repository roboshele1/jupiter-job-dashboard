#!/bin/bash
set -e

echo "=== JUPITER V1 RECOVERY: 3 TABS + MARKET MONITOR LIVE ==="

cd ~/JUPITER

echo "Killing stray processes..."
pkill Electron || true
pkill node || true

echo "Ensuring permissions..."
chmod +x tools/recover_v1_3tabs.command

echo "Starting Vite (renderer)..."
cd renderer
nohup npm run dev > /tmp/jupiter_vite.log 2>&1 &

sleep 4

echo "Starting Electron..."
cd ..
npm run electron

