#!/bin/bash

# M1 Villa Management System - Server Startup Script
# This script starts both backend and frontend servers with proper configuration

echo "🚀 Starting M1 Villa Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}Killing processes on port $1...${NC}"
    lsof -ti:$1 | xargs -r kill -9 2>/dev/null
    sleep 1
}

# Kill any existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "tsx" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Check and clear ports
if check_port 4001; then
    echo -e "${YELLOW}Port 4001 is in use, clearing...${NC}"
    kill_port 4001
fi

if check_port 3001; then
    echo -e "${YELLOW}Port 3001 is in use, clearing...${NC}"
    kill_port 3001
fi

# Start Backend Server
echo -e "${GREEN}Starting Backend Server on port 4001...${NC}"
cd /home/taif_me/Development/M1-PostgreSQL-Standalone/backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Start backend in background
nohup npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:4001/health > /dev/null; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Start Frontend Server
echo -e "${GREEN}Starting Frontend Server on port 3001...${NC}"
cd /home/taif_me/Development/M1-PostgreSQL-Standalone/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
PORT=3001 nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ M1 Villa Management System is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📍 Backend:  http://localhost:4001"
echo "📍 Frontend: http://localhost:3001"
echo "📍 Health:   http://localhost:4001/health"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend/backend.log"
echo "   Frontend: tail -f frontend/frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   OR: pkill -f 'tsx|next'"
echo ""
echo -e "${YELLOW}⚠️  Important: If you see 'Failed to fetch' errors:${NC}"
echo "1. Check backend log: tail -f backend/backend.log"
echo "2. Verify health: curl http://localhost:4001/health"
echo "3. Check CORS: Backend should allow http://localhost:3001"
echo ""
