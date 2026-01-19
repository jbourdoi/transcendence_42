FILEPATH = docker-compose.yml
FILEPATH_ELK = docker-compose-elk.yml
FILEPATH_METRICS = docker-compose-metrics.yml

up:
	chmod +x ./scripts/setup_project.sh
	./scripts/setup_project.sh
	COMPOSE_BAKE=true docker compose -f $(FILEPATH) build
	COMPOSE_BAKE=true docker compose -f $(FILEPATH) up -d
	COMPOSE_BAKE=true docker compose -f $(FILEPATH) logs -f

elk:
	make -C . up FILEPATH=$(FILEPATH_ELK)

metrics:
	make -C . up  FILEPATH=$(FILEPATH_METRICS)

all:
	make -C . up  FILEPATH=$(FILEPATH)
	make -C . up  FILEPATH=$(FILEPATH_ELK)
	make -C . up  FILEPATH=$(FILEPATH_METRICS)

re: down up

docker-required:
	@docker info >/dev/null 2>&1 || { \
		echo "Docker not running. Launching Docker Desktop..."; \
		open -a Docker; \
		echo "Waiting for Docker to start..."; \
		while ! docker info >/dev/null 2>&1; do \
			sleep 2; \
		done; \
		echo "Docker is running."; \
	}

down:
	docker compose -f $(FILEPATH) down
	docker compose -f $(FILEPATH_ELK) down
	docker compose -f $(FILEPATH_METRICS) down

nuke:
	docker ps -q | xargs -r docker stop
	docker system prune -fa --volumes
	docker volume rm $$(docker volume ls -q) || true
	rm -rf .env
	rm -rf ./services/vault/.env.vault

fclean:
	find . -type d -name node_modules -prune -exec rm -rf '{}' +
