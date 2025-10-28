up:
	mkdir -p ~/sgoinfre
	docker compose build
	docker compose up -d

it:
	docker exec -it backend bash

down:
	docker compose down

nuke:
	docker ps -q | xargs -r docker stop
	docker system prune -fa --volumes
