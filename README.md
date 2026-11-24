# AB IT Tech Solution - Portfolio Management System

A complete, independent full-stack portfolio platform: a public website that showcases projects and an administrator dashboard that manages every piece of content without touching source code.

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** Python 3.12, Django 5.1, Django REST Framework, django-filter, Pillow, drf-spectacular, SimpleJWT
- **Database:** PostgreSQL 16
- **Storage:** local media in development; S3-compatible storage via `USE_S3=True`
- **Deployment prep:** Docker, Docker Compose, environment-based configuration, nginx reference config

The public REST API (`/api/v1/`) is designed so the AB IT Tech Corporate Website can integrate with it later. The portfolio does **not** depend on any other AB IT Tech application.

## Folder structure

```text
ab-it-tech-portfolio/
├── backend/            Django project (config, core, accounts, categories, projects, gallery)
├── frontend/           Next.js application (src/app, components, features, hooks, lib, types, utils)
├── docs/               Architecture, database, API, setup, deployment, security, testing, delivery report
├── infrastructure/     nginx reference config, PostgreSQL setup script
├── docker-compose.yml  db + backend + frontend
├── .env.example        Backend / compose configuration template (placeholders only)
└── Makefile            Shortcuts for common commands
```

The "media" app suggested in the brief is named `gallery` (to avoid clashing with Django's `MEDIA_ROOT` folder). `docs/ARCHITECTURE.md` explains the layout.

## Prerequisites (Linux / Kali)

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip postgresql postgresql-contrib libpq-dev curl git
# Node.js 20+ (22 recommended). If `node --version` is older, install from https://nodejs.org or use nvm.
node --version && npm --version
```

## 1. Configure environment

```bash
cd ab-it-tech-portfolio
cp .env.example .env
# Edit .env: set DJANGO_SECRET_KEY and POSTGRES_PASSWORD (placeholders only in the template)
python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # handy secret key generator
cp frontend/.env.local.example frontend/.env.local
```

## 2. PostgreSQL setup

```bash
sudo systemctl enable --now postgresql
DB_PASSWORD='the-same-password-as-POSTGRES_PASSWORD' ./infrastructure/scripts/setup-postgres.sh
```

The script creates the role and database from your `.env` names (defaults `ab_portfolio`) and grants `CREATEDB`, which Django needs to create its temporary test database.

## 3. Backend (Django API on port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser          # creates the first administrator (is_staff + superuser)
python manage.py seed_demo_data           # OPTIONAL: clearly-labelled demo content (remove with --clear)
python manage.py runserver 0.0.0.0:8000
```

- API root: <http://localhost:8000/api/v1/>
- Swagger UI: <http://localhost:8000/api/docs/> - ReDoc: <http://localhost:8000/api/redoc/> - OpenAPI: `/api/schema/`
- Health check: <http://localhost:8000/api/v1/health/>

There is **no public admin registration**. Administrators are created only with `createsuperuser` or the non-interactive helper:

```bash
ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='a-strong-password' python manage.py create_portfolio_admin
```

## 4. Frontend (Next.js on port 3000)

```bash
cd frontend
npm install
npm run dev
```

- Public site: <http://localhost:3000>
- Admin dashboard: <http://localhost:3000/admin> (sign in with the administrator you created)

## 5. Running the tests

```bash
# Backend (needs PostgreSQL running and the role created with CREATEDB)
cd backend && source .venv/bin/activate
python manage.py test --settings=config.test_settings -v 2

# Frontend
cd frontend
npm run typecheck
npm test
npm run lint
```

See `docs/TESTING.md` for the manual end-to-end integration test plan.

## 6. Docker

```bash
cp .env.example .env     # set DJANGO_SECRET_KEY and POSTGRES_PASSWORD
docker compose up --build
# create the first administrator inside the running stack:
docker compose exec backend python manage.py createsuperuser
```

Frontend: <http://localhost:3000> - API: <http://localhost:8000/api/v1/> - Docs: <http://localhost:8000/api/docs/>

## Environment variables

Every variable is documented inline in `.env.example` (Django, PostgreSQL, media, S3, JWT lifetimes, rate limits, proxy settings) and `frontend/.env.local.example` (API URL, company name, optional contact details). Contact details are never invented: leave them empty and the site shows nothing in their place.

## Deployment

See `docs/DEPLOYMENT.md` (production settings, HTTPS, nginx, S3 storage, backups) and `docs/SECURITY.md`.

## Branding

The logo is a **temporary text-based mark** (`frontend/src/components/site/Logo.tsx`). Replace that single component when the official logo file is available. The company name is configurable with `NEXT_PUBLIC_COMPANY_NAME`.
