#!/bin/bash

set -e

echo "Enabling AppRole auth method."
if vault auth list | grep -q 'approle/'; then
    echo "AppRole auth method already enabled. Continuing..."
else
    vault auth enable approle
fi

echo "Creating policy for set/get secrets."
vault policy write set-get-policy - <<EOF
path "secret/data/*" {
  capabilities = ["create", "read", "update", "list"]
}
EOF

echo "Creating AppRole with set-get-policy."
vault write auth/approle/role/set-get \
    token_type=service \
    secret_id_ttl=0 \
    token_ttl=0 \
    token_max_ttl=0 \
    secret_id_num_uses=0 \
    policies="set-get-policy"

echo "Storing role_id."
vault read -format=json auth/approle/role/set-get/role-id \
    | jq -r '.data.role_id' \
    > ${VAULT_APPROLE_ROLE_ID_FILE}

echo "Generating and storing secret_id."
vault write -format=json -f auth/approle/role/set-get/secret-id \
    | jq -r '.data.secret_id' \
    > ${VAULT_APPROLE_SECRET_ID_FILE}

echo "AppRole initialization complete."