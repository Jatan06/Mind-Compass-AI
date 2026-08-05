# 🧩 Mind Compass AI

> **An AI-Powered Personal Mental Wellness Companion, Mood Analytics, & Mindfulness Platform**

Mind Compass AI is a modern, full-stack mental health and wellness application designed to help users understand, monitor, and improve their emotional well-being. Built with a **Django REST Framework** backend, a **React 19 + Vite** frontend, and integrated **Machine Learning & Generative AI** services, Mind Compass AI delivers personalized insights, mood predictions, AI-guided support, and tailored therapy recommendations.

---

## 🌟 Key Features

- **🤖 AI Wellness Companion**: Interactive conversational assistant powered by Google Gemini & Groq APIs providing empathetic, real-time guidance and supportive conversation.
- **📊 Mood & Stress Tracking**: Daily check-in system capturing mood scores, stress levels, energy, sleep quality, and daily notes with predictive trend analysis.
- **📝 Intelligent Journaling**: Text and voice journaling featuring automated sentiment analysis (using VADER & custom ML NLP models) to analyze emotional depth over time.
- **🎯 ML-Powered Activity Recommendations**: Machine learning engine that analyzes user assessment profiles, daily mood logs, and historical activity feedback to suggest personalized wellness exercises.
- **🧘 Therapy & Ambient Wellness Studio**: Comprehensive wellness library featuring interactive guided breathing, mindfulness exercises, and custom ambient audio player powered by Tone.js.
- **📈 Insights & Analytics Dashboard**: Rich data visualizations powered by Recharts, offering deep dives into wellness scores, mood distribution, correlation analysis, and long-term progress.
- **🚨 Crisis Detection & Safety Protocols**: Intelligent text processing for early distress sign detection with crisis helplines and immediate intervention resources.
- **🔐 Secure Authentication**: Multi-layered authentication supporting JWT tokens, Google OAuth 2.0, email verification, and secure password resets.

---

## 🏗️ Architecture & Technology Stack

### **Frontend**

- **Core Framework**: React 19, Vite
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System
- **Animations & Micro-interactions**: Framer Motion
- **Data Visualization**: Recharts
- **Audio & Soundscapes**: Tone.js
- **Routing & HTTP**: React Router DOM v7, Axios
- **OAuth**: `@react-oauth/google`

### **Backend**

- **Web Framework**: Django 5.x, Django REST Framework (DRF)
- **Authentication**: `djangorestframework-simplejwt`, Google OAuth2
- **Task Queue & Async Processing**: Celery, Redis
- **Database**: PostgreSQL
- **AI Integrations**: Google Gemini API, Groq API
- **NLP & Machine Learning**: Scikit-Learn, Joblib, NLTK / VADER Sentiment

---

## 📁 Repository Structure

```text
Mind-Compass-AI/
├── Backend/                      # Django REST Framework Backend
│   ├── activities/               # Wellness library & feedback logs
│   ├── ai/                       # AI Companion & Sentiment analysis services
│   ├── assessment/               # Onboarding assessment & profile scoring
│   ├── authentication/           # JWT, Google OAuth, & Auth flows
│   ├── config/                   # Django core settings, URLs, & Celery config
│   ├── core/                     # Shared models & Crisis alert system
│   ├── insights/                 # Aggregated metrics & analytics serializers
│   ├── journal/                  # Journal entries & sentiment processing
│   ├── ml/                       # Machine Learning models, pipelines & inference
│   │   ├── saved_models/         # Pre-trained joblib model binaries
│   │   ├── services/             # Model inference controllers
│   │   └── training/             # Training scripts
│   ├── mood/                     # Daily mood check-ins & logs
│   ├── recommendation/           # Personalized recommendation engine
│   ├── users/                    # User models & profile management
│   ├── manage.py                 # Django CLI utility
│   └── requirements.txt          # Backend Python dependencies
│
├── Frontend/                     # React + Vite Frontend
│   ├── public/                   # Static assets & favicon
│   ├── src/
│   │   ├── assets/               # Branding assets & images
│   │   ├── components/           # Reusable UI components (AI Companion, Ambient Player, etc.)
│   │   ├── context/              # React Context state management (Auth, Theme)
│   │   ├── layouts/              # Page layout wrappers
│   │   ├── pages/                # Main app views (Dashboard, Wellness, Insights, Journal, etc.)
│   │   ├── services/             # Axios API client & endpoints
│   │   ├── utils/                # Helper functions & formatters
│   │   ├── App.jsx               # Application routes & layout orchestration
│   │   └── main.jsx              # React app entry point
│   ├── package.json              # Frontend dependencies & scripts
│   └── vite.config.js            # Vite bundler configuration
│
├── .env.example                  # Template environment variables configuration
├── pyrightconfig.json            # Python static analysis config
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: v18.x or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: v14.x or higher
- **Redis Server**: Required for background processing with Celery

---

### 1. Clone the Repository

```bash
git clone https://github.com/Jatan06/Mind-Compass-AI.git
cd Mind-Compass-AI
```

---

### 2. Environment Configuration

Copy the `.env.example` file to create a single `.env` file in the project root directory:

```bash
# On Windows (PowerShell / CMD)
copy .env.example .env

# On macOS / Linux
cp .env.example .env
```

Open `.env` and fill in your local configurations:

```env
# Django Backend
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database
DB_NAME=MindCompass
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# CORS & Frontend API Base
CORS_ALLOWED_ORIGINS=http://localhost:5173
VITE_API_URL=http://127.0.0.1:8000

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# AI Model APIs
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

---

### 3. Backend Setup (Django)

1. **Navigate to the Backend directory**:

   ```bash
   cd Backend
   ```

2. **Create and activate a virtual environment**:

   ```bash
   # On Windows
   python -m venv .venv
   .venv\Scripts\activate

   # On macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Prepare the PostgreSQL Database**:
   Create a database named `MindCompass` in PostgreSQL:

   ```sql
   CREATE DATABASE MindCompass;
   ```

5. **Run Django Database Migrations**:

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Start the Django Development Server**:

   ```bash
   python manage.py runserver
   ```

   *The backend will be running at `http://127.0.0.1:8000/`.*

7. **Start Celery Worker** *(in a separate terminal window)*:

   ```bash
   celery -A config worker --loglevel=info
   ```

---

### 4. Frontend Setup (React + Vite)

1. **Navigate to the Frontend directory**:

   ```bash
   cd Frontend
   ```

2. **Install Node.js dependencies**:

   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:

   ```bash
   npm run dev
   ```

   *The frontend application will be running at `http://localhost:5173/`.*

---

## 🛠️ Main Application Pages & Routes

| Route | View / Page | Description |
| :--- | :--- | :--- |
| `/` | `LandingPage.jsx` | Public landing page introducing Mind Compass features & benefits. |
| `/login` | `LoginPage.jsx` | User authentication via email/password or Google OAuth. |
| `/register` | `RegisterPage.jsx` | New user account creation & onboarding trigger. |
| `/onboarding` | `OnboardingAssessment.jsx` | Initial mental health assessment questionnaire for baseline personalization. |
| `/dashboard` | `Dashboard.jsx` | Core user dashboard showing daily mood summary, active streaks, and quick actions. |
| `/check-in` | `DailyCheckIn.jsx` | Daily mood, stress, energy, and sleep log entry screen. |
| `/journal` | `Journal.jsx` | Rich text/audio journal entry studio with automated sentiment tags. |
| `/wellness` | `Wellness.jsx` | Therapy library, ambient sound player, and guided breathing exercises. |
| `/insights` | `Insights.jsx` | Analytics graphs, mood history trends, and score breakdown. |
| `/profile` | `Profile.jsx` | User profile management, security settings, and assessment history. |

---

## 🔬 Machine Learning & AI Pipeline

Mind Compass AI leverages custom machine learning models alongside generative LLM integrations:

1. **VADER & Text Sentiment Classifier**: Analyzes journal entries to measure positive, negative, neutral, and compound emotional scores.
2. **Mood Prediction Engine**: Evaluates historical check-in sequences to predict upcoming mood trends and potential stress spikes.
3. **Recommendation Filter**: Matches user needs and emotional state with specific therapy activities (e.g., box breathing, ambient sounds, cognitive restructuring).
4. **AI Companion (Gemini / Groq)**: Contextual conversational interface trained to offer empathetic responses and wellness suggestions while enforcing crisis detection safeguards.

---

## 🛡️ License

This project is released under the **MIT License**.

---

<!-- markdownlint-disable-next-line MD033 -->
<p align="center">
  Designed & Developed with ❤️ for mental health & well-being.
</p>
