# Deployment Guide for Satchi

This project has been containerized using Docker. Follow these steps to deploy it on your Linux server.

## Prerequisites

- Docker
- Docker Compose

## Structure

- **Backend**: Django (served by Gunicorn)
- **Frontend**: React (served by Nginx)
- **Database**: PostgreSQL

## Deployment Steps

1.  **Clone/Copy the repository** to your server.
2.  **Navigate to the project root**:
    ```bash
    cd satchi
    ```
3.  **Build and Start Containers**:
    ```bash
    docker compose up --build -d
    ```
4.  **Run Database Migrations** (First time only):
    ```bash
    docker compose exec backend python manage.py migrate
    ```
5.  **Create Superuser** (Optional, for Admin access):
    ```bash
    docker compose exec backend python manage.py createsuperuser
    ```

## Accessing the Application

- **Frontend**: `http://localhost` (or your server's IP)
- **Backend API**: `http://localhost:8000` (or your server's IP:8000)

## Configuration

- **Environment Variables**: Check `docker-compose.yml` to adjust secrets, debug mode, and database credentials for production.
- **Allowed Hosts**: Update `DJANGO_ALLOWED_HOSTS` in `docker-compose.yml` to include your server's domain/IP.
