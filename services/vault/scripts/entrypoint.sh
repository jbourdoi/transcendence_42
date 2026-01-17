#!/bin/bash

set -e
unset HISTFILE

vault server -config=./conf/config.hcl &
VAULT_PID=$!

echo "Waiting for Vault to be ready..."
until curl -ks ${VAULT_HEALTH_URL} >/dev/null; do
  sleep 1
done
echo "Vault is ready."

ENV_FILE="./.env.vault"

FIRST_INIT=false

export VAULT_SEALED_FILE="${VAULT_SECURE_DIR}/sealed_keys.gpg"
export VAULT_UNSEAL_FILE="${VAULT_SECURE_DIR}/unseal_key.txt"
export VAULT_ROOT_TOKEN_FILE="${VAULT_SECURE_DIR}/root_token.txt"

if ! vault status | grep -q 'Initialized.*true'; then
  FIRST_INIT=true
  set -a
  source ${ENV_FILE}
  set +a
  bash ./scripts/vault_init.sh
fi

echo "Using passphrase ${VAULT_UNSEAL_PASSPHRASE} to decrypt unseal keys..."
gpg --batch --yes \
  --passphrase "${VAULT_UNSEAL_PASSPHRASE}" \
  --output ${VAULT_UNSEAL_FILE} \
  --decrypt ${VAULT_SEALED_FILE}

echo "Unsealing Vault..."
while IFS= read -r key; do
  vault operator unseal "${key}"
done < ${VAULT_UNSEAL_FILE}

shred -u ${VAULT_UNSEAL_FILE} 2>/dev/null || rm -f ${VAULT_UNSEAL_FILE}

echo "Vault unsealed."

if [ "$FIRST_INIT" = true ]; then
  echo "Logging in as root with token from ${VAULT_ROOT_TOKEN_FILE}..."
  cat ${VAULT_ROOT_TOKEN_FILE} | vault login -

  echo "Enabling KV secrets engine at path 'secret'..."
  vault secrets enable -version=2 -path=secret kv

  echo "Setting up AppRole authentication method..."
  bash ./scripts/approle_init.sh

  echo "Create certificates for all services..."
  openssl req -x509 -nodes \
    -out ./certs/services.crt \
    -keyout ./certs/services.key \
    -days 365 \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
  echo "Certificates created."

  export SERVICES_CRT=$(awk 'NF {sub(/\r/, ""); printf "%s\\n", $0;}' ./certs/services.crt)
  export SERVICES_KEY=$(awk 'NF {sub(/\r/, ""); printf "%s\\n", $0;}' ./certs/services.key)

  echo "Setting up Vault secrets..."
  bash ./scripts/setup_vault_secrets.sh

  echo "Removing .env.vault file for security."
  shred -u ${ENV_FILE} 2>/dev/null || rm -f ${ENV_FILE}
fi

echo "Unsetting VAULT_TOKEN for security."
export VAULT_TOKEN=""

echo "Starting API..."
bun ./srcs/index.ts

kill $VAULT_PID