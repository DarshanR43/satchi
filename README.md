# 🎓 GYAN — Project Repository & Event Registration Portal

[![Live Platform](https://img.shields.io/badge/Live%20Platform-gyan.cb.amrita.edu-blue?style=for-the-badge&logo=google-chrome&logoColor=white)](https://gyan.cb.amrita.edu)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Django%204.2%20%7C%20DRF-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Database](https://img.shields.io/badge/Database-CockroachDB%20%2F%20PostgreSQL-6933FF?style=for-the-badge&logo=cockroachlabs&logoColor=white)](https://www.cockroachlabs.com/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Containerization](https://img.shields.io/badge/DevOps-Docker%20%7C%20Nginx-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📌 Overview

**GYAN** is an enterprise-grade academic project repository, technical fest management, and judge evaluation platform deployed at **Amrita Vishwa Vidyapeetham, Coimbatore**. It serves as a unified digital backbone connecting **1,000+ students** and **100+ faculty members**, replacing fragmented forms and spreadsheets with a single, highly available, and scalable platform.

The system manages the entire event lifecycle: from multi-tier hierarchical event configuration and constraint-driven team registrations to multi-rubric judge evaluations and real-time cross-departmental analytics dashboards.

---

## 🌟 Key Highlights & Engineering Impact

- **Production Scale**: Actively serving **1,000+ student participants** and **100+ faculty mentors & judges** across various departments.
- **Team Leadership**: Led a team of 3 developers; architected end-to-end full-stack system design, managed task delegation, and conducted full code reviews.
- **Horizontally Scalable Database**: Integrated **CockroachDB / PostgreSQL** via SSL encryption (`root.crt`) and connection pooling for resilient, zero-downtime distributed data handling.
- **Hierarchical Role-Based Access Control (RBAC)**: Fine-grained access layers spanning 8 roles (`SUPERADMIN`, `EVENTADMIN`, `SUBEVENTADMIN`, `EVENTMANAGER`, `SUBEVENTMANAGER`, `SUBSUBEVENTMANAGER`, `COORDINATOR`, and `PARTICIPANT`).
- **Validation Workflows & Rules Engine**: Automated enforcement of dynamic team sizing, gender diversity thresholds (`minFemaleParticipants`), faculty mentor requirements, Technology Readiness Levels (TRL 1–9), and UN Sustainable Development Goal (SDG) mappings.
- **Multi-Rubric Evaluation Console**: Live scoring interface with decimal-precision score aggregation, real-time leaderboards, disqualification handling, and automated CSV export for results declaration.
- **Operational Dashboards**: Interactive data visualization powered by Recharts and Chart.js to deliver operational transparency on participation metrics and scoring curves.
- **Production-Ready DevOps Pipeline**: Automated deployment via Docker, Nginx reverse proxy, Gunicorn WSGI workers, and automated pre-migration SQL backup routines (`deploy.sh`).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Tier (Browser)"]
        UI["React 18 + Vite SPA\nTailwind CSS | Framer Motion | Recharts"]
    end

    subgraph Gateway ["Reverse Proxy & Web Server"]
        NGINX["Nginx Container\n(Static Assets, SSL Termination & Reverse Proxy)"]
    end

    subgraph AppServer ["Application Tier"]
        GUNICORN["Gunicorn WSGI (3 Workers)"]
        DJANGO["Django 4.2 + DRF Application\n(Auth, RBAC, Validation Engine, Evaluation)"]
    end

    subgraph DataTier ["Data & Storage Tier"]
        DB[("CockroachDB / PostgreSQL 13+\n(Distributed / Relational DB with SSL)")]
        BACKUP["Automated SQL Backups\n(Pre-deployment Snapshots)"]
    end

    UI -->|"HTTPS Requests (Port 443 / 8080)"| NGINX
    NGINX -->|"Static Assets (/static/)"| UI
    NGINX -->|"Proxies /api/, /user/, /events/, /eval/, /admin/"| GUNICORN
    GUNICORN --> DJANGO
    DJANGO -->|"dj-database-url / psycopg2 (TLS/SSL)"| DB
    DB -.->|"pg_dump Automated Routine"| BACKUP
```

---

## 🚀 Core Modules & Features

### 1. 🎯 3-Tier Hierarchical Event Architecture
Organizes large-scale fests and academic expos through a structured parent-child hierarchy:
- **Main Event**: High-level fest or symposium (e.g., *Anokha Tech Fest*, *Amrita Innovation Expo*).
- **Sub Event**: Category or department-level track (e.g., *Computer Science Track*, *Robotics & IoT*).
- **Sub-Sub Event (Competitions / Workshops / Hackathons)**: Specific competitions configured with custom submission constraints, team limits, and evaluation rubrics.

```mermaid
graph TD
    A["Main Event (e.g., Annual Tech Conclave)"] --> B1["Sub Event 1 (AI & Software Tracks)"]
    A --> B2["Sub Event 2 (Hardware & Robotics Tracks)"]
    B1 --> C1["Sub-Sub Event: AI Hackathon"]
    B1 --> C2["Sub-Sub Event: Code Sprint"]
    B2 --> C3["Sub-Sub Event: IoT Project Expo"]
    B2 --> C4["Sub-Sub Event: Drone Challenge"]
```

### 2. 📝 Intelligent Registration & Validation Engine
- **Constraint Enforcement**: Validates team size boundaries (`minTeamSize` to `maxTeamSize`) and gender inclusivity policies (`minFemaleParticipants`).
- **Academic Profiling**: Captures institutional roll numbers, department, school, degree program, and graduation year.
- **Academic Research Classifications**:
  - **TRL Levels**: Tagging projects according to Technology Readiness Levels (TRL 1 to 9).
  - **SDG Goals**: Mapping student innovations against UN Sustainable Development Goals (SDG 1–17).
- **Automated Participant Linking**: Asynchronously synchronizes team members with platform user accounts via email lookup.
- **Manual Team Entry**: On-spot registration capabilities for administrative staff during live events.

### 3. ⚖️ Evaluation & Judging Portal
- **Judge Linking**: Direct association of internal and external faculty judges to competitions.
- **Rubric-Based Scoring**: Customizable evaluation rubrics per competition track with configurable weightages.
- **High-Precision Scoring**: Decimal-safe calculations preventing rounding drift when averaging scores across multiple judging panels.
- **Remarks & Disqualification**: Structured qualitative feedback and immediate disqualification status management.
- **One-Click Export**: Instant CSV generation containing comprehensive evaluation sheets and ranked standings.

### 4. 📊 Analytics & Operational Dashboards
- **Participation Demographics**: Department-wise and year-wise breakdown of participating teams.
- **Project Distribution**: Interactive charts showing TRL maturity levels and SDG category distributions.
- **Judge Performance Metrics**: Score normalization charts and completion progress trackers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Chart.js, Lucide Icons, Axios, React Router v7 |
| **Backend** | Python 3.10+, Django 4.2 LTS, Django REST Framework (DRF), django-cors-headers, WhiteNoise |
| **Database** | CockroachDB / PostgreSQL 13+ (Production), SQLite (Local Dev), `dj-database-url`, `psycopg2-binary` |
| **DevOps & Infra** | Docker, Docker Compose, Nginx, Gunicorn, Linux (Ubuntu Server), Shell Scripting |
| **Security** | Token Authentication, CSRF Protection, HSTS, Secure Cookies, SSL/TLS (`root.crt`), Proxy Headers |

---

## 📂 Repository Structure

```
.
├── deploy.sh                     # Automated production deployment & backup script
├── docker-compose.yml            # Multi-container orchestration (Frontend, Backend, DB)
├── requirements.txt              # Backend Python dependencies
├── root.crt                      # CockroachDB / Postgres SSL Root Certificate
├── nginx/
│   └── nginx.conf                # Nginx proxy configuration & route mappings
├── satchi_api/                   # Django Backend Project
│   ├── manage.py
│   ├── Dockerfile
│   ├── backend/                  # Core WSGI/ASGI, routing, and settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── views.py              # Health check endpoints
│   ├── api/                      # Project registration, statistics & core services
│   │   ├── models.py             # Project, TeamMember schemas
│   │   ├── services.py           # Sync logic & validation algorithms
│   │   ├── urls.py
│   │   └── views.py
│   ├── users/                    # Authentication, Custom User Model & RBAC
│   │   ├── models.py             # AbstractUser, EventUserMapping
│   │   ├── urls.py
│   │   └── views.py
│   ├── events/                   # Hierarchical Event Models & management
│   │   ├── models.py             # MainEvent, SubEvent, SubSubEvent
│   │   ├── urls.py
│   │   └── views.py
│   └── eval/                     # Evaluation engine, scoring rubrics & judge mappings
│       ├── models.py             # Evaluation, SubSubEventJudge, Rubric, EvaluationJudgeMark
│       ├── urls.py
│       └── views.py
└── satchi-main/                  # React Frontend Application
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── Dockerfile
    ├── public/
    └── src/
        ├── App.jsx               # Client-side routing & route guards
        ├── Components/           # Modular UI elements, Navigation, Header, Footer
        └── Pages/                # Application Views
            ├── Home.jsx          # Hero section, about, featured tracks
            ├── Events.jsx        # Dynamic event catalog & track explorer
            ├── Registration.jsx  # Multi-step project submission form
            ├── Admin.jsx         # Fest Administration control center
            ├── UserManagement.jsx# User directory & role assignment
            ├── TeamManagement.jsx# Registered team oversight & edits
            ├── ManualTeamEntry.jsx# Admin on-spot team registrations
            ├── Evaluation.jsx    # Judge scoring console & rubrics
            ├── Statistics.jsx    # Operational & analytics charts
            ├── Profile.jsx       # Student/Faculty profile & registered submissions
            ├── Login.jsx         # Token-based authentication portal
            └── Signup.jsx        # Role-based onboarding flow
```

---

## ⚡ Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18.x or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**
- **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/DarshanR43/satchi.git
cd satchi
```

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd satchi_api

# Create and activate virtual environment
# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Run database migrations
python manage.py migrate

# Create superuser account
python manage.py createsuperuser

# Start development server
python manage.py runserver
```
*Backend API will be accessible at:* `http://127.0.0.1:8000/`

---

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd satchi-main

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend application will be accessible at:* `http://localhost:5173/`

---

## 🐳 Production Deployment (Docker & Nginx)

The project includes an automated deployment pipeline with zero-downtime philosophy and automated pre-migration SQL backups.

### 1. Configure Environment Variables
Copy `.env.prod.example` to `.env.prod`:
```bash
cp .env.prod.example .env.prod
```

Configure the production secrets in `.env.prod`:
```ini
DJANGO_SECRET_KEY=your-secure-random-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=gyan.cb.amrita.edu,127.0.0.1,localhost
DJANGO_CSRF_TRUSTED_ORIGINS=https://gyan.cb.amrita.edu
DJANGO_CORS_ALLOWED_ORIGINS=https://gyan.cb.amrita.edu

# CockroachDB / PostgreSQL Configuration
DATABASE_URL=postgres://satchi:YourStrongPassword@db:5432/satchi
DATABASE_SSL_REQUIRE=False

# In case of CockroachDB Cloud cluster:
# DATABASE_URL=cockroachdb://user:password@host:26257/gyan_db?sslmode=verify-full&sslrootcert=/path/to/root.crt

FRONTEND_HOST_BIND=127.0.0.1
FRONTEND_HOST_PORT=8080
VITE_API_URL=https://gyan.cb.amrita.edu
```

### 2. Execute Automated Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

**What `deploy.sh` executes automatically:**
1. Builds optimized multi-stage Docker images for frontend and backend.
2. Spins up the database container and verifies health checks.
3. Automatically dumps a pre-migration timestamped SQL snapshot into `postgres_backups/`.
4. Runs Django production checks (`python manage.py check --deploy`).
5. Executes database migrations and collects static assets.
6. Launches backend Gunicorn workers and Nginx frontend proxy.
7. Executes a synthetic health check (`/api/health/`) to confirm deployment integrity.

---

## 🛡️ Database Management & CockroachDB Integration

### CockroachDB / PostgreSQL Resiliency
GYAN utilizes `dj-database-url` and `psycopg2-binary`, enabling plug-and-play support for **CockroachDB** clusters or dedicated **PostgreSQL** instances.

- **SSL Security**: Full TLS validation using `root.crt` certificates.
- **Connection Optimization**: Persistent database connections managed with `DATABASE_CONN_MAX_AGE=600` and automatic health re-checks.

### Manual Backup & Restoration

```bash
# Manual SQL Backup
mkdir -p postgres_backups
docker compose --env-file .env.prod exec -T db pg_dump -U satchi satchi | gzip > postgres_backups/backup_$(date +%F_%H%M%S).sql.gz

# Manual Database Restore
gunzip -c postgres_backups/backup_YYYY-MM-DD.sql.gz | docker compose --env-file .env.prod exec -T db psql -U satchi satchi
```

---

## 📡 API Overview

| Module | Endpoint | Method | Description | Access |
|---|---|---|---|---|
| **System** | `/api/health/` | `GET` | Application health and status probe | Public |
| **Auth** | `/user/signup/` | `POST` | Register student / faculty account | Public |
| **Auth** | `/user/login/` | `POST` | Authenticate and obtain auth token | Public |
| **Auth** | `/user/profile/` | `GET` | Fetch authenticated user profile & roles | Authenticated |
| **Users** | `/user/admin/users/` | `GET` | List & filter system users | Superadmin |
| **Events** | `/events/getEvents/` | `GET` | Fetch hierarchical event tree | Public |
| **Events** | `/events/create_event/` | `POST` | Create Main, Sub, or SubSub event | Event Admin |
| **Events** | `/events/toggle_status/<lvl>/<id>/` | `POST` | Open or close event registrations | Event Admin |
| **Projects**| `/api/submit-project/<event_id>/` | `POST` | Submit project with team & validation | Authenticated |
| **Projects**| `/api/my-registrations/` | `GET` | View current user's registered projects | Authenticated |
| **Projects**| `/api/event-registrations/<event_pk>/` | `GET` | Manage all registered teams for an event | Admin / Manager |
| **Eval** | `/eval/get_projects/<event_id>/` | `GET` | Fetch projects queued for evaluation | Judges / Admin |
| **Eval** | `/eval/evaluations/submit/` | `POST` | Submit judge marks & rubric scores | Assigned Judges |
| **Eval** | `/eval/subsubevents/<id>/summary.csv` | `GET` | Export final marksheet to CSV | Event Admin |
| **Stats** | `/api/statistics/<event_id>/` | `GET` | Compute real-time event analytics | Authenticated |

---

## 👥 Authors & Acknowledgments

- **Leadership & Full-Stack Architecture**: Led a team of 3 developers for end-to-end design, implementation, and deployment.
- **Institution**: Amrita Vishwa Vidyapeetham, Coimbatore Campus.
- **Audience**: Built for the students, faculty mentors, department chairs, and event coordinators of Amrita University.

---

## 📄 License
This project is developed for academic and institutional operations at Amrita Vishwa Vidyapeetham. Distributed under the **MIT License**.
