.PHONY: fix-perms kill-port setup clean build dev up down restart db-push db-migrate db-studio db-seed db-reset logs help

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

APP_NAME = $(APP_CONTAINER_NAME)
DB_NAME = $(DB_CONTAINER_NAME)

fix-perms:
	@sudo chown -R $$USER:$$USER public/uploads 2>/dev/null || true

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

build: kill-port
	docker compose up -d --build

dev: kill-port
	docker compose up -d db
	npm run dev

up: kill-port
	docker compose up -d

down: kill-port
	docker compose down

restart: kill-port
	docker compose restart

db-push:
	docker exec $(APP_NAME) npx prisma db push

db-migrate:
	docker exec $(APP_NAME) npx prisma migrate dev

db-studio:
	docker exec -it $(APP_NAME) npx prisma studio --port 5555 --browser none

db-seed:
	docker exec $(APP_NAME) npx prisma db seed

db-reset:
	npx prisma db push --force-reset
	rm -rf public/uploads/*

logs:
	docker compose logs -f app

help:
	@echo "  fix-perms    - Fix ownership of the uploads directory"
	@echo "  kill-port    - Stop any process on port 3000"
	@echo "  setup        - Full install and docker setup"
	@echo "  clean        - Remove all Docker artifacts including volumes"
	@echo "  build        - Force rebuild and start services (for dependency/Docker changes)"
	@echo "  dev          - Run Next.js dev server locally (with DB in Docker)"
	@echo "  up           - Start services in Docker (uses existing images)"
	@echo "  down         - Stop and remove Docker services"
	@echo "  restart      - Restart Docker services"
	@echo "  db-push      - Sync DB schema (no migrations)"
	@echo "  db-migrate   - Run Prisma migrations"
	@echo "  db-studio    - Open Prisma Studio"
	@echo "  db-seed      - Run database seed"
	@echo "  db-reset     - Reset DB and clear uploads (runs locally)"
	@echo "  logs         - Follow app logs in Docker"
