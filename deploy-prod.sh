#!/bin/bash

echo "🚀 Deploying Production Environment..."
echo "======================================"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Pull latest code from main branch
echo "📥 Pulling latest code from GitHub (main branch)..."
git fetch origin
git checkout main
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose --env-file .env.production -f docker-compose.prod.yml down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Show status
echo ""
echo "✅ Production deployment complete!"
echo "======================================"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:5001"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To check status:"
echo "  docker-compose -f docker-compose.prod.yml ps"

