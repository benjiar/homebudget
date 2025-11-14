#!/bin/bash

# Get the root directory
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Start backend in background
echo "🚀 Starting backend..."
cd "$ROOT_DIR/apps/backend" && pnpm dev &
BACKEND_PID=$!

# Wait for backend to be ready (check port 3001)
echo "⏳ Waiting for backend to be ready on port 3001..."
while ! nc -z localhost 3001; do
  sleep 1
done

echo "✅ Backend is ready!"
echo ""

# Start frontend
echo "🚀 Starting frontend..."
cd "$ROOT_DIR/apps/web" && pnpm dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
