#!/bin/bash

set -e

UNSEAL_FILE="${VAULT_SECURE_DIR}/unseal_key.txt"

mkdir -p ${VAULT_SECURE_DIR}
chmod 700 ${VAULT_SECURE_DIR}

echo "⏳ Waiting for Vault to be ready..."
until curl -ks ${VAULT_HEALTH_URL} >/dev/null; do
  sleep 1
done
echo "✅ Vault is ready."

### Initialize Vault and generate keys ###
echo "Initializing Vault..."
if [ "$(vault status -format=json | jq '.initialized')" = "true" ]; then
  echo "Vault is already initialized."
  exit 0
else
  vault operator init -key-shares=1 -key-threshold=1 -format=json > ${VAULT_SECURE_DIR}/init.json
fi

echo "Storing unseal key and root token..."
jq -r '.unseal_keys_b64[0]' ${VAULT_SECURE_DIR}/init.json > ${UNSEAL_FILE}
jq -r '.root_token' ${VAULT_SECURE_DIR}/init.json > ${VAULT_ROOT_TOKEN_FILE}

echo "Encrypting unseal keys with passphrase ${UNSEAL_PASSPHRASE}..."
gpg --symmetric --cipher-algo AES256 --batch --yes \
    --pinentry-mode loopback --passphrase "${UNSEAL_PASSPHRASE}" \
    --output ${VAULT_SEALED_FILE} ${UNSEAL_FILE}
rm -f ${UNSEAL_FILE}

chmod 600 ${VAULT_SECURE_DIR}/*

echo "Vault initialized."