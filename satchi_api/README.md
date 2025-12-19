# Satchi API Deployment Guide

## Prerequisites
- Python 3.11+
- pip or pipx
- PostgreSQL 14+ for production parity (SQLite remains available for local prototyping)

## Environment Setup
1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` values for your environment. The default template targets the local Postgres instance described below. Use `DJANGO_DEBUG=False` once you deploy.

## Database Configuration
- Default development now targets PostgreSQL for parity with production. Install and start the server, then create a database and user:
  ```bash
  createuser --interactive --pwprompt satchi
  createdb -O satchi satchi
  ```
- Update `.env` with a Postgres URL similar to:
  ```
  DATABASE_URL=postgres://satchi:strong-password@localhost:5432/satchi
  ```
- If you prefer to prototype quickly without Postgres, swap to SQLite by setting `DATABASE_URL=sqlite:///db.sqlite3`.

### Migrating existing SQLite data to PostgreSQL
1. Ensure the new Postgres database is empty.
2. Dump the SQLite data:
   ```bash
   python manage.py dumpdata --natural-primary --natural-foreign --exclude auth.permission --exclude contenttypes > data.json
   ```
3. Point `DATABASE_URL` to your Postgres instance and run migrations:
   ```bash
   python manage.py migrate --noinput
   ```
4. Load the serialized data:
   ```bash
   python manage.py loaddata data.json
   rm data.json
   ```
5. Run tests or smoke checks (`python manage.py test`) to validate the migration.

## Running the Server
- Development server:
  ```bash
  python manage.py runserver
  ```
- Collect static files before production deployment:
  ```bash
  python manage.py collectstatic --noinput
  ```
- Recommended production entrypoint:
  ```bash
  gunicorn backend.wsgi:application --bind 0.0.0.0:8000
  ```

## Deployment Checklist
- `DJANGO_DEBUG` set to `False` and `DJANGO_ALLOWED_HOSTS` configured.
- HTTPS enforced (`DJANGO_SECURE_SSL_REDIRECT`, HSTS flags) when TLS is terminated upstream.
- `collectstatic` executed and static files served via WhiteNoise or your hosting provider.
- Database credentials, secret key, and tokens managed by your platform (env vars, secret store).
- Monitoring/logging configured (e.g. Sentry, structured logs, health checks).

## Testing
Always run the Django test suite before and after configuration changes:
```bash
python manage.py test
```
