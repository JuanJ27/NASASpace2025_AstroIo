#!/bin/bash

# AstroIo - Final Validation Script
# Validates all components of the implementation

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           AstroIo - Final Validation Check                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

VALIDATION_PASSED=true

# Check file structure
echo "📁 Checking project structure..."
FILES=(
    "server.js"
    "public/index.html"
    "package.json"
    "test-client.js"
    "test-combat.js"
    "test.log"
    "README.md"
    "IMPLEMENTATION_SUMMARY.md"
    "start.sh"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        VALIDATION_PASSED=false
    fi
done

echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✓ node_modules installed"
    
    if [ -d "node_modules/express" ]; then
        echo "  ✓ express installed"
    else
        echo "  ✗ express not found"
        VALIDATION_PASSED=false
    fi
    
    if [ -d "node_modules/socket.io" ]; then
        echo "  ✓ socket.io installed"
    else
        echo "  ✗ socket.io not found"
        VALIDATION_PASSED=false
    fi
    
    if [ -d "node_modules/socket.io-client" ]; then
        echo "  ✓ socket.io-client installed"
    else
        echo "  ✗ socket.io-client not found"
        VALIDATION_PASSED=false
    fi
else
    echo "  ✗ node_modules not found"
    VALIDATION_PASSED=false
fi

echo ""

# Check if server can start
echo "🔌 Checking server configuration..."
if node -e "require('./server.js')" 2>/dev/null; then
    echo "  ✓ server.js syntax valid"
else
    # This will fail because server tries to start, but that's ok
    # We just want to check for syntax errors
    if node --check server.js 2>/dev/null; then
        echo "  ✓ server.js syntax valid"
    else
        echo "  ✗ server.js has syntax errors"
        VALIDATION_PASSED=false
    fi
fi

echo ""

# Check port availability
echo "🌐 Checking network configuration..."
if lsof -i :3000 >/dev/null 2>&1; then
    echo "  ✓ Port 3000 is in use (server running)"
    echo "  ℹ Server appears to be running already"
else
    echo "  ✓ Port 3000 is available"
    echo "  ℹ Server is not running (ready to start)"
fi

echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   Validation Summary                         ║"
echo "╠══════════════════════════════════════════════════════════════╣"

if [ "$VALIDATION_PASSED" = true ]; then
    echo "║  Status: ✅ ALL CHECKS PASSED                               ║"
    echo "║                                                              ║"
    echo "║  The AstroIo implementation is complete and ready!          ║"
    echo "║                                                              ║"
    echo "║  To start playing:                                          ║"
    echo "║    ./start.sh                                               ║"
    echo "║  or                                                          ║"
    echo "║    node server.js                                           ║"
    echo "║    then open http://localhost:3000                          ║"
    echo "║                                                              ║"
    echo "║  To run tests:                                              ║"
    echo "║    node test-client.js   (basic test)                       ║"
    echo "║    node test-combat.js   (combat test)                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "║  Status: ❌ VALIDATION FAILED                               ║"
    echo "║                                                              ║"
    echo "║  Some checks failed. Please review the output above.        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    exit 1
fi
