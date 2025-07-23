#!/bin/bash

# Simple wrapper to run docs-status.js
cd "$(dirname "$0")/.."

# Try to find node
NODE_BIN=""
if command -v node &> /dev/null; then
    NODE_BIN=$(command -v node)
elif [ -f "/opt/homebrew/bin/node" ]; then
    NODE_BIN="/opt/homebrew/bin/node"
elif [ -f "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
else
    echo "Error: Node.js not found"
    exit 1
fi

# Run the script
exec "$NODE_BIN" scripts/docs-status.js "$@"