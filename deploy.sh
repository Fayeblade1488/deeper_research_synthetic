#!/bin/bash

# Deployment script for Deeper Research Synthetic
# This script handles production deployment

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file from .env.production template"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Check for required environment variables
echo -e "${YELLOW}🔍 Checking environment configuration...${NC}"
source .env

if [ -z "$VENICE_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ Error: No AI API key configured${NC}"
    echo "Please set either VENICE_API_KEY or GEMINI_API_KEY in .env"
    exit 1
fi

if [ "$MONGO_ROOT_PASSWORD" == "CHANGE_ME_IN_PRODUCTION" ]; then
    echo -e "${RED}❌ Error: Default MongoDB password detected${NC}"
    echo "Please change MONGO_ROOT_PASSWORD in .env"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration valid${NC}"

# Build Docker images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ Services are healthy${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for services... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Services failed to become healthy${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

# Display running services
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "Services running:"
docker-compose ps

echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:8080"
echo "  Backend API: http://localhost:3001"
echo "  MongoDB: localhost:27017"

echo ""
echo "To view logs:"
echo "  docker-compose logs -f"

echo ""
echo "To stop services:"
echo "  docker-compose down"
