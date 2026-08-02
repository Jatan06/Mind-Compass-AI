# MindCompass Backend - Phase 1

This is the Django/DRF modular backend architecture for the MindCompass mental wellness platform. It is designed to cleanly support the data structures and state variables of the React Vite frontend app.

## Backend Architecture

```
mindcompass-backend/
├── config/              # Django core configuration (settings, celery setup, base endpoints)
├── authentication/      # JWT authenticators, user validation, Google OAuth skeletons
├── users/               # Custom User & UserProfile database models and serializers
├── assessment/          # Onboarding Assessment profile logs & serializers
├── mood/                # Daily Check-in MoodLogs (mood, stress, productivity, etc.)
├── journal/             # Text and voice Journal entries with VADER sentiment analyses definitions
├── activities/          # Wellness TherapyActivities library and ActivityCompletion feedback logs
├── recommendation/      # Personalized Activity recommendations logs
├── insights/            # Historical metrics aggregation serializers shell
├── core/                # System config, Shared models (CrisisAlert logs), global utilities
├── ml/                  # Machine Learning modules
│   ├── saved_models/    # Trained estimators binaries (.joblib)
│   ├── training/        # Models training pipelines scripts
│   ├── services/        # Prediction/inference controllers
│   └── utils/           # Shared preprocess and text tokenization helpers
├── .env.example         # Template configuration settings variables
├── requirements.txt     # Python packages dependencies listing
└── README.md            # Installation & Architecture documentation guides
```

## Installation & Configuration Guide

### 1. Prerequisites
- Python 3.10+
- PostgreSQL database engine
- Redis Server (acting as broker for Celery)

### 2. Setup Virtual Environment & Install Dependencies
Navigate to the backend directory and run:
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Local Environment Parameters
Copy `.env.example` to `.env` and fill in your PostgreSQL and Redis settings:
```bash
# On Windows:
copy .env.example .env
# On macOS/Linux:
cp .env.example .env
```

### 4. Database Setup
Create a PostgreSQL database named `mindcompass`:
```sql
CREATE DATABASE mindcompass;
```

Then run the Django database migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Running the Services
Start the development API server:
```bash
python manage.py runserver
```

Start the Celery worker for background jobs:
```bash
celery -A config worker --loglevel=info
```
