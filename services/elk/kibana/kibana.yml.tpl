server.name: kibana
server.host: 0.0.0.0
server.publicBaseUrl: https://localhost:5601

elasticsearch.hosts: ["http://${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}"]
elasticsearch.username: ${ELASTICSEARCH_USER}
elasticsearch.password: ${ELASTICSEARCH_PWD}

server.ssl.enabled: true
server.ssl.certificate: ${KIBANA_CERT_PATH}
server.ssl.key: ${KIBANA_KEY_PATH}

xpack.monitoring.ui.container.elasticsearch.enabled: true