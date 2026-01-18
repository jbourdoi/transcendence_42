FROM alpine:latest

RUN apk --no-cache add bash curl jq

RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/bin/mc && \
    chmod +x /usr/bin/mc

COPY --from=minio/minio:RELEASE.2025-09-07T16-13-09Z /usr/bin/minio /usr/bin/minio

COPY entrypoint.sh .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]