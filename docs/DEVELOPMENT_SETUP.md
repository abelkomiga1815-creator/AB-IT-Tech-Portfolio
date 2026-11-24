# Development setup

Follow `README.md` sections 1-4 for the standard flow. Extra notes:

- **No PostgreSQL yet?** For a quick look only, set `USE_SQLITE=True` in `.env` (a convenience, not a supported production path).
- **Resetting the database:** `sudo -u postgres dropdb ab_portfolio && DB_PASSWORD=... ./infrastructure/scripts/setup-postgres.sh && python manage.py migrate`.
- **Demo data:** `python manage.py seed_demo_data` creates projects with slugs starting `demo-` and client name "DEMO DATA". Remove with `python manage.py seed_demo_data --clear`.
- **CORS errors in the browser:** add the frontend origin to `CORS_ALLOWED_ORIGINS` and restart Django.
- **Images not loading:** `MEDIA_BASE_URL` must match where Django serves `/media/` (default `http://localhost:8000/media/`) and `SERVE_MEDIA=True`.
- **Frontend env changes** (`NEXT_PUBLIC_*`) require restarting `npm run dev`.
- **Fonts:** Next.js downloads Google Fonts (Sora, Manrope, JetBrains Mono) at build/dev time, so the first run needs internet access.
