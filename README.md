# medisp-image-lab

Training app: a beginner-friendly Django + React project that combines image processing with authentication, user settings, testing, and local developer tooling.

## What this app does

- Login with username/password
- Keep authenticated state using DRF token auth
- Open **User Settings** from the top-right area
- View user info (`username`, `email`, `last_login`)
- Edit `first_name` / `last_name`
- Toggle theme and font size from the main page (auto-saved)
- Upload an image and convert it to grayscale via backend API
- Display original and processed images side-by-side

## Tech stack

- Backend: Django, Django REST Framework, DRF Token Auth, Pillow
- Frontend: React (CRA), local CSS styling
- Database: SQLite (default)

## Project structure

- `backend/`: Django + DRF API
- `frontend/`: React app
- `Day_4.md`: Day 4 lesson notes (testing, Docker, pre-commit, Makefile)

## API endpoints

- `GET /api/health/` -> `{"status": "ok"}`
- `POST /api/login/` -> returns auth token
- `POST /api/logout/` -> invalidates current token
- `GET /api/me/` -> current authenticated user
- `PATCH /api/me/` -> updates only `first_name` and `last_name`
- `GET /api/profile/` -> current user's profile preferences
- `PATCH /api/profile/` -> updates `theme` and `font_size`
- `POST /api/process-image/` -> grayscale conversion

## One-time local setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
pre-commit install
```

Use the existing backend environment from the earlier lessons. For example, if you need to activate it manually, use `source ~/.venvs/medisp-image-lab/bin/activate`.

`pre-commit` is installed as part of `backend/requirements.txt`, so a fresh machine just needs the existing virtualenv + `pip install -r requirements.txt` step before installing the hooks.

For this project, `pre-commit` runs on the host machine in the backend environment, not inside Docker.

### Frontend

```bash
cd frontend
npm install
```

## Run locally (without Docker)

### Backend

```bash
cd backend
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm start
```

## Day 4 additions

Day 4 now includes:

- backend testing
- Docker setup
- pre-commit hooks (`black`, `isort`, `flake8`)
- Makefile automation

See [Day_4.md](./Day_4.md).

## Useful commands

```bash
python manage.py test
coverage run manage.py test
coverage report
pre-commit install
pre-commit run --all-files
docker compose up --build
docker compose down
make
make install
make build
make run
make test
make lint
```

`make` shows the available targets. `make install` installs backend dependencies, installs the frontend packages, and sets up the `pre-commit` hooks using the existing backend environment.
