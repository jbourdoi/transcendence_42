#!/bin/bash

set -e

echo "Starting project setup..."

if [ -f ".env" ]; then
    if ! grep -q "<CHANGE-ME>" .env; then
        echo ".env file already exists and is configured. Skipping setup."
        exit 0
    fi
fi

echo "Generating .env file from .env.tpl"
ENV=".env"
cp .env.tpl $ENV

# eval "$(curl -s https://pastebin.com/raw/xVZfbNms | tr -d '\r' | grep -v '^\s*#' | grep -v '^\s*$' | sed 's/^/export /')"
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  value="${value%$'\r'}"
  export "$key=$value"
done < <(curl -s https://pastebin.com/raw/xVZfbNms)

VAULT_UNSEAL_PASSPHRASE="abcde"
LOGS_PATH="./logs"
GF_ADMIN_USER="adminuser"
GF_ADMIN_PWD="adminpwd"
GF_USER_NAME="grafanauser"
GF_USER_MAIL="grafanauser@example.com"
GF_USER_PWD="grafanauserpwd"
MINIO_ROOT_USER="minioroot"
MINIO_ROOT_PASSWORD="miniorootpwd"
ELASTICSEARCH_PWD="elasticpwd"

if [ "$(uname)" = "Darwin" ]; then
    SED="gsed -i"
else
    SED="sed -i"
fi

echo "Filling in the placeholders in .env file"
$SED "s|^\(CLIENT_ID=\).*|\1${CLIENT_ID}|" $ENV
$SED "s|^\(CLIENT_SECRET=\).*|\1${CLIENT_SECRET}|" $ENV
$SED "s|^\(GMAIL_USER=\).*|\1${GMAIL_USER}|" $ENV
$SED "s|^\(GMAIL_PWD=\).*|\1${GMAIL_PWD}|" $ENV
$SED "s|^\(VAULT_UNSEAL_PASSPHRASE=\).*|\1${VAULT_UNSEAL_PASSPHRASE}|" $ENV
$SED "s|^\(LOGS_PATH=\).*|\1${LOGS_PATH}|" $ENV
$SED "s|^\(GF_ADMIN_USER=\).*|\1${GF_ADMIN_USER}|" $ENV
$SED "s|^\(GF_ADMIN_PWD=\).*|\1${GF_ADMIN_PWD}|" $ENV
$SED "s|^\(GF_USER_NAME=\).*|\1${GF_USER_NAME}|" $ENV
$SED "s|^\(GF_USER_MAIL=\).*|\1${GF_USER_MAIL}|" $ENV
$SED "s|^\(GF_USER_PWD=\).*|\1${GF_USER_PWD}|" $ENV
$SED "s|^\(MINIO_ROOT_USER=\).*|\1${MINIO_ROOT_USER}|" $ENV
$SED "s|^\(MINIO_ROOT_PASSWORD=\).*|\1${MINIO_ROOT_PASSWORD}|" $ENV
$SED "s|^\(ELASTICSEARCH_PWD=\).*|\1${ELASTICSEARCH_PWD}|" $ENV

echo "Setting up Ethereal email account"
bash ./scripts/setup_ethereal.sh

echo "Setting up YAML configuration files"
bash ./scripts/generate_yml_conf_files.sh

echo "Setting up Thanos Store volume"
bash ./services/metrics/thanosStore/init_volume.sh



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
