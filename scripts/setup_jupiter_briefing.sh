#!/bin/bash
# ── Jupiter Discord Briefing — Setup Script ───────────────────────────────────
# Run this once from your Mac terminal to install everything

JUPITER_DIR="$HOME/JUPITER"
SCRIPT_NAME="jupiter_discord_briefing.js"
WEBHOOK="https://discord.com/api/webhooks/1428900241112825936/QlUngSlUeaDroAy47zDGw9STCqe4gTZSaFVBLl-UtkbqsBYNpXDFu6JJ3TJjys1wVjBQ"

echo "🪐 Jupiter Discord Briefing Setup"
echo "=================================="

# Step 1 — Copy script into Jupiter/scripts/
mkdir -p "$JUPITER_DIR/scripts"
cp "$(dirname "$0")/$SCRIPT_NAME" "$JUPITER_DIR/scripts/$SCRIPT_NAME"

# Inject webhook URL into the script
sed -i '' "s|YOUR_WEBHOOK_URL_HERE|$WEBHOOK|g" "$JUPITER_DIR/scripts/$SCRIPT_NAME"

echo "✅ Script installed at $JUPITER_DIR/scripts/$SCRIPT_NAME"

# Step 2 — Test it immediately
echo ""
echo "📡 Testing Discord connection..."
node "$JUPITER_DIR/scripts/$SCRIPT_NAME"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Test message sent — check your Discord now"
else
  echo ""
  echo "❌ Test failed — check the webhook URL"
  exit 1
fi

# Step 3 — Install cron job for 8am daily
echo ""
echo "⏰ Installing daily 8am cron job..."

# Get full path to node
NODE_PATH=$(which node)
SCRIPT_PATH="$JUPITER_DIR/scripts/$SCRIPT_NAME"
LOG_PATH="$JUPITER_DIR/engine/runtime/discord_briefing.log"

# Add to crontab (preserves existing entries)
(crontab -l 2>/dev/null | grep -v "jupiter_discord_briefing"; echo "0 8 * * * $NODE_PATH $SCRIPT_PATH >> $LOG_PATH 2>&1") | crontab -

echo "✅ Cron job installed: runs every day at 8:00 AM"
echo ""
echo "To verify cron is set:"
echo "  crontab -l"
echo ""
echo "To check logs:"
echo "  tail -f $LOG_PATH"
echo ""
echo "🎉 Setup complete. Jupiter will message you every morning at 8am."
