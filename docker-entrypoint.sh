#!/bin/sh
set -e

# Sync database schema automatically
# Using db push for speed in this environment
echo "🔄 Syncing database schema..."
npx prisma db push --accept-data-loss

# Execute the main command (node server.js)
echo "🚀 Launching Markify..."
exec "$@"
