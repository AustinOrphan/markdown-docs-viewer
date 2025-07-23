#!/bin/bash

# Simple wrapper to run docs-status.js
cd "$(dirname "$0")/.."

# Run the script using node from the environment's PATH.
# The docs-status.js script has a shebang, so if it's made executable,
# it can be run directly. Alternatively, invoking with `node` is more robust.
exec node scripts/docs-status.js "$@"