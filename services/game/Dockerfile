FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update

RUN apt-get update && apt-get install -y build-essential curl unzip && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

COPY package.json ./
COPY srcs ./srcs
COPY tsconfig.json ./

# CMD ["sleep", "infinity"]
RUN bun install

CMD ["bun", "--watch", "./srcs/game.index.ts"]
