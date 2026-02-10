# GYAN - Tech Fest Management Platform

GYAN is a comprehensive event management and evaluation platform designed to streamline the organization of large-scale technical and non-technical Events. It serves as a centralized hub for administrators, participants, and judges, facilitating seamless coordination from registration to results.

## 🚀 Key Features

### 1. Admin Dashboard
- **Event Management**: Create and manage Main Events, Sub-Events, and Competitions/Workshops.
- **Hierarchical Structure**: Organize events in a 3-level hierarchy (Main -> Sub -> Competition).
- **Role Management**: Assign specific roles (Event Admins, Managers) to different levels of the hierarchy to delegate responsibilities.
- **Judge Assignment**: Link judges to specific competitions.
- **Registration Monitoring**: Track and download participant data for events.

### 2. Participant Portal
- **Event Catalog**: Explore a wide range of technical and non-technical events.
- **Registration**: Easy-to-use registration flow for competitions and workshops.
- **Status Updates**: Track registration status and event updates.

### 3. Evaluation Console
- **Judge Interface**: Dedicated portal for judges to view assigned competitions and teams.
- **Real-time Scoring**: Evaluate projects with a streamlined interface.
- **Feedback System**: Provide remarks and handle disqualifications securely.
- **Automated Results**: Scores are automatically aggregated and calculated.

### 4. Statistics & Analytics
- **Visual Insights**: Interactive charts using Recharts to visualize participation trends and score distributions.
- **Data Metrics**: Real-time overview of total participants, average scores, and event performance.

## 🛠️ Technology Stack

**Frontend**
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charting**: Recharts
- **State Management**: React Context API
- **Routing**: React Router DOM

**Backend**
- **Framework**: Django
- **API**: Django REST Framework (DRF)
- **Database**: SQLite (Default)
- **Authentication**: Token-based Authentication

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)

### 1. Frontend Setup
Navigate to the frontend directory:
```bash
cd satchi-main
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd satchi_api
```

Create and activate a virtual environment (recommended):
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install django djangorestframework django-cors-headers
```

Run database migrations:
```bash
python manage.py migrate
```

Start the backend server:
```bash
python manage.py runserver
```
The API will be available at `http://127.0.0.1:8000`.

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
