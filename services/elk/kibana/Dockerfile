FROM docker.elastic.co/kibana/kibana:8.15.0

USER root

WORKDIR /app/services/kibana

RUN apt-get update && apt-get install -y jq openssl

RUN mkdir -p ./certs \
    && chmod 755 ./certs

RUN openssl req -x509 -nodes \
    -out ./certs/kibana.crt \
    -keyout ./certs/kibana.key \
    -days 365 \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost" \
    -addext "subjectAltName=DNS:0.0.0.0,IP:127.0.0.1"

RUN chmod 755 ./certs/kibana.key

COPY import_dashboards.sh /usr/local/bin/import_dashboards.sh
RUN chmod +x /usr/local/bin/import_dashboards.sh

USER kibana

ENTRYPOINT ["/bin/bash", "-c", "/usr/local/bin/import_dashboards.sh & /usr/local/bin/kibana-docker"]