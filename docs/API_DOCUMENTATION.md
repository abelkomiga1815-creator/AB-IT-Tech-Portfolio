# API documentation

Base URL: `/api/v1/`. Interactive docs: `/api/docs/` (Swagger UI), `/api/redoc/`, schema `/api/schema/`.
Lists use `{count, next, previous, results}`. Errors use DRF format: `{"field": ["message"]}` or `{"detail": "message"}`.

## Public (no authentication, published projects only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/projects/` | Query: `page`, `page_size` (max 100), `search`, `category` (slug), `technology` (slug), `featured` (bool), `status`, `ordering` (`display_order`, `created_at`, `published_at`, `completion_date`, `title`, prefix `-` to reverse) |
| GET | `/projects/featured/` | Plain array. `limit` (default 6, max 12) |
| GET | `/projects/{slug}/` | Full detail: objectives, problem, solution, links, gallery `images`, `related_projects` |
| GET | `/categories/` | Categories with at least one published project, with `project_count` |
| GET | `/technologies/` | Technologies used by published projects |
| GET | `/health/` | Liveness + DB check |

## Authentication

| Method | Path | Body |
| --- | --- | --- |
| POST | `/auth/login/` | `{username, password}` -> `{access, refresh, user}` (staff only, rate limited) |
| POST | `/auth/refresh/` | `{refresh}` -> `{access, refresh}` (refresh tokens rotate; old ones are blacklisted) |
| POST | `/auth/logout/` | `{refresh}` -> 204 (blacklists the token) |
| GET | `/auth/me/` | Current staff user |

Send `Authorization: Bearer <access>` on admin calls.

## Admin (active staff only; 401 anonymous, 403 non-staff)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/dashboard/` | Stats, recent projects, recent activity |
| GET/POST | `/admin/projects/` | List (filters: `search`, `publication_status`, `category` id, `featured`, `technology`, `status`, `ordering`) / create. JSON or multipart (`cover_image`) |
| GET/PUT/PATCH/DELETE | `/admin/projects/{id}/` | `technologies` accepts a list or comma-separated string; `remove_cover_image=true` clears the cover |
| POST | `/admin/projects/{id}/publish/` | 400 if short/full description is missing |
| POST | `/admin/projects/{id}/unpublish/` | Returns the project to draft |
| POST | `/admin/projects/reorder/` | `{ids: [..]}` assigns `display_order` 1..n in that order |
| GET/POST | `/admin/categories/` | Not paginated |
| GET/PUT/PATCH/DELETE | `/admin/categories/{id}/` | Delete returns 409 while projects use it |
| GET/POST | `/admin/projects/{id}/images/` | POST multipart: `images` (one or many files), optional `caption`, `alt_text` |
| PATCH/DELETE | `/admin/images/{id}/` | Edit `caption`, `alt_text`, `order`, or replace the file with multipart `image` |
| POST | `/admin/projects/{id}/images/reorder/` | `{ids: [..]}` must list every image of the project |

Upload limits (configurable): 5 MB per image, JPEG/PNG/WebP/GIF only, 10 files per request, 20 gallery images per project.
