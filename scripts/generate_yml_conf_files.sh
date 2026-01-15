#!/bin/bash

set -e

set -a
. ./.env
set +a

FILES="
./services/elk/logstash/pipeline/logstash.conf.tpl:./services/elk/logstash/pipeline/logstash.conf
./services/elk/kibana/kibana.yml.tpl:./services/elk/kibana/kibana.yml
./services/metrics/alertManager/alertmanager.yml.tpl:./services/metrics/alertManager/alertmanager.yml
./services/metrics/grafana/provisioning/dashboards/dashboards.yml.tpl:./services/metrics/grafana/provisioning/dashboards/dashboards.yml
./services/metrics/grafana/provisioning/datasources/datasources.yml.tpl:./services/metrics/grafana/provisioning/datasources/datasources.yml
./services/metrics/prometheus/prometheus.yml.tpl:./services/metrics/prometheus/prometheus.yml
./services/metrics/thanosSidecar/thanos-storage.yml.tpl:./services/metrics/thanosSidecar/thanos-storage.yml
./services/vault/conf/config.hcl.tpl:./services/vault/conf/config.hcl
"

echo "Generating YAML and config files from templates..."

for file in $FILES; do
    TPL_FILE=$(echo $file | cut -d: -f1)
    OUT_FILE=$(echo $file | cut -d: -f2)

    envsubst < $TPL_FILE > $OUT_FILE

    echo "Generated $OUT_FILE from $TPL_FILE"
done

echo "All files generated successfully."