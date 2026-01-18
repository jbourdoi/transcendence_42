#!/bin/bash

VAULT_API_ADDR=http://vault:6988

echo "Waiting for Vault API to be healthy..."
until curl -s $VAULT_API_ADDR/health > /dev/null; do
    echo "Vault API is not healthy yet. Retrying in 2 seconds..."
    sleep 2
done

ENV_VARS=(MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
)

KEYS=(minio_root_user
minio_root_password
)

echo "Fetching MinIO secrets from Vault..."

vault_fetch() {
    local secret_name=$1
    local res=$(curl -s "$VAULT_API_ADDR/vault/getSecret" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$secret_name\"}"
    )
    local value=$(echo "$res" | jq -r '.message.value')
    echo "$value"
}

for i in "${!ENV_VARS[@]}"; do
    ENV_VAR=${ENV_VARS[$i]}
    KEY=${KEYS[$i]}
    VALUE=$(vault_fetch "$KEY")

    export "$ENV_VAR=$VALUE"
    echo "Exported $ENV_VAR from Vault."
done

echo "Environment variables setup complete."

echo "Starting MinIO server..."
minio server /data --console-address ":9001" &
MINIO_PID=$!

echo "Waiting for MinIO..."
until curl -s $MINIO_HEALTH_URL; do
    sleep 2
done

echo "Configuring MinIO buckets..."
mc alias set localminio http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} && \
mc mb --ignore-existing localminio/thanos

echo "MinIO setup complete."

wait $MINIO_PID