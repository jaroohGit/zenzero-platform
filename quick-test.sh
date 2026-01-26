#!/bin/bash

# Quick test without full deployment check
cd "$(dirname "$0")/frontend"

echo "🧪 Running quick AT-02 test..."
npm run test:at02:prod

if [ $? -eq 0 ]; then
    echo "✅ Test passed"
    exit 0
else
    echo "❌ Test failed"
    exit 1
fi
