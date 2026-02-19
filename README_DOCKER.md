# Satchi Deployment Guide (Docker)

This guide explains how to deploy the Satchi application using Docker.

## Prerequisites
- Docker
- Docker Compose

## Quick Start

1. **Build and Run**
   ```bash
   docker compose up --build -d
   ```

2. **Access the Application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

## First-Time Setup

If this is a fresh installation, you need to set up the database:

1. **Run Migrations**
   ```bash
   docker compose exec backend python manage.py migrate
   ```

2. **Create Superuser**
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

## Development Workflow (Hot Reloading)

If you are actively coding and don't want to rebuild every time:

1. **Run in Dev Mode**:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```
   This enables "Hot Reloading" — changes to your code will instantly reflect in the app without restarting.

2. **Access Points (Different Ports)**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## Database Management

### Backup Database
To dump the entire PostgreSQL database to a file:
```bash
docker compose exec -t db pg_dump -U satchi satchi > satchi_backup.sql
```

### Restore Database
To restore from a backup file:
```bash
cat satchi_backup.sql | docker compose exec -T db psql -U satchi satchi
```

### Access Database Shell
```bash
docker compose exec db psql -U satchi satchi
```

## User Management

### List All Users
To see a quick list of users and their emails:
```bash
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print('\n'.join([f'{u.id}: {u.email} (Superuser: {u.is_superuser})' for u in User.objects.all()]))"
```

### Change User Password
```bash
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; u = get_user_model().objects.get(email='USER_EMAIL'); u.set_password('NEW_PASSWORD'); u.save()"
```

### Update User Role (e.g., to SUPERADMIN)
```bash
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; u = get_user_model().objects.get(email='USER_EMAIL'); u.role = 'SUPERADMIN'; u.is_staff = True; u.is_superuser = True; u.save()"
```



docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; u = get_user_model().objects.get(email='USER_EMAIL'); u.role = 'SUPERADMIN'; u.is_staff = True; u.is_superuser = True; u.save()"
```

## College Server Deployment

### 1. Transfer Files
Copy the entire project folder to your server using `scp` or `git clone`.
Example:
```bash
scp -r /path/to/satchi user@your-server-ip:/home/user/
```

### 2. Run Deployment Script
I have included a helper script `deploy.sh`.
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Verification
Access the application at `http://your-server-ip`.

## Troubleshooting


- **500 Internal Server Error**: Often caused by missing database tables. Run `migrate` command above.
- **Login Failed**: Ensure you have created a superuser or the user exists in the new database.
- **Build Errors on Linux**: Ensure you are using the latest code which fixes case-sensitivity issues.
