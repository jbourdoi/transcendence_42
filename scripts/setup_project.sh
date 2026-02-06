#!/bin/bash

set -e

echo "Starting project setup..."

if ! [ -f ".env" ]; then
    echo ".env file do not exist. Create it before retrying."
    exit 1
fi

if grep -q "<CHANGE-ME>" .env; then
    echo ".env file still contains placeholders. Change them before retrying."
    exit 1
fi

if [ -f "./services/vault/.env.vault" ]; then
    echo ".env.vault file already exists. Please remove it before retrying."
    exit 1
fi

echo "Setting up Ethereal email account"
bash ./scripts/setup_ethereal.sh

echo "Setting up YAML configuration files"
bash ./scripts/generate_yml_conf_files.sh

echo "Setting up Thanos Store volume"
bash ./services/metrics/thanosStore/init_volume.sh

ENV=".env"

echo "Taking some .env values to send to .env.vault"
CLIENT_ID_VALUE=$(grep '^CLIENT_ID=' "$ENV" | cut -d '=' -f2-)
CLIENT_SECRET=$(grep '^CLIENT_SECRET=' "$ENV" | cut -d '=' -f2-)
GMAIL_USER=$(grep '^GMAIL_USER=' "$ENV" | cut -d '=' -f2-)
GMAIL_PWD=$(grep '^GMAIL_PWD=' "$ENV" | cut -d '=' -f2-)
GF_ADMIN_USER=$(grep '^GF_ADMIN_USER=' "$ENV" | cut -d '=' -f2-)
GF_ADMIN_PWD=$(grep '^GF_ADMIN_PWD=' "$ENV" | cut -d '=' -f2-)
GF_USER_NAME=$(grep '^GF_USER_NAME=' "$ENV" | cut -d '=' -f2-)
GF_USER_MAIL=$(grep '^GF_USER_MAIL=' "$ENV" | cut -d '=' -f2-)
GF_USER_PWD=$(grep '^GF_USER_PWD=' "$ENV" | cut -d '=' -f2-)
MINIO_ROOT_USER=$(grep '^MINIO_ROOT_USER=' "$ENV" | cut -d '=' -f2-)
MINIO_ROOT_PASSWORD=$(grep '^MINIO_ROOT_PASSWORD=' "$ENV" | cut -d '=' -f2-)
ETHEREAL_TO=$(grep '^ETHEREAL_TO=' "$ENV" | cut -d '=' -f2-)
ETHEREAL_FROM=$(grep '^ETHEREAL_FROM=' "$ENV" | cut -d '=' -f2-)
ETHEREAL_AUTH_USER=$(grep '^ETHEREAL_AUTH_USER=' "$ENV" | cut -d '=' -f2-)
ETHEREAL_AUTH_PWD=$(grep '^ETHEREAL_AUTH_PWD=' "$ENV" | cut -d '=' -f2-)
ELASTICSEARCH_PWD=$(grep '^ELASTICSEARCH_PWD=' "$ENV" | cut -d '=' -f2-)

echo "Setting up .env.vault"
ENV_VAULT="./services/vault/.env.vault"

KEYS=(CLIENT_ID
CLIENT_SECRET
GMAIL_USER
GMAIL_PWD
GF_ADMIN_USER
GF_ADMIN_PWD
GF_USER_NAME
GF_USER_MAIL
GF_USER_PWD
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
ETHEREAL_TO
ETHEREAL_FROM
ETHEREAL_AUTH_USER
ETHEREAL_AUTH_PWD
ELASTICSEARCH_PWD)

echo "Creating or empty $ENV_VAULT if already exists"
> $ENV_VAULT

if [ "$(uname)" = "Darwin" ]; then
    SED="gsed -i"
else
    SED="sed -i"
fi

echo "Extracting sensitive keys to $ENV_VAULT and removing them from $ENV"
for key in "${KEYS[@]}"; do
    if ! grep -q "^${key}=" $ENV; then
        echo "Error: Key ${key} not found in ${ENV}."
        exit 1
    fi
    grep "^${key}=" $ENV >> $ENV_VAULT
    $SED "/^${key}=/d" $ENV
done

echo "Project setup completed successfully."
