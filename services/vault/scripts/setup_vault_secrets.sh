#!/bin/bash

set -e

KEYS=(CLIENT_ID
CLIENT_SECRET
GF_ADMIN_USER
GF_ADMIN_PWD
GF_CERT_PATH
GF_KEY_PATH
GF_USER_NAME
GF_USER_MAIL
GF_USER_PWD
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
ETHEREAL_TO
ETHEREAL_FROM
ETHEREAL_AUTH_USER
ETHEREAL_AUTH_PWD
KIBANA_CERT_PATH
KIBANA_KEY_PATH
ELASTICSEARCH_PWD
SERVICES_CRT
SERVICES_KEY)

KVPATHS=(secret/client_id
secret/client_secret
secret/gf_admin_user
secret/gf_admin_pwd
secret/gf_cert_path
secret/gf_key_path
secret/gf_user_name
secret/gf_user_mail
secret/gf_user_pwd
secret/minio_root_user
secret/minio_root_password
secret/ethereal_to
secret/ethereal_from
secret/ethereal_auth_user
secret/ethereal_auth_pwd
secret/kibana_cert_path
secret/kibana_key_path
secret/elasticsearch_pwd
secret/services_crt
secret/services_key)


for i in "${!KEYS[@]}"; do
    KEY=${KEYS[$i]}
    KVPATH=${KVPATHS[$i]}
    VALUE=${!KEY}
    echo "Storing ${KVPATH}=${VALUE} in Vault..."
    vault kv put $KVPATH value="${VALUE}"
done