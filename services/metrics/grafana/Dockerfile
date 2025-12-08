FROM grafana/grafana:12.2

WORKDIR /app/services/grafana

USER root

RUN apk add openssl

RUN mkdir -p ./certs \
    && chmod 755 ./certs

RUN openssl req -x509 -nodes \
    -out ./certs/grafana.crt \
    -keyout ./certs/grafana.key \
    -days 365 \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost"

RUN chmod 755 ./certs/grafana.key

USER grafana

CMD ["grafana-server", "--homepath=/usr/share/grafana", "--config=/etc/grafana/grafana.ini", "web"]

# TODO:
## readonly access to dashboards
