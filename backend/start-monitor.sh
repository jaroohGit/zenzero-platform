#!/bin/bash

# MQTT Monitor Quick Start Script

echo "🚀 Starting MQTT Monitor"
echo "======================="
echo ""

# Check if MQTT broker is running
echo "📡 Checking MQTT broker..."
if ! nc -z localhost 1883 2>/dev/null; then
    echo "⚠️  MQTT broker not detected on port 1883"
    echo "   Starting MQTT broker first..."
    node mqtt-broker.js &
    BROKER_PID=$!
    echo "   Broker started with PID: $BROKER_PID"
    sleep 3
else
    echo "✓ MQTT broker is running"
fi

echo ""
echo "🖥️  Starting MQTT Monitor Backend..."
node mqtt-monitor-backend.js &
MONITOR_PID=$!

echo "✓ Monitor started with PID: $MONITOR_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ MQTT Monitor is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Dashboard: http://localhost:3002/mqtt-monitor.html"
echo "🔌 WebSocket: ws://localhost:3002"
echo "🌐 API:       http://localhost:3002/api"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
wait $MONITOR_PID
