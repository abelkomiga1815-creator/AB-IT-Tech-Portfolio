# Architecture

```
Browser ──► Next.js (SSR public pages, client-side admin) ──► Django REST API ──► PostgreSQL
                                                          └──► Media storage (local disk or S3)
```

## Backend apps

| App | Responsibility |
| --- | --- |
| `core` | Shared building blocks: permissions (`IsPortfolioAdmin`), pagination, throttles, exception handler, upload validators, file-cleanup signals, `ActivityLog`, dashboard + health endpoints, `seed_demo_data` command |
| `accounts` | Custom `User` model (created before the first migration), JWT login/refresh/logout/me, `create_portfolio_admin` command |
| `categories` | `Category` model, public listing, admin CRUD with delete protection |
| `projects` | `Project` and `Technology` models, public read-only API, admin CRUD + publish/unpublish/reorder |
| `gallery` | `ProjectImage` model and admin upload / edit / replace / delete / reorder endpoints (the brief's "media" app) |

Key decisions:

- **Draft safety:** the public viewset's queryset is `Project.objects.published()`; drafts are not reachable through any public URL.
- **Separation:** public viewsets are read-only and unauthenticated; every admin route requires an active staff JWT.
- **Files:** upload paths are random UUIDs (no user-supplied filenames), validated for size, extension and real image format (SVG is rejected). Replaced or deleted files are removed after the DB transaction commits.
- **Storage:** Django's `STORAGES` setting selects local disk or S3 (`USE_S3`), no code change needed.
- **Slugs:** generated from titles, unique, and editable by admins.
- **Pagination / filtering:** DRF page-number pagination, `django-filter` for category/technology/featured/status, `SearchFilter` for text search, `OrderingFilter` for sorting.

## Frontend structure

```
src/app/(site)/   public pages (home, projects, projects/[slug], about, contact)
src/app/admin/    dashboard, projects, project editor, preview, categories, login
src/components/   ui primitives and site chrome
src/features/     auth, admin, projects, home feature modules
src/lib/api/      centralised API client (token refresh, error normalisation), public + admin calls
src/hooks, src/types, src/utils
```

- Public pages are server-rendered with live data (`cache: "no-store"`), so unpublishing takes effect immediately.
- The admin area is a client-side app behind an `AuthProvider`; the API enforces permissions regardless of what the browser does.
- Browser calls use `NEXT_PUBLIC_API_BASE_URL`. Server-side rendering may use `API_INTERNAL_BASE_URL` (used in Docker).
