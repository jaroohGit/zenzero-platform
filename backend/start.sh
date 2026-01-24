#!/bin/sh

echo "Starting MQTT Broker, WebSocket Bridge, API Server, and WWT01 Subscriber..."

# Start MQTT Broker in background
node mqtt-broker.js &
MQTT_PID=$!

# Start WebSocket Bridge in background
node websocket-server.js &
WS_PID=$!

# Start API Server in background
node api-server.js &
API_PID=$!

# Start MQTT Subscriber for WWT01 data processing
echo "Starting MQTT Subscriber for WWT01..."
node mqtt-subscriber-wwt01.js &
SUB_PID=$!

# Publisher is disabled by default (for testing only)
# Uncomment below to enable test publisher
# if [ "$START_PUBLISHER" = "true" ]; then
#   echo "Starting MQTT Publisher..."
#   node mqtt-publisher.js &
#   PUB_PID=$!
# fi

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
