# Satchi Production Deployment Walkthrough

This guide is for deploying Satchi on the college server at `172.17.9.96` under `https://gyan.cb.amrita.edu/`.

## Production readiness checklist

1. Use PostgreSQL only in production. Do not deploy with SQLite.
2. Keep secrets only in `.env.prod`, which is gitignored.
3. Ensure `https://gyan.cb.amrita.edu/` forwards traffic to this host and preserves the `X-Forwarded-Proto` header when TLS is terminated upstream.
4. Always take a database backup before migrations. `deploy.sh` now does this automatically.
5. Never edit or delete old migration files after the site has been deployed.

## Files you must review before the first deploy

- `.env.prod`
- `docker-compose.yml`
- `nginx/nginx.conf`
- `deploy.sh`

## 1. Prepare the server

SSH into the server:

```bash
ssh amrita@172.17.9.96
```

Make sure Docker and the Docker Compose plugin are available:

```bash
docker --version
docker compose version
```

If Docker requires sudo on this host, either use `sudo` for the commands below or add the user to the Docker group once and re-login.

## 2. Copy the project

Either clone the repository on the server or copy the project directory.

```bash
git clone <your-repo-url> satchi
cd satchi
```

## 3. Create the production environment file

The repo includes `.env.prod.example` as the template. Copy it and then edit the real values:

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Generate a strong app secret without needing Django installed yet:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Generate a strong database password using URL-safe characters:

```bash
python3 -c "import secrets, string; chars = string.ascii_letters + string.digits; print(''.join(secrets.choice(chars) for _ in range(32)))"
```

Update at least these values in `.env.prod`:

- `DJANGO_SECRET_KEY`: paste the output of the first command
- `POSTGRES_PASSWORD`: paste the output of the second command
- `DATABASE_URL`: use the same password in `postgres://satchi:YOUR_PASSWORD@db:5432/satchi`
- `VITE_API_URL`

`db` is the Docker Compose service name from `docker-compose.yml`, so keep that hostname as-is in `DATABASE_URL`.

For this deployment, `VITE_API_URL` should stay:

```bash
VITE_API_URL=https://gyan.cb.amrita.edu/api
```

## 4. First deployment

Make the script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

What the script does:

1. Builds the backend and frontend images.
2. Starts PostgreSQL and waits for readiness.
3. Takes a pre-deploy SQL backup into `postgres_backups/`.
4. Runs `python manage.py check --deploy`.
5. Applies migrations.
6. Collects static files.
7. Starts the backend and frontend containers.
8. Verifies the backend through `http://127.0.0.1/api/health/`.

## 5. Verify the deployment

Check container status:

```bash
docker compose --env-file .env.prod ps
```

Check the backend health endpoint:

```bash
curl http://127.0.0.1/api/health/
```

Check logs if anything looks wrong:

```bash
docker compose --env-file .env.prod logs --tail=200 backend frontend db
```

Then open:

```text
https://gyan.cb.amrita.edu/
```

## 6. Create the first admin user

```bash
docker compose --env-file .env.prod exec backend python manage.py createsuperuser
```

The Django admin will be available at:

```text
https://gyan.cb.amrita.edu/admin/
```

## 7. Safe redeploy procedure

Use this same flow for every future release:

```bash
git pull
./deploy.sh
```

Why this is safer:

- The PostgreSQL data lives in the named Docker volume `postgres_data`.
- A fresh SQL backup is taken before each deployment.
- Migrations run before the new app version is considered healthy.
- The backend is not exposed publicly on port `8000`.

## 8. Database safety rules

Follow these rules to avoid database issues now and later:

1. Never run production on `db.sqlite3`.
2. Never delete or rewrite applied migration files.
3. Always generate migrations in development and commit them before deploy:

```bash
python satchi_api/manage.py makemigrations
python satchi_api/manage.py migrate
```

4. Before every deploy with schema changes, make sure `deploy.sh` completes its backup step successfully.
5. If a migration is large or destructive, test it on a copy of the production backup first.
6. Keep at least one off-server copy of the latest SQL dump.
7. Do not change `POSTGRES_DB`, `POSTGRES_USER`, or `POSTGRES_PASSWORD` on a live PostgreSQL volume unless you intentionally plan the credential rotation.

## 9. Manual backup and restore

Manual backup:

```bash
mkdir -p postgres_backups
set -a && source .env.prod && set +a
docker compose --env-file .env.prod exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > postgres_backups/manual_$(date +%F_%H%M%S).sql
```

Manual restore:

```bash
set -a && source .env.prod && set +a
cat postgres_backups/your_backup.sql | docker compose --env-file .env.prod exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

If you want safer retention, compress backups:

```bash
set -a && source .env.prod && set +a
docker compose --env-file .env.prod exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > postgres_backups/manual_$(date +%F_%H%M%S).sql.gz
```

## 10. Optional daily backup cron

If you want recurring backups on the server, add a cron job:

```bash
crontab -e
```

Example daily 2 AM backup:

```cron
0 2 * * * cd /home/amrita/satchi && set -a && . ./.env.prod && set +a && /usr/bin/docker compose --env-file .env.prod exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > /home/amrita/satchi/postgres_backups/nightly_$(date +\%F).sql.gz
```

## 11. Troubleshooting

`python manage.py check --deploy` fails:
Fill all production variables in `.env.prod` and make sure the domain and trusted origins are correct.

Migrations fail:
Inspect the latest backup in `postgres_backups/`, review the error, and do not continue with repeated retries until you know whether the schema or migration files need correction.

Frontend loads but API calls fail:
Check `VITE_API_URL`, confirm `nginx/nginx.conf` is mounted, and test `curl http://127.0.0.1/api/health/`.

Public domain works over HTTPS but Django still behaves as HTTP:
Make sure the upstream reverse proxy forwards `X-Forwarded-Proto: https`.
