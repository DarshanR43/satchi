#!/bin/bash

# Deployment Script for Satchi Project

echo "Starting Deployment..."

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# 2. Build and Start Containers
echo "Building and starting containers..."
docker compose down
docker compose up --build -d

# 3. Apply Migrations
echo "Applying database migrations..."
docker compose exec backend python manage.py migrate

# 4. Create Superuser (Optional - skip if already exists)
# echo "Creating superuser..."
# docker compose exec backend python manage.py createsuperuser

echo "Deployment Complete!"
echo "Frontend: http://localhost (or server IP)"
echo "Backend: http://localhost:8000 (or server IP:8000)"
