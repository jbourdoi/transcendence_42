# Welcome to Transcendence!
42 School group project. This is Pong website.

It includes:
- Pong local and remote game
- Pong tournament and duels
- Live chat
- Login with options: 2FA security and 42 OAuth
- Register with option: 42 OAuth
- Friends list
- Profile page
- Metrics management with Grafana, Prometheus and 3 Thanos services
- Services log management with ELK Stack
- SQlite3 database
- Custom-made WAF as server's reverse proxy
- Vault for keeping secrets secure

## Demo
![Quick Preview](assets/demo.webp)

## Skills developed
- Docker and Docker Compose
- Persistent storage with Docker volumes
- Service interconnection via Docker custom networks
- Microservices architecture
- Communication between multiple microservices via fetch API
- Database design and integration with SQlite3
- Websockets for real-time communication
- Webdev: Node.js, Typescript, Fastify, Bun, Tailwind
- Keyboard arrows navigation
- Monitoring tools: Grafana, Prometheus, Thanos, ELK Stack
- Bash scripts
- Tokens: JWT, JWS, JWE
- File upload with Fastify Multipart
- Hash passwords with bcrypt
- Send emails with nodemailer, ethereal and GMail
- Custom-made SRR/SPA

## Ports used
- Server: 8433
- Grafana: 4000
- Kibana: 5601

## Setup
1. Copy/paste .env.tpl to .env and change all `<CHANGE-ME>` placeholders with your own values
  - 1.1 Do not change the `<CHANGE-ME-WITH-ETHEREAL-SETUP>` placeholders
  - 1.2 Change containers ports if there are conflicts
2. `make all`
