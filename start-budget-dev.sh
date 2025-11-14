#!/bin/bash

# Budget Feature - Start Development Servers

echo "🚀 Starting HomeBudget Development Servers..."
echo ""

# Check if migrations have been run
echo "📋 Step 1: Checking database migrations..."
cd apps/backend
if npm run typeorm migration:show 2>&1 | grep -q "CreateBudgetsTable"; then
    echo "✓ Budget migrations found"
else
    echo "⚠️  Budget migration not found. Running migrations..."
    npm run typeorm migration:run
fi

echo ""
echo "📋 Step 2: Starting backend server..."
echo "   Backend will run on http://localhost:3001"
cd /Users/benjamin.arbibe/git/perso/homebudget/apps/backend
npm run start:dev &
BACKEND_PID=$!

echo ""
echo "📋 Step 3: Waiting for backend to start..."
sleep 5

echo ""
echo "📋 Step 4: Starting web server..."
echo "   Web app will run on http://localhost:3000"
cd /Users/benjamin.arbibe/git/perso/homebudget/apps/web
npm run dev &
WEB_PID=$!

echo ""
echo "✅ Development servers started!"
echo ""
echo "📍 Access the budget feature at: http://localhost:3000/budgets"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Web PID: $WEB_PID"
echo ""
echo "To stop servers: kill $BACKEND_PID $WEB_PID"
echo "Or press Ctrl+C and run: killall node"
echo ""

# Wait for both processes
wait
