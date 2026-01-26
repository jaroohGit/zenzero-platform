#!/bin/bash

set -e

echo "🚀 Post-Deployment Test Suite for AT-02 Detection"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_RESULTS_DIR="$DEPLOY_DIR/test-results"

echo ""
echo "📍 Working directory: $DEPLOY_DIR"
echo "📂 Test results: $TEST_RESULTS_DIR"
echo ""

# Function: Check service health
check_service() {
    local service=$1
    local max_attempts=10
    local attempt=1

    echo -n "⏳ Waiting for $service to be ready"
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service 2>/dev/null | grep -q "Up"; then
            echo " ✅"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo " ❌"
    return 1
}

# Step 1: Check Docker services
echo "🐳 Step 1: Checking Docker services..."
cd "$DEPLOY_DIR"

REQUIRED_SERVICES=("frontend" "backend" "timescaledb")

for service in "${REQUIRED_SERVICES[@]}"; do
    if ! check_service "$service"; then
        echo -e "${RED}❌ $service service not running${NC}"
        echo "Run: docker-compose up -d"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required services are running${NC}\n"

# Step 2: Wait for application
echo "⏳ Step 2: Waiting for application (10s)..."
sleep 10

# Step 3: Run tests
echo "🧪 Step 3: Running AT-02 detection tests..."
cd "$DEPLOY_DIR/frontend"

mkdir -p "$TEST_RESULTS_DIR"

if npm run test:at02:prod; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}\n"
    
    LATEST_REPORT=$(ls -t "$TEST_RESULTS_DIR"/at02-test-*.json 2>/dev/null | head -1)
    if [ -f "$LATEST_REPORT" ]; then
        echo "📄 Report: $LATEST_REPORT"
    fi
    
    exit 0
else
    echo -e "\n${RED}❌ Tests failed!${NC}\n"
    echo "📋 Check logs above"
    echo "📸 Screenshot: $TEST_RESULTS_DIR/at02-screenshot.png"
    
    echo -e "\n${YELLOW}📝 Recent logs:${NC}"
    docker-compose logs --tail=20 frontend backend
    
    exit 1
fi
