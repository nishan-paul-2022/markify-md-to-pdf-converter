# Load environment variables from .env file
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

.PHONY: setup clean build dev up down restart db-push db-migrate db-studio db-seed db-reset logs help kill-port ensure-network fix-perms

fix-perms:
	@sudo chown -R $$USER:$$USER public/uploads 2>/dev/null || true

kill-port:
	@if [ -z "$(PORT)" ]; then echo "Error: PORT is not set in .env"; exit 1; fi
	@fuser -k $(PORT)/tcp 2>/dev/null || true
	@if lsof -Pi :$(PORT) -sTCP:LISTEN -t >/dev/null; then \
		lsof -ti :$(PORT) | xargs kill -9 || true; \
	fi
	@CONTAINER_ID=$$(docker ps -q --filter "publish=$(PORT)"); \
	if [ ! -z "$$CONTAINER_ID" ]; then \
		docker stop $$CONTAINER_ID || true; \
	fi
	@sleep 1

ensure-network:
	@docker network inspect main_network >/dev/null 2>&1 || docker network create main_network

setup: ensure-network kill-port
	npm install
	$(MAKE) up
	$(MAKE) db-push

clean: 
	docker compose down -v
	docker rmi $(IMAGE) || true

build: ensure-network kill-port
	docker compose build

dev: kill-port
	docker compose up -d db
	npm run dev -- --port $(PORT)

up: ensure-network kill-port
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

db-push:
	docker compose exec app npx prisma db push

db-migrate:
	docker compose exec app npx prisma migrate dev

db-studio:
	docker compose exec -it app npx prisma studio --port 5555 --browser none

db-seed:
	docker compose exec app npx prisma db seed

db-reset:
	npx prisma db push --force-reset
	rm -rf public/uploads/*

logs:
	docker compose logs -f app

help:
	@echo "  setup        - Full install and docker setup"
	@echo "  clean        - Remove all Docker artifacts"
	@echo "  build        - Build Docker images"
	@echo "  dev          - Run Next.js dev server on PORT"
	@echo "  up           - Start services in Docker"
	@echo "  down         - Stop services"
	@echo "  kill-port    - Forcefully free up the current PORT"
	@echo "  db-push      - Sync DB schema"
	@echo "  logs         - Follow app logs"
