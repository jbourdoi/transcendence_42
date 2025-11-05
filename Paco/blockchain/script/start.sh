#!/bin/bash
set -e

# Start Avalanche in background (single-node local mode)
avalanchego --http-host=127.0.0.1 --network-id=local --sybil-protection-enabled=false &
AVAL_PID=$!

# Wait until Avalanche API is reachable
until nc -z localhost 9650; do
  echo "⏳ Waiting for Avalanche API..."
  sleep 2
done


for i in {1..5}; do
  BOOTSTRAPPED=$(curl -s -X POST --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"info.isBootstrapped",
    "params":{"chain":"C"}
  }' -H 'content-type:application/json' 127.0.0.1:9650/ext/info | grep -o '"isBootstrapped":true' || true)

  if [ "$BOOTSTRAPPED" = '"isBootstrapped":true' ]; then
    echo "✅ Avalanche bootstrapped!"
    break
  fi

  echo "⏳ Waiting..."
  sleep 2
done


# Deploy contract
bun srcs/deploy.ts

# Start Bun API (keeps container alive)
echo "Starting Bun API..."
bun --watch srcs/index.ts

