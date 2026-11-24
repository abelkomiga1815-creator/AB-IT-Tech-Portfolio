# Delivery report

## Overview
AB IT Tech Solution Portfolio Management System: independent Django + Next.js application with a public showcase and an administrator dashboard. Public data always comes from the real backend database; no mock data is used (optional `seed_demo_data` content is clearly labelled "DEMO DATA").

## Implemented
- Public: homepage (hero, featured projects, categories, capabilities, CTA), projects page (search, category and technology filters, pagination, URL-synced state), project details (`/projects/<slug>` with SEO metadata, objectives, problem, solution, technologies, gallery lightbox, links, related projects), about, contact (configurable details only).
- Admin: login/logout, protected routes, dashboard statistics and recent activity, project create / edit / delete / preview / save draft / publish / unpublish / feature / reorder, category management (delete protected), cover and multi-image uploads with replace, delete, captions, alt text and ordering.
- API: `/api/v1/` public + admin endpoints, JWT auth with refresh rotation and blacklist, OpenAPI with Swagger UI and ReDoc.
- Security: env secrets, hashing, permissions, CORS allow-list, upload validation, rate limiting, production hardening flags.
- Infrastructure: Dockerfiles, Docker Compose, nginx reference, PostgreSQL setup script, Makefile, S3-capable storage switch.

## Stack
Next.js 15, React 19, TypeScript, Tailwind CSS 3, Framer Motion, Lucide; Django 5.1, DRF, django-filter, Pillow, drf-spectacular, SimpleJWT; PostgreSQL 16; Docker. Versions are pinned in `package.json` and `requirements.txt`.

## Test status (honest report)
| Category | Status |
| --- | --- |
| Executed successfully in the generation environment | Python syntax compilation of every backend file; a script that checked every local Python import/name and every frontend `@/` and relative import resolve to existing files; a TypeScript syntax scan of all frontend files (no syntax errors) |
| Written but NOT executed | All backend tests (about 90 cases in `accounts`, `categories`, `projects`, `gallery`, `core`) and all frontend tests (vitest: API client, formatters, ProjectCard, LoginForm, ProjectsExplorer) |
| External dependencies not available | PostgreSQL server, Django/DRF packages and the npm registry (no network) - so migrations, the test suites, `tsc` type-check, `next build` and `docker compose` were never run here |

Migrations were hand-written; run `python manage.py makemigrations --check --dry-run` first. Because nothing was executed against real dependencies, expect to fix a few small errors on the first run.

## Known limitations
- JWTs are stored in `localStorage` (see `docs/SECURITY.md`).
- Admin project list shows up to 100 projects at once (reordering is only offered when all fit and no filter is active).
- No contact form backend (contact is via configured email/phone, intentionally nothing invented).
- Logo is a temporary text mark; company name defaults to "AB IT Tech Solution" (configurable).
- Rate-limit counters are per-process with the default cache; use Redis for multi-worker deployments.

## Setup
See `README.md`.
