# Day 4 - Backend Testing, Docker, and Developer Tooling

## Learning goals

By the end of Day 4, students should be able to:

- explain backend API testing basics
- run Django tests and coverage
- explain what pre-commit is and why teams use it
- explain code formatting and linting
- run this project with Docker Compose
- use a Makefile to automate common commands

## What is testing?

Testing means writing small checks that verify code behavior.

In backend APIs, tests help us confirm:

- login works correctly
- protected endpoints are actually protected
- user updates save the right fields
- API responses stay stable as the project grows

## Why backend testing matters

Backend bugs can be hard to spot manually. Tests give us confidence when we refactor.

## DRF testing with `APITestCase`

`APITestCase` gives us:

- an isolated test database
- an API-friendly client
- easy JSON request/response assertions

In this project we also use:

- `APIClient` for token-auth request flows
- `force_authenticate` for focused authenticated tests

## Run backend tests

From `backend/`:

```bash
python manage.py test
coverage run manage.py tes
coverage report
```

## Health check endpoint

- `GET /api/health/`

Expected response:

```json
{
  "status": "ok"
}
```

## What is Docker?

Docker packages code and dependencies into containers so everyone runs the same environment.

If you are on a fresh Ubuntu installation, Docker is probably not installed yet. Before you can run this project with Docker Compose, install Docker Engine and the Compose plugin first.

### Install Docker on Ubuntu

Use the seminar-friendly Ubuntu package install instead of Docker's official repository setup:

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2
sudo usermod -aG docker $USER
```

After that, restart your computer, so the new group membership takes effect.

Verify the installation:

```bash
docker --version
docker compose version
docker run hello-world
```

## Why Docker helps developers

- fewer machine-specific setup issues
- easier onboarding
- repeatable local development

## Run this project with Docker Compose

After Docker is installed, run these commands from the project root:

```bash
docker compose up --build
docker compose down
docker compose logs backend
docker compose logs frontend
```

## What is pre-commit?

`pre-commit` runs automated checks before commits.

For this workshop, we keep `pre-commit` on the **host machine** in the backend Python virtualenv, not inside Docker, so students can run the hooks directly in their local git checkout.

In this project it runs:

- `black` for formatting Python code
- `isort` for sorting imports
- `flake8` for lint checks

Install the backend dependencies — this also installs `pre-commit` because it is pinned in `backend/requirements.txt`:

```bash
cd backend
pip install -r requirements.txt
```

Install hooks once:

```bash
pre-commit install
```

Run checks manually on all files:

```bash
pre-commit run --all-files
```

## Why teams use automated checks

- consistent style across contributors
- fewer small review comments
- catches simple issues early

## Code formatting vs linting

- Formatting (`black`, `isort`): changes code style automatically.
- Linting (`flake8`): reports potential quality/style issues.

## What is a Makefile?

A Makefile is a small command launcher. It helps avoid memorizing long commands.

## Why automate repetitive commands

- faster daily workflow
- fewer command mistakes
- easier onboarding for new students

## Make commands in this project

From the project root:

```bash
make setup
make build
make run
make down
make test
make lint
make logs-backend
make logs-frontend
```

What each command does:

- `make setup`: creates backend virtualenv, installs backend/frontend dependencies, installs git hooks.
- `make build`: builds Docker images.
- `make run`: starts backend + frontend with Docker Compose.
- `make down`: stops Docker Compose services.
- `make test`: runs Django tests locally from backend virtualenv.
- `make lint`: runs `pre-commit` checks on all files.
- `make logs-backend`: shows backend container logs.
- `make logs-frontend`: shows frontend container logs.

## Homework (research only)

Do not implement these yet. Research these concepts:

- file upload
- media storage
- long-running tasks
- Celery
- Redis
- polling from frontend

## Assumptions used in Day 4

- SQLite remains the database for this lesson.
- Docker setup is intentionally minimal for teaching.
- Tooling is focused on developer workflow, not production deployment.
