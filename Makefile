SHELL := /bin/bash
PRE_COMMIT_HOME := ./.pre-commit-cache
.DEFAULT_GOAL := help

help:
	@echo "Available targets:"
	@echo "  install       Install backend deps, frontend packages, and pre-commit hooks"
	@echo "  build         Build Docker images"
	@echo "  run           Start the app with Docker Compose"
	@echo "  down          Stop Docker Compose services"
	@echo "  test          Run backend tests"
	@echo "  lint          Run pre-commit checks on all files"
	@echo "  logs-backend  Show backend container logs"
	@echo "  logs-frontend Show frontend container logs"

install:
	# Host setup: active backend environment, frontend packages, and pre-commit hooks
	cd backend && python -m pip install -r requirements.txt
	cd frontend && npm install
	cd backend && pre-commit install

build:
	docker compose build

run:
	docker compose up --build

down:
	docker compose down

test:
	cd backend && python manage.py test

lint:
	cd backend && pre-commit run --all-files

logs-backend:
	docker compose logs backend

logs-frontend:
	docker compose logs frontend
