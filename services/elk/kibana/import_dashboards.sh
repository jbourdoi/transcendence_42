#!/bin/bash

set -e

echo "Waiting for Kibana to be ready..."
until [ "$(curl -s \
                --cacert "$SERVER_SSL_CERTIFICATE"  \
                -u ${ELASTICSEARCH_USER}:${ELASTICSEARCH_PWD} \
                ${KIBANA_STATUS_URL} 2>/dev/null \
                | jq -r '.status.overall.level')" = "available" ] ; do
  sleep 5
done

echo "Waiting for Elasticsearch to have the .kibana_task_manager index..."
until curl -s http://${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}/.kibana_task_manager_8.15.0 >/dev/null 2>&1; do
  sleep 5
done

echo "Importing Kibana dashboards..."
curl --cacert "$SERVER_SSL_CERTIFICATE" POST "${KIBANA_OBJECTS_URL}" \
  -H "kbn-xsrf: kibana" \
  -F "file=@/usr/share/kibana/imports/settings.ndjson"

curl --cacert "$SERVER_SSL_CERTIFICATE" POST "${KIBANA_OBJECTS_URL}" \
  -H "kbn-xsrf: kibana" \
  -F "file=@/usr/share/kibana/imports/source.ndjson"

curl --cacert "$SERVER_SSL_CERTIFICATE" POST "${KIBANA_OBJECTS_URL}" \
  -H "kbn-xsrf: kibana" \
  -F "file=@/usr/share/kibana/imports/dashboards.ndjson"

echo "Dashboards imported successfully."