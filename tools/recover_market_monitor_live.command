#!/bin/bash
set -e

echo "=== JUPITER V1 RECOVERY: MARKET MONITOR LIVE (5173) ==="

cd ~/JUPITER

echo "Killing stray processes..."
pkill Electron || true
pkill node || true

sleep 2

echo "Starting Vite renderer on 5173..."
cd renderer
nohup npm run dev > /tmp/jupiter_vite.log 2>&1 &

sleep 5

echo "Starting Electron..."
cd ..
npm run electron

