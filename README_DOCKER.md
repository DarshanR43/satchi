# Satchi Docker Guide

For the production deployment process, use `walkthrough.md`.

The authoritative flow is:

```bash
cp .env.prod.example .env.prod
chmod +x deploy.sh
./deploy.sh
```

Key production notes:

- PostgreSQL is the only supported production database.
- `.env.prod` must stay uncommitted.
- The frontend is served through Nginx and proxies API traffic through `/api/`.
- A SQL backup is taken before each deployment by `deploy.sh`.
