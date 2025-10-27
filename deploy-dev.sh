#!/bin/bash

echo "🚀 Deploying Development Environment..."
echo "======================================"

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development file not found!"
    echo "Please create .env.development from .env.development.example"
    exit 1
fi

# Pull latest code from develop branch
echo "📥 Pulling latest code from GitHub (develop branch)..."
git fetch origin
git checkout develop
git pull origin develop

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose --env-file .env.development -f docker-compose.dev.yml down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose --env-file .env.development -f docker-compose.dev.yml up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.dev.yml exec -T backend npx prisma migrate deploy

# Show status
echo ""
echo "✅ Development deployment complete!"
echo "======================================"
echo "Frontend: http://localhost:3002"
echo "Backend API: http://localhost:5002"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.dev.yml logs -f"
echo ""
echo "To check status:"
echo "  docker-compose -f docker-compose.dev.yml ps"

