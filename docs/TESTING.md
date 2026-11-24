# Testing

## Automated

```bash
# Backend (PostgreSQL required; the DB user needs CREATEDB)
cd backend && source .venv/bin/activate
python manage.py test --settings=config.test_settings -v 2

# Frontend
cd frontend && npm run typecheck && npm test && npm run lint
```

Backend coverage: authentication, token refresh/blacklist, login throttling, permissions (anonymous / non-staff / staff / deactivated), project create / edit / delete, draft visibility, publish / unpublish, validation, reorder, categories (CRUD, duplicate and delete protection, public counts), image uploads (valid, invalid, oversized, SVG, limits, replace, delete, reorder, file cleanup), public API filtering, search, pagination, ordering, featured, detail, related projects, OpenAPI endpoints, dashboard statistics and activity.

Frontend coverage: API client (query building, error mapping, token refresh), formatting utilities, project card, login form behaviour, projects explorer (load, empty, error/retry, filtering).

## Manual end-to-end integration plan

Start both servers with demo data cleared (`seed_demo_data --clear`) and a fresh administrator.

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| 1 | Administrator login | Open `/admin`, sign in with wrong then correct credentials | Wrong: error message. Correct: dashboard with zeros |
| 2 | Project creation | Create a category, then New project with title, descriptions, technologies, cover image | Project saved; redirected to the editor; gallery section available |
| 3 | Draft saving | Click **Save draft** | Status "Draft" in Projects list |
| 4 | Draft invisibility | In a private window open `/projects` and `/projects/<slug>` | Project absent; detail page shows 404. `GET /api/v1/projects/` has `count: 0` |
| 5 | Publishing | Click **Save & publish** (or Publish in the list) | Status "Published"; activity shows "Published" |
| 6 | Public API visibility | `GET /api/v1/projects/` and `/api/v1/projects/<slug>/` | Project returned with category, technologies, images |
| 7 | Frontend display | Open `/` and `/projects`; search for a word from the title; filter by category | Card appears (featured only on home if marked); search and filter work |
| 8 | Details navigation | Click the card | Detail page with sections, gallery lightbox, related projects |
| 9 | Unpublishing | Click Unpublish | Detail URL returns 404 in the private window; API no longer lists it |
| 10 | Access restrictions | Call `/api/v1/admin/projects/` without a token, then with a non-staff user token; open `/admin/projects` signed out | 401, 403, redirect to the login page |

Also check: image replacement/deletion, reordering projects and gallery images (public order follows), category deletion blocked while in use, oversized/non-image upload rejected with a clear message.
