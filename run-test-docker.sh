#!/bin/bash

# Run Puppeteer tests in Docker container with all dependencies
# This avoids system library issues on the host

set -e

echo "🐳 Building test container..."
cd /home/teddy/deploy/frontend

docker build -f Dockerfile.test -t wwt-test .

echo ""
echo "🧪 Running tests..."
docker run --rm \
    --network host \
    --add-host=host.docker.internal:host-gateway \
    -e TEST_URL="${TEST_URL:-https://www.zenzerobiogas.com}" \
    -v "/home/teddy/deploy/test-results:/app/test-results" \
    wwt-test

echo ""
echo "✅ Tests complete! Check test-results/ for outputs"
