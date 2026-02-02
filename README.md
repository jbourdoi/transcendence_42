# Welcome to Transcendence!

## Server
PORT: 8433

## Grafana
PORT: 4000

## Kibana
PORT: 5601


## Setup
- Go to `scripts/setup_project.sh`
- Create a pastebin for your vault secrets that are visible from line `72` to `75` included
- Add to `scripts/setup_project.sh` your pastebin url at line `22`
- Add values for each variables from line `25` to line `34` included
- Start docker compose with `make all`
