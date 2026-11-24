# Database design (PostgreSQL)

```
accounts_user 1───* projects_project (created_by, SET NULL)
categories_category 1───* projects_project (category, PROTECT)
projects_project *───* projects_technology
projects_project 1───* gallery_projectimage (CASCADE)
accounts_user 1───* core_activitylog (actor, SET NULL)
```

| Table | Notable columns |
| --- | --- |
| `accounts_user` | Django `AbstractUser` + unique `email` |
| `categories_category` | `name` (unique), `slug` (unique), `description`, `display_order` |
| `projects_technology` | `name` (unique), `slug` (unique) |
| `projects_project` | `title`, `slug` (unique), `short_description`, `description`, `objectives`, `problem_statement`, `solution`, `cover_image`, `cover_alt`, `category_id`, `project_status` (completed / in_progress / maintenance / concept), `publication_status` (draft / published, indexed), `is_featured`, `live_demo_url`, `source_code_url`, `client_name`, `completion_date`, `seo_title`, `seo_description`, `display_order` (indexed), `published_at`, `created_by_id`, timestamps |
| `gallery_projectimage` | `project_id`, `image`, `caption`, `alt_text`, `order` |
| `core_activitylog` | `actor_id`, `action`, `target_type`, `target_id`, `target_label`, `created_at` |

Rules: deleting a category that still has projects is blocked (`PROTECT`, surfaced as HTTP 409). Deleting a project cascades to its gallery rows and removes the files.

Migrations live in each app's `migrations/` folder. They were **written by hand** (Django was not installable in the generation environment). Verify there is no drift on your machine:

```bash
python manage.py makemigrations --check --dry-run
```

If it reports changes, run `python manage.py makemigrations` and commit the result.
