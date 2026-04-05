#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env.prod}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/postgres_backups}"

cd "$PROJECT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE"
  echo "Copy .env.prod.example to .env.prod and fill in the real secrets first."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

required_vars=(
  DJANGO_SECRET_KEY
  DJANGO_ALLOWED_HOSTS
  DATABASE_URL
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  VITE_API_URL
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Required variable $var_name is not set in $ENV_FILE"
    exit 1
  fi
done

if [[ "$DJANGO_SECRET_KEY" == "replace-with-a-generated-secret-key" ]]; then
  echo "DJANGO_SECRET_KEY is still using the placeholder value."
  exit 1
fi

if [[ "$POSTGRES_PASSWORD" == "replace-with-a-strong-db-password" ]]; then
  echo "POSTGRES_PASSWORD is still using the placeholder value."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

compose() {
  docker compose --env-file "$ENV_FILE" "$@"
}

check_health() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS http://127.0.0.1/api/health/ >/dev/null
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO- http://127.0.0.1/api/health/ >/dev/null
    return
  fi

  echo "Neither curl nor wget is available for the final health check."
  return 1
}

wait_for_db() {
  local retries=30
  until compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
    retries=$((retries - 1))
    if [[ "$retries" -le 0 ]]; then
      echo "Database did not become ready in time."
      exit 1
    fi
    sleep 2
  done
}

echo "Building updated images..."
compose build backend frontend

echo "Starting PostgreSQL..."
compose up -d db
wait_for_db

backup_file="$BACKUP_DIR/predeploy_$(date +%Y%m%d_%H%M%S).sql"
echo "Creating pre-deploy backup at $backup_file ..."
compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_file"

echo "Running Django production checks..."
compose run --rm backend python manage.py check --deploy

echo "Applying migrations..."
compose run --rm backend python manage.py migrate --noinput

echo "Collecting static assets..."
compose run --rm backend python manage.py collectstatic --noinput

echo "Starting application services..."
compose up -d backend frontend

echo "Waiting for backend health endpoint..."
for _ in {1..30}; do
  if check_health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! check_health >/dev/null 2>&1; then
  echo "Backend health check failed. Review logs with:"
  echo "docker compose --env-file $ENV_FILE logs --tail=200 backend frontend db"
  exit 1
fi

echo
echo "Deployment completed successfully."
echo "Local health endpoint: http://127.0.0.1/api/health/"
echo "Public site: https://gyan.cb.amrita.edu/"
