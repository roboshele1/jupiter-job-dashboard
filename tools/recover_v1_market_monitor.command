#!/bin/bash
set -e

echo "=== JUPITER V1 RECOVERY: MARKET MONITOR BASE ==="

cd ~/JUPITER

echo "Killing stray processes..."
pkill Electron || true
pkill node || true

echo "Starting Market Snapshot Server (3001)..."
nohup node engine/market/marketSnapshotServer.js > /tmp/jupiter_snapshot.log 2>&1 &

sleep 3

echo "Starting Vite (renderer)..."
cd renderer
rm -rf node_modules/.vite
nohup npm run dev > /tmp/jupiter_vite.log 2>&1 &

sleep 4

echo "Starting Electron..."
cd ..
npm run electron

