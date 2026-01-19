#!/bin/bash

set -e

echo "Setting up environment variables..."
source ./setup_env_vars.sh

echo "Waiting for Elasticsearch to be healthy..."
ELASTICSEARCH_HEALTH_URL=http://elasticsearch:9200/_cluster/health
until curl -s $ELASTICSEARCH_HEALTH_URL > /dev/null; do
    sleep 2
done

echo "Starting Kibana..."
/usr/local/bin/kibana-docker &
KIBANA_PID=$!

bash ./import_dashboards.sh

wait $KIBANA_PID