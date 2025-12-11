#!/bin/bash

set -e

until [ "$(curl -ksu ${ELASTICSEARCH_USER}:${ELASTICSEARCH_PWD} ${KIBANA_STATUS_URL} | jq -r '.status.overall.level')" = "available" ] ; do
  echo "Waiting for Kibana to be ready..."
  sleep 5
done

until curl -s http://${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}/.kibana_task_manager_8.15.0 >/dev/null 2>&1; do
  sleep 5
done

curl -kX POST "${KIBANA_OBJECTS_URL}" \
  -H "kbn-xsrf: kibana" \
  -F "file=@/usr/share/kibana/imports/settings.ndjson"

curl -kX POST "${KIBANA_OBJECTS_URL}" \
  -H "kbn-xsrf: kibana" \
  -F "file=@/usr/share/kibana/imports/source.ndjson"

curl -kX POST "${KIBANA_OBJECTS_URL}" \
  -H "kbn-xsrf: kibana" \
  -F "file=@/usr/share/kibana/imports/dashboards.ndjson"