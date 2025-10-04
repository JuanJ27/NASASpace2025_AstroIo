#!/bin/bash

# AstroIo - Quick Start Script
# This script starts the server and opens the game in your browser

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    AstroIo Game Server                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Starting server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server in background
node server.js &
SERVER_PID=$!

echo "Server started (PID: $SERVER_PID)"
echo ""
echo "Waiting for server to initialize..."
sleep 2

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     Server is Ready!                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Game URL: http://localhost:3000                          ║"
echo "║  Max Players: 5                                           ║"
echo "║  Controls: Move your mouse to play                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Try to open browser (works on most systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
elif command -v open > /dev/null; then
    open http://localhost:3000
elif command -v start > /dev/null; then
    start http://localhost:3000
fi

echo "Press Ctrl+C to stop the server"
echo ""

# Wait for server process
wait $SERVER_PID
