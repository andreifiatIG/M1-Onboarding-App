#!/bin/bash

echo "🚀 Starting M1 Villa Management Development Environment..."
echo "=============================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap for cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend
echo "📦 Starting Backend Server (Port 4001)..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:4001/health > /dev/null; then
    echo "❌ Backend failed to start!"
    exit 1
fi

echo "✅ Backend is running on http://localhost:4001"

# Start frontend
echo "🎨 Starting Frontend Server..."
cd ../frontend && npm run dev:frontend &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 5

echo ""
echo "=============================================="
echo "✅ Development environment is ready!"
echo ""
echo "🔗 Frontend: http://localhost:3000 (or next available port)"
echo "🔗 Backend:  http://localhost:4001"
echo "🔗 Health:   http://localhost:4001/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=============================================="

# Keep script running
wait
