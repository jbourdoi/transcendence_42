#!/bin/bash
set -e

vault server -config=./conf/config.hcl &
VAULT_PID=$!

bash ./scripts/vault_init.sh

### Unseal Vault ###
UNSEAL_FILE="${VAULT_SECURE_DIR}/unseal_key.txt"

echo "Using passphrase ${UNSEAL_PASSPHRASE} to decrypt unseal keys..."
gpg --batch --yes \
  --passphrase "${UNSEAL_PASSPHRASE}" \
  --output ${UNSEAL_FILE} \
  --decrypt ${VAULT_SEALED_FILE}

echo "Unsealing Vault..."
while IFS= read -r key; do
  vault operator unseal "${key}"
done < ${UNSEAL_FILE}

shred -u ${UNSEAL_FILE} 2>/dev/null || rm -f ${UNSEAL_FILE}

echo "Vault unsealed. Logging in as root with token from ${VAULT_ROOT_TOKEN_FILE}..."
cat ${VAULT_ROOT_TOKEN_FILE} | vault login -

echo "Enabling KV secrets engine at path 'secret'..."
if [ "$(vault secrets list -format=json | jq -r '."secret/"?.type')" = "kv" ]; then
  echo "KV secrets engine already enabled at path. Continuing..."
else
  vault secrets enable -version=2 -path=secret kv
fi

bash ./scripts/approle_init.sh

echo "Unsetting VAULT_TOKEN for security."
export VAULT_TOKEN=""

echo "Starting API..."
bun ./srcs/index.ts

kill $VAULT_PID