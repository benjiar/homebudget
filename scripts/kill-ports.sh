#!/bin/bash

# Kill processes on ports 3000 and 3001
echo "Killing processes on ports 3000 and 3001..."

lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 3000" || echo "  No process found on port 3000"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 3001" || echo "  No process found on port 3001"

echo "Done."

