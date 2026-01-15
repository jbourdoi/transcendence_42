#!/bin/bash

set -e

echo "Starting Grafana server..."
exec grafana-server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini web &
GF_PID=$!

echo "Waiting for Grafana..."
until curl -ks $GRAFANA_URL_HEALTH; do
    sleep 2
done

echo "Creating Grafana user..."
USER=$(curl -k -X POST $GRAFANA_ADDR/api/admin/users \
    -u "$GF_SECURITY_ADMIN_USER:$GF_SECURITY_ADMIN_PASSWORD" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\":\"$GRAFANA_USER_NAME\",
        \"email\":\"$GRAFANA_USER_MAIL\",
        \"login\":\"$GRAFANA_USER_LOGIN\",
        \"password\":\"$GRAFANA_USER_PWD\"
    }")

echo "User creation response: $USER"

wait $GF_PID