FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update

RUN apt-get install -y curl build-essential ca-certificates && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_25.x | bash -

RUN apt-get install -y nodejs

RUN npm i -g pnpm

COPY package.json ./
COPY srcs ./srcs
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY tailwind.config.js ./

RUN pnpm install

# CMD ["sleep", "infinity"]
CMD ["npm", "run", "dev"]
