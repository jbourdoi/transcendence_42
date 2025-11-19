FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

ARG TARGETARCH

WORKDIR /app

RUN apt-get update

RUN apt-get -y install build-essential file git curl tar gzip unzip bash ca-certificates && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.com/install | bash

ENV PATH="$PATH:/root/.bun/bin"

COPY package.json ./
COPY srcs ./srcs
COPY bun.lock ./
COPY certs ./certs

RUN bun install

# CMD ["sleep", "infinity"]
CMD ["bun", "--watch", "./srcs/index.ts"]
