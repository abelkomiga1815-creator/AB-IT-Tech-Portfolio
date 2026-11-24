# Deployment

## Checklist

1. `DJANGO_DEBUG=False`, a unique `DJANGO_SECRET_KEY`, real `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` (https origins).
2. HTTPS in front of both apps. Set `BEHIND_PROXY=True` and `NUM_PROXIES=1` behind one reverse proxy so rate limiting sees client IPs.
3. Strong PostgreSQL credentials; the database not exposed publicly; scheduled backups (`pg_dump`) and media backups.
4. Media: either serve `/media/` from nginx (see `infrastructure/nginx/portfolio.conf`) or use S3-compatible storage:
   `USE_S3=True`, `AWS_STORAGE_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optional `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME`, `AWS_S3_CUSTOM_DOMAIN`. Set `MEDIA_BASE_URL` to the public bucket/CDN URL if needed and `SERVE_MEDIA=False`.
5. Build the frontend with production values: `NEXT_PUBLIC_API_BASE_URL=https://portfolio.example.com/api/v1`, `NEXT_PUBLIC_SITE_URL=https://portfolio.example.com` (these are compiled in at build time).
6. Create the first administrator: `python manage.py createsuperuser`.

## Docker Compose

`docker-compose.yml` runs PostgreSQL, the API (gunicorn, migrations + collectstatic on start) and the standalone Next.js server. For production put a TLS-terminating proxy in front and keep ports 8000/3000 private. The shipped compose file is a solid starting point, not a hardened orchestration setup.

## Rate limiting note

Throttle counters use Django's cache. With multiple gunicorn workers on the default local-memory cache each worker counts separately; configure a shared cache (e.g. Redis) for strict limits.

## Updating

```bash
git pull && docker compose up --build -d     # migrations run automatically on backend start
```
