#!/bin/bash

# Health check script for deployed application

set -e

echo "🏥 Running health checks..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:8080}"

# Check backend health
echo -n "Checking backend... "
if curl -sf "$BACKEND_URL/api/v1/health" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    exit 1
fi

# Check frontend
echo -n "Checking frontend... "
if curl -sf "$FRONTEND_URL/health" > /dev/null || curl -sf "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    exit 1
fi

# Check MongoDB (if accessible)
if command -v docker &> /dev/null; then
    echo -n "Checking MongoDB... "
    if docker-compose exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}"
    fi
fi

echo -e "\n${GREEN}✅ All checks passed!${NC}"
