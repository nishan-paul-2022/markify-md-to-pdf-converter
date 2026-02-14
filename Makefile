.PHONY: kill-port setup clean dev up down restart ps logs db-push db-migrate db-studio db-seed help

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

APP_NAME = $(APP_CONTAINER_NAME)
DB_NAME = $(DB_CONTAINER_NAME)

kill-port:
	@fuser -k 3000/tcp 2>/dev/null || true
	@CONTAINERS=$$(docker ps -q --filter "publish=3000"); \
	if [ -n "$$CONTAINERS" ]; then \
		docker stop $$CONTAINERS >/dev/null; \
	fi

setup: kill-port
	npm install
	$(MAKE) up
	$(MAKE) db-push

clean: kill-port
	docker compose down -v
	docker rmi $(APP_NAME) || true

fix-perms:
	@sudo chown -R $$USER:$$USER public/uploads 2>/dev/null || true

dev: kill-port
	docker compose up -d db
	npm run dev

up: kill-port
	docker compose up -d

build: kill-port
	docker compose up -d --build

down: kill-port
	docker compose down

restart: kill-port
	docker compose restart

ps:
	docker compose ps

logs:
	docker compose logs -f app

db-push:
	docker exec $(APP_NAME) npx prisma db push

db-migrate:
	docker exec $(APP_NAME) npx prisma migrate dev

db-studio:
	docker exec -it $(APP_NAME) npx prisma studio --port 5555 --browser none

db-seed:
	docker exec $(APP_NAME) npx prisma db seed

help:
	@echo "  kill-port    - Stop any process on port 3000"
	@echo "  setup        - Full install and docker setup"
	@echo "  clean        - Remove all Docker artifacts including volumes"
	@echo "  dev          - Run Next.js dev server locally (with DB in Docker)"
	@echo "  up           - Start services in Docker (uses existing images)"
	@echo "  down         - Stop and remove Docker services"
	@echo "  build        - Force rebuild and start services (for dependency/Docker changes)"
	@echo "  restart      - Restart Docker services"
	@echo "  ps           - Show running containers"
	@echo "  logs         - Follow app logs in Docker"
	@echo "  db-push      - Sync DB schema (no migrations)"
	@echo "  db-migrate   - Run Prisma migrations"
	@echo "  db-studio    - Open Prisma Studio"
	@echo "  db-seed      - Run database seed"
