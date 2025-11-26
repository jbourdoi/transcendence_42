FILEPATH = docker-compose.yml
FILEPATH_ELK = docker-compose-elk.yml
FILEPATH_METRICS = docker-compose-metrics.yml

elk:
	make -C . up FILEPATH=$(FILEPATH_ELK)

metrics:
	make -C . up  FILEPATH=$(FILEPATH_METRICS)

all:
	make -C . up  FILEPATH=$(FILEPATH)
	make -C . up  FILEPATH=$(FILEPATH_ELK)
	make -C . up  FILEPATH=$(FILEPATH_METRICS)

up: docker-required
	docker compose -f $(FILEPATH) build
	docker compose -f $(FILEPATH) up -d
# docker compose -f $(FILEPATH) logs -f

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

fclean:
	find . -type d -name node_modules -prune -exec rm -rf '{}' +
