# Quick Start Script for Development Environment

#!/bin/bash

echo "🚀 Starting Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker first"
    exit 1
fi

# Build and start services
echo "📦 Building and starting services..."
docker-compose -f docker-compose.dev.yml up --build -d

echo ""
echo "✅ Development environment is starting..."
echo ""
echo "📍 Services will be available at:"
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:3001"
echo "   MQTT Broker:  mqtt://localhost:1883"
echo "   MQTT WS:      ws://localhost:8084"
echo "   WebSocket:    ws://localhost:8085"
echo "   Database:     localhost:5436"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop:         docker-compose -f docker-compose.dev.yml down"
echo "   Restart:      docker-compose -f docker-compose.dev.yml restart"
echo ""
echo "Showing logs (Ctrl+C to exit, services will keep running)..."
echo ""

# Show logs
docker-compose -f docker-compose.dev.yml logs -f
