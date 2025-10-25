#!/bin/bash

# Quick start script for local development

set -e

echo "🚀 Starting Deeper Research Synthetic in development mode..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

# Check for .env files
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your API keys"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env from example..."
    cp frontend/.env.example frontend/.env
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. In one terminal: cd backend && npm run dev"
echo "  2. In another terminal: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose -f docker-compose.dev.yml up"
