#!/bin/bash

set -e

ENV_FILE=".env"

echo "Generating Ethereal account..."

RES=$(node -e "
    const nodemailer = require('nodemailer');
    nodemailer.createTestAccount((err, account) => {
        if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        process.exit(1);
        }
        console.log(JSON.stringify({
        user: account.user,
        pass: account.pass,
        host: account.smtp.host,
        port: account.smtp.port,
        }));
    });
")

ETHEREAL_PORT=$(echo $RES | jq -r '.port')
ETHEREAL_HOST=$(echo $RES | jq -r '.host')
ETHEREAL_TO=$(echo $RES | jq -r '.user')
ETHEREAL_FROM=$(echo $RES | jq -r '.user')
ETHEREAL_AUTH_USER=$(echo $RES | jq -r '.user')
ETHEREAL_AUTH_PASS=$(echo $RES | jq -r '.pass')

echo $ETHEREAL_PORT $ETHEREAL_HOST $ETHEREAL_FROM $ETHEREAL_AUTH_USER $ETHEREAL_AUTH_PASS $ETHEREAL_TO
echo "Updating ${ENV_FILE} with Ethereal credentials..."

if [ "$(uname)" = "Darwin" ]; then
    SED="gsed -i"
else
    SED="sed -i"
fi

$SED "s|^\(ETHEREAL_PORT=\).*|\1${ETHEREAL_PORT}|" $ENV_FILE
$SED "s|^\(ETHEREAL_HOST=\).*|\1${ETHEREAL_HOST}:${ETHEREAL_PORT}|" $ENV_FILE
$SED "s|^\(ETHEREAL_TO=\).*|\1${ETHEREAL_TO}|" $ENV_FILE
$SED "s|^\(ETHEREAL_FROM=\).*|\1${ETHEREAL_FROM}|" $ENV_FILE
$SED "s|^\(ETHEREAL_AUTH_USER=\).*|\1${ETHEREAL_AUTH_USER}|" $ENV_FILE
$SED "s|^\(ETHEREAL_AUTH_PWD=\).*|\1${ETHEREAL_AUTH_PASS}|" $ENV_FILE

echo "Ethereal setup completed."
