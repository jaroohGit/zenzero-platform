# Stop Development Environment Script

#!/bin/bash

echo "🛑 Stopping Development Environment..."
echo ""

docker-compose -f docker-compose.dev.yml down

echo ""
echo "✅ Development environment stopped"
echo ""
echo "To remove all data (database), run:"
echo "   docker-compose -f docker-compose.dev.yml down -v"
