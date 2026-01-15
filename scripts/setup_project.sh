#!/bin/bash

set -e

echo "Starting project setup..."

echo "Generating .env file from .env.tpl"
ENV=".env"
cp .env.tpl $ENV

CLIENT_ID="u-s4t2ud-9f30b2430e51c381ae5e38158295eef89230a74b070231a798bd1bcb7a01709c"
CLIENT_SECRET="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"
PASSPHRASE="abcde"
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
$SED "s|^\(PASSPHRASE=\).*|\1${PASSPHRASE}|" $ENV
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

echo "Project setup completed successfully."
