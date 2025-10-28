FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update

RUN apt-get install -y curl build-essential ca-certificates && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_25.x | bash -

RUN apt-get install -y nodejs

RUN npm i -g pnpm

COPY app/package*.json app/pnpm-lock.yaml* ./

RUN pnpm install

COPY app ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
