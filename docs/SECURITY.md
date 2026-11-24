# Security

| Area | Implementation |
| --- | --- |
| Secrets | All secrets come from environment variables; `.env` is git-ignored; `.env.example` has placeholders only. The app refuses to start without `DJANGO_SECRET_KEY` unless `DJANGO_DEBUG=True`. |
| Passwords | Django PBKDF2 hashing, minimum length 10, common/numeric/similarity validators. |
| Authentication | SimpleJWT: 15-minute access tokens, 7-day rotating refresh tokens with blacklist on rotation and logout. Only active `is_staff` users can log in. No public registration endpoint exists. |
| Authorisation | `IsPortfolioAdmin` on every admin endpoint (401 anonymous, 403 non-staff). Public endpoints are read-only and only expose published content. |
| Rate limiting | Login/refresh (`THROTTLE_LOGIN`), image-upload writes (`THROTTLE_UPLOAD`), plus global anon/user limits. |
| Uploads | Max size, extension allow-list, Pillow format verification, random filenames, SVG rejected, per-request and per-project limits. |
| CORS / CSRF | Explicit CORS origin allow-list, no credentials; CSRF middleware active (JWT in the Authorization header is not CSRF-exposed; Django admin uses sessions + CSRF). |
| Production headers | HTTPS redirect, secure cookies, HSTS, nosniff, `X-Frame-Options: DENY` by default when `DJANGO_DEBUG=False`. The frontend adds nosniff, frame-deny, referrer and permissions policies. |
| Errors | Unhandled exceptions return a generic 500 JSON body when debug is off and are logged server-side. |
| Content | Project text is rendered as plain text (no HTML injection). Links are limited to valid URLs. |

## Known limitations

- Access/refresh tokens are kept in `localStorage` for simplicity. An XSS bug would expose them; the app renders no user HTML and short access-token lifetimes limit exposure. Moving to httpOnly cookies is a recommended hardening step.
- The frontend does not set a Content-Security-Policy; add one at your proxy once your final asset hosts are known.
- Django's admin site is available at `/django-admin/`; restrict or disable it in production if unused.
