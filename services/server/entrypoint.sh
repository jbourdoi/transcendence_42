#!/bin/bash

set -e

VAULT_API_ADDR=http://vault:6988

echo "Waiting for Vault API to be healthy..."
until curl -s $VAULT_API_ADDR/health > /dev/null; do
    echo "Vault API is not healthy yet. Retrying in 2 seconds..."
    sleep 2
done

echo "Fetching Server secrets from Vault..."

vault_fetch() {
    local secret_name=$1
    local res=$(curl -s "$VAULT_API_ADDR/vault/getSecret" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$secret_name\"}"
    )
    local value=$(echo "$res" | jq -r '.message.value')
    echo "$value"
}

FILE=/tmp/ca_cert.pem
vault_fetch "services_crt" | printf "%b" "$(cat)" > "$FILE"
CA_CERT="$FILE"

echo "Exported CA_CERT=$CA_CERT from Vault."
echo "Environment variables setup complete."

echo "Waiting for WAF..."
WAF_HEALTH_URL="https://waf:443/health"
until curl -s --cacert "$CA_CERT" "$WAF_HEALTH_URL" | grep "OK" > /dev/null; do
  sleep 2
done

echo "Starting the server..."
exec npm run dev