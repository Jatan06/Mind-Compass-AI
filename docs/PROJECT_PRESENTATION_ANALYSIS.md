# 🧩 Mind Compass AI — Complete Technical Analysis & Presentation Content

---

## 1. Executive Summary

**Mind Compass AI** is an AI-powered personal mental health companion, mood analytics engine, and mindfulness platform. Developed as a full-stack web application, it integrates a **Django REST Framework (DRF)** backend with a **React 19 + Vite** frontend.

The system empowers users to monitor, evaluate, and enhance their emotional well-being by combining:
1. **Rule-based and NLP sentiment/emotion pipelines** (VADER Sentiment Intensity Analyzer, WordNet Lemmatization, custom emotion mapping).
2. **Machine Learning predictive models** (Random Forest Classifier for 3-stage adaptive mood prediction).
3. **Generative LLM integrations** (Google Gemini `gemini-2.0-flash-lite` and Groq `llama-3.3-70b-versatile` for empathetic AI conversation via the "Compass" companion).
4. **Clinical therapy activity routing & closed-loop feedback** (multi-factor recommendation scoring engine).
5. **Interactive audio & mindfulness studio** (procedural Web Audio API soundscapes via Tone.js, guided breathing, and browser Screen Wake-Lock integration).

This document serves as an exhaustive, code-verified technical documentation and presentation foundation suitable for academic viva, faculty review, and senior technical evaluations.

---

## 2. Project Understanding

### 1. What is this project?
Mind Compass AI is a full-stack mental health monitoring, emotional intelligence analytics, and digital therapy intervention system.

### 2. Real Purpose
To bridge the gap between daily emotional turbulence and structured mindfulness intervention by delivering real-time mood tracking, automated NLP journal analysis, early crisis detection, adaptive machine-learning mood predictions, and AI-guided therapy recommendations.

### 3. Users
Individuals seeking self-directed mental wellness tracking, mindfulness practice, stress management, intelligent journaling, and AI-assisted emotional coaching.

### 4. Problems Solved
- Fragmented mental health tracking (mood, sleep, stress, and journal logs kept separately).
- Lack of immediate, objective emotional feedback on written journal entries.
- Unassisted mental distress without early crisis intervention safety nets.
- One-size-fits-all mindfulness recommendations that ignore real-time state conflicts (e.g., reporting a high mood while journaling about severe distress).

### 5. Implemented Features
- **Secure Authentication**: JWT Auth with refresh token rotation (`djangorestframework-simplejwt`), Google OAuth 2.0 (`@react-oauth/google`), email verification, and 6-digit OTP password reset.
- **Onboarding Assessment**: Baseline profile setup capturing sleep, exercise, screen time, water intake, goals, and coping preferences.
- **Daily Mood Check-In**: Multi-metric daily tracking (mood 1–5, stress 0–10, energy 0–10, sleep hours, productivity 0–10, social 0–10, daily notes) with daily throttling.
- **Intelligent Journaling**: Rich text and browser-native Web Speech API voice journaling with live multi-stage NLP (VADER sentiment, emotion classification, topic extraction, crisis detection).
- **Adaptive Recommendation Engine**: Multi-factor activity recommendation engine balancing mood, stress, journal themes, past activity satisfaction, and mood-journal conflict resolution.
- **3-Stage Adaptive Mood Prediction**: Machine learning pipeline (Random Forest Classifier) that transitions from cold-start guidance (Stage 1: <7 logs) to trend-aware prediction (Stage 2: 7–29 logs) to full personalized forecasting (Stage 3: 30+ logs).
- **AI Companion ("Compass")**: Conversational assistant leveraging Google Gemini / Groq LLMs with compact context injection (<400 tokens) built from user profile stats.
- **Insights & Analytics Dashboard**: Recharts-powered data visualization displaying mood stability trends, recovery spectrum statements, cognitive themes, and calculated Wellness Scores (10–100 scale with recency exponential decay).
- **Therapy & Ambient Studio**: Catalog of 50 seeded therapy exercises with step-by-step instructions, ambient audio synthesis (`tone`), and Screen Wake-Lock focus mode.
- **Crisis Detection & Safety Protocol**: Real-time text scanner flagging self-harm, hopelessness, worthlessness, and isolation to generate `CrisisAlert` database records and helpline resources.

### 6. Partially Implemented Features
- **Background Task Scheduling**: Celery and Redis configuration exist in `Backend/config/settings.py` and `Backend/config/celery.py`, but asynchronous task dispatchers (e.g. periodic background email reports or offline batch training) are currently executed synchronously inside pipeline handlers (`AIServicePipeline.run_pipeline_if_ready`).

### 7. Planned Features Not Implemented (Not Found in Project)
- **Vector Database / RAG Vector Store**: No vector database (e.g., Chroma, Pinecone, Qdrant, pgvector) exists in `requirements.txt` or code. Context is constructed via direct SQL queries and compact text formatting in `CompanionService._build_system_prompt`.
- **Native Mobile Apps**: No Flutter or React Native codebases exist; responsive web layout is used instead.

### 8. Data Movement & Flow
`User UI Input` → `React Context (AppContext.jsx)` → `Axios API Client (api.js)` → `Django DRF Views` → `Service Layer Business Logic` → `AI/ML Pipelines (NLTK / Scikit-Learn / Gemini / Groq)` → `PostgreSQL / SQLite Database`.

### 9. External APIs
- **Google Gemini API** (`google-genai` / `google-generativeai`): Model `gemini-2.0-flash-lite`.
- **Groq API** (`groq`): Model `llama-3.3-70b-versatile`.
- **Google OAuth 2.0**: ID Token verification via Google API client.
- **Web Speech API**: Browser-native API for speech-to-text voice journaling.

### 10. Authentication Handling
Multi-layered JWT authentication using DRF SimpleJWT (`ACCESS_TOKEN_LIFETIME` = 1 day, `REFRESH_TOKEN_LIFETIME` = 7 days, `ROTATE_REFRESH_TOKENS` = True). Intercepted automatically on frontend via Axios request/response interceptors with background token refresh and session expiration events (`auth_session_expired`).

### 11. Database
- **PostgreSQL** in production (configured via `dj_database_url` and environment variables).
- **SQLite** in-memory database used automatically during unit test execution (`'test' in sys.argv`).

### 12. AI Models Used
- **VADER Sentiment Intensity Analyzer** (NLTK) for text sentiment polarity.
- **Random Forest Classifier** (`sklearn.ensemble.RandomForestClassifier`, 150 estimators, max depth 7) saved as `mood_predictor.pkl` for next-day mood prediction.
- **WordNet Lemmatizer** (NLTK) for NLP keyword stemming.
- **Google Gemini 2.0 Flash Lite** / **Groq LLaMA 3.3 70B Versatile** for conversational AI companion.

### 13. AI Integration
Synchronous AI Service Pipeline (`AIServicePipeline.run_pipeline_if_ready`) invoked upon completing daily check-ins and journal entries. NLP pipeline executes during entry creation (`JournalService._run_nlp_pipeline`).

### 14. Core Libraries
- **Frontend**: React 19, Vite, React Router DOM v7, Tailwind CSS v4, Framer Motion, Recharts, Tone.js, Axios, `@react-oauth/google`.
- **Backend**: Django 5.x / 6.0, Django REST Framework, SimpleJWT, Celery, Redis, Scikit-Learn, Joblib, NLTK, Google GenAI SDK, Groq SDK, Psycopg2, Whitenoise.

### 15. Architectural Pattern
- **Frontend**: Component-Driven Architecture with Centralized Provider State Management (`AppContext.jsx`).
- **Backend**: Layered MVT (Model-View-Template) / Service-Oriented Architecture (Serializer-View-Service-Model separation).

### 16. Frontend-Backend Connection
Axios HTTP client (`Frontend/src/services/api.js`) targeting REST API endpoints exposed at `http://127.0.0.1:8000/api/`.

### 17. Request Lifecycle
`React Event` → `AppContext Async Function` → `api.js (Interceptors inject Bearer token)` → `Django Middleware (CORS, Security, Auth)` → `urls.py` → `DRF APIView` → `Service Layer` → `Database / ML Inference` → `DRF Serializer Response (JSON)` → `AppContext State Update` → `React Re-render`.

### 18. Error Handling
- **Backend**: Centralized `validation_error_response` helper formatting errors into `{ success: false, message, errors: { field: [msg] } }` with explicit HTTP status codes (400, 401, 404, 500).
- **Frontend**: Axios response interceptor auto-refreshes expired 401 tokens or dispatches `auth_session_expired` event to purge local storage and redirect to login.

### 19. State Management
React Context API (`AppContext.jsx`) holding auth tokens, user profile, check-ins, journals, recommendations, prediction data, insights data, and loading indicators.

### 20. Deployment Strategy
- Backend ready for Gunicorn + Whitenoise + PostgreSQL + Redis on cloud hosts (e.g. Render, Railway, AWS).
- Frontend ready for static build (`vite build`) served via Vercel, Netlify, or Nginx.

---

## 3. Presentation Content (Slides 1–7)

```carousel
# SLIDE 1: Title Slide

# 🧩 Mind Compass AI
### An AI-Powered Personal Mental Wellness Companion, Mood Analytics, & Mindfulness Platform

**Tagline**: *Understanding your emotions today to guide your well-being tomorrow.*

**Description**:
Mind Compass AI is a modern full-stack mental health application designed to help users track, analyze, and improve their emotional health. By synthesizing daily mood metrics, voice/text journal NLP sentiment, adaptive Machine Learning predictions, and Generative AI coaching, Mind Compass delivers personalized therapy guidance in a secure, clinical-grade interface.

- **Project Type**: Full-Stack AI & Mental Health Web Application
- **Target Users**: Individuals seeking emotional tracking, mindfulness guidance, stress reduction, and intelligent self-reflection.
- **Core Technology Stack**: Django REST Framework, React 19, Vite, PostgreSQL, Scikit-Learn, Google Gemini API, Groq API, Tone.js.

<!-- slide -->
# SLIDE 2: Problem Statement

### Real-World Mental Health Challenges

1. **Fragmented Mood & Wellness Tracking**:
   Users frequently record emotions in notebooks, track sleep in fitness apps, and practice meditation in separate tools. There is no unified view correlating sleep, stress, and sentiment.

2. **Lack of Immediate Emotional Feedback**:
   Traditional digital journals store raw text without providing insight into underlying emotional themes, negative cognitive patterns, or sentiment shifts over time.

3. **Delayed Risk & Crisis Detection**:
   Early warning signs of mental health deterioration (suicide ideation, severe hopelessness, extreme isolation) often go unnoticed until a severe crisis occurs.

4. **Generic, One-Size-Fits-All Interventions**:
   Existing mindfulness apps offer static playlists that ignore real-time state conflicts—such as a user reporting high energy while secretly experiencing severe internal distress.

Why It Matters:
Mental health issues affect millions globally. Providing accessible, privacy-focused, AI-assisted self-monitoring tools lowers the barrier to daily self-care and timely intervention.

<!-- slide -->
# SLIDE 3: What is Mind Compass AI?

Mind Compass AI is a comprehensive digital wellness platform that combines structured daily self-assessments with artificial intelligence to deliver real-time emotional analytics and tailored mindfulness exercises.

The application operates as an intelligent "Emotional Twin" for the user. By analyzing daily check-ins (mood, stress, sleep, energy, productivity, social connection) alongside written or spoken journal entries, the platform continuously adapts its recommendations to match the user's immediate psychological state.

### Key Capabilities:
- **Interactive AI Companion ("Compass")**: Empathetic conversational AI powered by Google Gemini and Groq LLMs.
- **Intelligent Journaling**: Text & voice recording with automatic VADER sentiment analysis, emotion mapping, and keyword extraction.
- **Predictive Analytics**: ML-based mood forecasting using a Random Forest Classifier trained on historical user patterns.
- **Therapy & Ambient Studio**: Guided breathing, somatic exercises, and procedural ambient audio soundscapes powered by Web Audio API & Tone.js.

<!-- slide -->
# SLIDE 4: Problem Solution

Mind Compass AI solves mental wellness challenges through an integrated 5-step user workflow:

1. **Onboarding & Baseline Profiling**: Users complete an initial assessment defining sleep targets, exercise habits, coping preferences, and wellness goals (`OnboardingAssessment.jsx`).
2. **Daily Multi-Metric Check-In**: Users log daily mood (1–5), stress (0–10), energy, sleep hours, productivity, and social connection (`DailyCheckIn.jsx`).
3. **Voice & Text Journal Analysis**: Users record thoughts via text or Web Speech API voice transcription (`Journal.jsx`). The backend pipeline (`JournalService._run_nlp_pipeline`) immediately extracts sentiment scores, primary emotions, and active stressors.
4. **Adaptive Recommendation & Crisis Guard**: The recommendation engine (`RecommendationService`) evaluates mood logs and journal themes to suggest targeted exercises (e.g. Box Breathing for acute stress). The crisis detector (`CrisisDetectionService`) flags self-harm or despair indicators, instantly displaying helpline resources.
5. **Insights & Long-Term Analytics**: Users view calculated Wellness Scores (10–100 scale), mood stability trends, and ML mood predictions on an interactive Recharts dashboard (`Dashboard.jsx`, `Insights.jsx`).

<!-- slide -->
# SLIDE 5: Detailed Tech Stack

| Category | Technology Name | Purpose in Project | Where Used | Example File(s) |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 19 | Core UI component framework | Entire frontend application | [App.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/App.jsx) |
| **Build Tool** | Vite 8 | Development server & fast HMR bundler | Frontend build configuration | [vite.config.js](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/vite.config.js) |
| **Routing** | React Router DOM v7 | Declarative client-side routing | Route tree & layout wrappers | [App.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/App.jsx) |
| **Styling** | Tailwind CSS v4 | Utility-first CSS & design tokens | Global styling & UI components | [index.css](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/index.css) |
| **Animations** | Framer Motion | Page transitions & micro-interactions | Animations & AI drawer | [AICompanion.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/components/AICompanion.jsx) |
| **Data Visualization** | Recharts | Interactive trend charts & score breakdown | Dashboard & Insights views | [Dashboard.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/Dashboard.jsx) |
| **Audio Engine** | Tone.js / Web Audio API | Procedural ambient soundscape synthesis | Wellness soundscape player | [soundscapes.js](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/utils/soundscapes.js) |
| **HTTP Client** | Axios | Async REST API communication | Backend API integrations | [api.js](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/services/api.js) |
| **Frontend OAuth** | `@react-oauth/google` | Google sign-in integration | Login & Register pages | [main.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/main.jsx) |
| **Backend Framework** | Django 5.x / 6.0 | Web framework & core backend | Project settings & routing | [settings.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/config/settings.py) |
| **API Toolkit** | Django REST Framework | Building RESTful Web APIs | View controllers & serializers | [views.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/authentication/views.py) |
| **Authentication** | SimpleJWT | Access & Refresh JWT token handling | Auth views & API permissions | [views.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/authentication/views.py) |
| **Task Queue** | Celery & Redis | Async background task processing | Broker & backend config | [celery.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/config/celery.py) |
| **Database** | PostgreSQL | Relational database storage | Production data storage | [settings.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/config/settings.py) |
| **NLP Engine** | NLTK (VADER / WordNet) | Sentiment polarity & text lemmatization | Journal NLP pipeline | [preprocessing.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/utils/preprocessing.py) |
| **Machine Learning** | Scikit-Learn | Random Forest Classifier model | Mood trend prediction | [model.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/prediction/model.py) |
| **Model Persistence** | Joblib | Saving/loading binary ML model weights | Model serialization | [model.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/prediction/model.py) |
| **LLM Services** | Google Gemini / Groq API | Conversational AI companion ("Compass") | AI Companion service | [services.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/companion/services.py) |

<!-- slide -->
# SLIDE 6: System Architecture & Data Workflow

```text
User Input (Text / Voice / Web Speech API)
   │
Frontend (React 19 + Vite + AppContext)
   │
Axios Interceptor (Bearer JWT Token)
   │
REST API Router (Django URL Conf)
   │
Controller Views (DRF APIViews)
   ├── Auth Service (JWT / Google OAuth / Email OTP)
   ├── Mood Service (Check-ins & Streaks)
   ├── Journal Service ──► NLP Pipeline (NLTK VADER / Lemmatizer / Crisis Guard)
   ├── Recommendation Engine (Multi-Factor Scoring & Conflict Resolution)
   ├── ML Prediction Engine (Random Forest Classifier)
   └── AI Companion Service ──► LLM Layer (Google Gemini / Groq API)
   │
Database Layer (PostgreSQL / Django ORM Models)
```

### Complete End-to-End Workflow:
1. **Authentication**: User logs in; backend returns `access` and `refresh` tokens stored in `localStorage`/`sessionStorage`.
2. **Data Submission**: User submits mood check-in and journal entry.
3. **NLP & Safety Scanning**: Backend executes `JournalService._run_nlp_pipeline`. `VADER` calculates compound sentiment; `CrisisDetectionService` checks for self-harm keywords.
4. **Recommendation Synthesis**: `RecommendationService` evaluates stress scores, sleep hours, and journal themes. If a conflict occurs (e.g. Happy mood check-in vs Negative journal), journal sentiment takes priority (70% weighting).
5. **AI Companion Chat**: When opening the "Compass" drawer, `CompanionService` generates a compact system prompt (<400 tokens) summarizing 30-day mood averages and top themes, passing it to Gemini 2.0 Flash Lite or Groq LLaMA 3.3.
6. **Response & Visualization**: Frontend updates React state, triggers `refreshDashboardData()`, and renders updated Recharts visualizations.

<!-- slide -->
# SLIDE 7: Future Scope & Roadmap

### A. Logical Future Improvements
- **Mobile Native Applications**: Develop iOS and Android applications using React Native, reusing the existing DRF REST APIs.
- **Wearable Device Integration**: Connect with Apple HealthKit and Google Health Connect to auto-sync sleep duration, heart rate variability (HRV), and step counts into daily check-ins.
- **Vector Database (RAG Pipeline)**: Implement PGVector or ChromaDB to enable Retrieval-Augmented Generation across historical journal entries for long-term emotional memory.
- **Offline First PWA Support**: Implement Service Workers and IndexedDB for offline check-ins and journal queuing.
- **Multi-Modal AI Analysis**: Add audio sentiment analysis directly on raw voice recordings rather than relying solely on text transcripts.

### B. Development Roadmap
- **Short Term (1–3 Months)**:
  - Migrate synchronous AI pipeline execution to Celery background workers.
  - Implement Push Notifications (WebPush / FCM) for daily check-in reminders.
- **Medium Term (3–6 Months)**:
  - Integrate Wearable API endpoints for automated health metrics.
  - Add therapist export PDF report generation for clinical reviews.
- **Long Term (6–12 Months)**:
  - Deploy vector database RAG pipeline for deep historical journal retrieval.
  - Launch cross-platform React Native mobile applications.
```

---

## 4. Architecture Explanation

Mind Compass AI follows a decoupled, service-oriented architecture separating the presentation layer (React 19 single-page application) from the API and intelligence layer (Django REST Framework).

### High-Level Architecture Components

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND PRESENTATION                         │
│   React 19 + Vite | React Router DOM v7 | Tailwind CSS v4 | Recharts   │
│   AppContext (State Provider) | Web Speech API | Tone.js Soundscapes   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Axios HTTP (Bearer JWT)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        BACKEND API & CONTROLLER                        │
│   Django REST Framework Views | Middleware (CORS, Auth, Security)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
 ┌──────────────────────────────────┼──────────────────────────────────┐
 │                                  │                                  │
┌▼────────────────────────┐ ┌───────▼────────────────┐ ┌───────────────▼──────────┐
│   BUSINESS SERVICES     │ │    AI / ML PIPELINE    │ │   AUTHENTICATION ENGINE  │
│  - MoodService          │ │  - VADER Sentiment     │ │  - SimpleJWT Auth        │
│  - JournalService       │ │  - WordNet Lemmatize   │ │  - Google OAuth 2.0      │
│  - RecommendationEngine │ │  - Crisis Detection    │ │  - Email Verification    │
│  - InsightsService      │ │  - RF Mood Predictor   │ │  - 6-Digit OTP Reset     │
│  - ActivityService      │ │  - Gemini / Groq LLM   │ │                          │
└────────────┬────────────┘ └───────────┬────────────┘ └───────────────┬──────────┘
             │                          │                              │
┌────────────▼──────────────────────────▼──────────────────────────────▼──────────┐
│                             DATABASE LAYER                             │
│                  PostgreSQL (Production) / SQLite (Testing)            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detailed Component Roles:
1. **Frontend Presentation**: Handles UI rendering, user interaction, Web Speech API speech-to-text transcription (`Journal.jsx`), Web Audio synthesis (`soundscapes.js`), and chart rendering (`Recharts`).
2. **Context State Manager (`AppContext.jsx`)**: Central hub managing session tokens, user profiles, active check-ins, journals, and recommendations. Concurrently synchronizes API endpoints via `refreshDashboardData()` using `Promise.allSettled`.
3. **Axios API Client (`api.js`)**: Configured with request interceptors to automatically append Bearer access tokens and response interceptors to automatically attempt refresh token rotation on `401 Unauthorized` responses.
4. **Django REST Framework Views**: Class-based views (`APIView`) enforcing `IsAuthenticated` permissions, handling validation, and calling underlying domain services.
5. **Domain Services**: Business logic layer separating views from database queries. Modules include `MoodService`, `JournalService`, `ActivityService`, `RecommendationService`, `InsightsService`, and `AssessmentService`.
6. **AI / ML Pipeline**: Includes VADER sentiment scoring (`SentimentAnalysisService`), emotion classification (`EmotionDetectionService`), keyword extraction (`KeywordExtractionService`), crisis detection (`CrisisDetectionService`), 3-stage Random Forest mood prediction (`MoodPredictorModel`), and LLM companion chat (`CompanionService`).

---

## 5. Data Workflow

### 1. User Registration & Authentication Workflow
```text
User ──► RegisterPage.jsx ──► AuthService.register_user ──► User & UserProfile DB Created
                                                                   │
User ──► LoginPage.jsx ──► AuthService.authenticate_user ──► JWT Access & Refresh Tokens Returned
                                                                   │
                                                   Tokens Saved to LocalStorage/SessionStorage
```

### 2. Daily Check-In & Journal Submission Workflow
```text
User ──► DailyCheckIn.jsx ──► MoodService.save_checkin ──► MoodLog Created in DB ──► Streak Updated
                                                                                            │
User ──► Journal.jsx ──────► JournalService.create_entry ──► JournalEntry Created in DB     │
                                     │                                                      │
                       JournalService._run_nlp_pipeline ◄───────────────────────────────────┘
                                     │
    ┌────────────────────────────────┼────────────────────────────────┐
    │                                │                                │
VADER Sentiment             Emotion Classifier              Crisis Detection
(Positive/Negative)         (Primary & Secondary)           (Risk Score 0–100)
    │                                │                                │
    └────────────────────────────────┼────────────────────────────────┘
                                     │
                    Save to entry.analysis & EmotionAnalysis DB
                                     │
                     AIServicePipeline.run_pipeline_if_ready
                                     │
    ┌────────────────────────────────┴────────────────────────────────┐
    │                                                                 │
RecommendationService.get_today_recommendation              MoodPredictionService.predict
(Evaluates mood, stress, themes & conflict)                (RF Classifier 3-stage prediction)
    │                                                                 │
    └────────────────────────────────┬────────────────────────────────┘
                                     │
                    AIInsightsService.generate_insights
                  (Generates Emotional Twin Summary & DB)
```

### 3. AI Companion Chat Workflow ("Compass")
```text
User ──► AICompanion.jsx ──► CompanionService.chat ──► CompanionService._build_system_prompt
                                                                     │
                                                   Injects: Name, 30-Day Mood Stats,
                                                   Top Journal Themes, Latest AI Insight
                                                                     │
                                             ┌───────────────────────┴───────────────────────┐
                                             │                                               │
                                     Groq API Key Present?                         Gemini API Key Fallback
                                             │                                               │
                                  Groq (llama-3.3-70b-versatile)                Google GenAI (gemini-2.0-flash-lite)
                                             │                                               │
                                             └───────────────────────┬───────────────────────┘
                                                                     │
                                                   Formatted Response Returned to UI
```

---

## 6. Technology Analysis

### Backend Framework & Dependencies
- **Django 6.0.6 & Django REST Framework 3.15.2**: Provides robust ORM, database migrations, URL routing, and RESTful API serializers.
- **djangorestframework-simplejwt 5.5.1**: Implements secure JSON Web Token authentication with refresh token blacklisting.
- **Celery 5.6.3 & Redis 8.0.1**: Infrastructure for background task processing and caching.
- **psycopg2-binary 2.9.12**: PostgreSQL database driver.

### Machine Learning & Data Science Stack
- **scikit-learn 1.5.3**: Powers `RandomForestClassifier` for next-day mood prediction trained on 10 feature vectors (`mood`, `stress`, `energy`, `sleep`, `productivity`, `social`, `sentiment_score`, `pos_emotions`, `neg_emotions`, `activities_completed`).
- **joblib 1.5.3**: Handles binary serialization and deserialization of the trained Random Forest model (`mood_predictor.pkl`).
- **NLTK 3.10.0**: Used for VADER (`SentimentIntensityAnalyzer`), `WordNetLemmatizer`, tokenization, and stop-word filtering.
- **numpy 1.26**: Array operations for feature vector preparation and probability score extraction.

### Generative AI Integrations
- **google-genai 2.16.0 / google-generativeai 0.8.6**: Interface to Google's Gemini models (`gemini-2.0-flash-lite`).
- **groq 1.6.0**: Interface to Groq's high-speed inference engine (`llama-3.3-70b-versatile`).

### Frontend Libraries
- **React 19.2.7 & Vite 8.1.1**: Modern, fast web frontend with ES modules.
- **React Router DOM 7.18.1**: Nested route management (`/` public layout vs `/app` authenticated workspace layout).
- **Tailwind CSS 4.3.2**: Styling system with dark mode theme variables.
- **Framer Motion 12.42.2**: Micro-interactions, slide-up drawers, spring physics, and animated transitions.
- **Recharts 3.9.2**: Responsive SVG charts for mood history and analytics.
- **Tone.js 15.1.22**: Web Audio synthesis for background ambient soundscapes during mindfulness sessions.

---

## 7. Feature Mapping

| Application Feature | Frontend Component / Page | Backend API Endpoint | Backend Service / Module | Database Model(s) |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Registration** | [LoginPage.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/LoginPage.jsx), [RegisterPage.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/RegisterPage.jsx) | `POST /api/auth/register/`<br>`POST /api/auth/login/`<br>`POST /api/auth/google-login/` | [AuthService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/authentication/services.py) | `User`, `UserProfile` |
| **Password Reset** | [ResetPassword.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/ResetPassword.jsx) | `POST /api/auth/forgot-password/`<br>`POST /api/auth/verify-reset-otp/`<br>`POST /api/auth/reset-password/` | [AuthService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/authentication/services.py) | `PasswordResetToken` |
| **Onboarding Assessment** | [OnboardingAssessment.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/OnboardingAssessment.jsx) | `GET /api/assessment/`<br>`POST /api/assessment/`<br>`PUT /api/assessment/` | [AssessmentService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/assessment/services.py) | `AssessmentResponse`, `UserProfile` |
| **Daily Mood Check-In** | [DailyCheckIn.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/DailyCheckIn.jsx) | `POST /api/mood/`<br>`GET /api/mood/history/` | [MoodService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/mood/services.py) | `MoodLog`, `UserProfile` |
| **Intelligent Journaling** | [Journal.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/Journal.jsx) | `GET /api/journal/`<br>`POST /api/journal/`<br>`PUT /api/journal/<id>/`<br>`DELETE /api/journal/<id>/` | [JournalService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/journal/services.py), [SentimentAnalysisService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/sentiment/services.py) | `JournalEntry`, `EmotionAnalysis` |
| **AI Recommendation Engine** | [Dashboard.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/Dashboard.jsx) | `GET /api/recommendation/today/`<br>`GET /api/recommendation/history/` | [RecommendationService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/recommendation/services.py), [QuickRecommendationService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/recommendation/services.py) | `Recommendation`, `TherapyActivity` |
| **Therapy & Ambient Studio** | [Wellness.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/Wellness.jsx) | `GET /api/activities/`<br>`POST /api/activity-feedback/` | [ActivityService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/activities/services.py) | `TherapyActivity`, `ActivityFeedback`, `Recommendation` |
| **ML Mood Prediction** | [Dashboard.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/Dashboard.jsx) | `GET /api/ai/prediction/` | [MoodPredictionService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/prediction/services.py), [MoodPredictorModel](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/prediction/model.py) | `MoodPrediction` |
| **AI Companion ("Compass")** | [AICompanion.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/components/AICompanion.jsx) | `POST /api/ai/companion/` | [CompanionService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/companion/services.py) | None (Stateless LLM prompt call) |
| **Insights & Analytics** | [Insights.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/Insights.jsx) | `GET /api/insights/`<br>`GET /api/progress/`<br>`GET /api/ai/insights/` | [InsightsService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/insights/services.py), [AIInsightsService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/insights/services.py) | `AIInsight`, `UserProfile` |
| **Crisis Detection Safety** | [Journal.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/pages/Journal.jsx) | `POST /api/ai/crisis/` | [CrisisDetectionService](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/crisis/services.py) | `CrisisAlert` |

---

## 8. Future Scope

### Architectural Extensions:
1. **Background Async Execution via Celery**: Offload NLP processing, AI insight generation, and email dispatching to Celery background workers with Redis brokers.
2. **Retrieval-Augmented Generation (RAG)**: Integrate PostgreSQL `pgvector` to store sentence embeddings of user journals, enabling the AI companion to recall specific past events across long timeframes.
3. **Biometric & Wearable Integration**: Build REST ingestion endpoints for Apple HealthKit and Google Health Connect to auto-sync sleep quality, resting heart rate, and steps.
4. **Cross-Platform Mobile Apps**: React Native application sharing business logic and REST services with the current web frontend.

---

## 9. Appendix

### A. Detected Folder Structure

```text
Mind-Compass-AI/
├── Backend/
│   ├── activities/           # Therapy activities & completion feedback
│   ├── ai/                   # AI Companion, Sentiment, Emotion, Keywords, Crisis, ML Prediction
│   │   ├── companion/        # Gemini / Groq LLM service
│   │   ├── crisis/           # Crisis detection & helpline flagging
│   │   ├── emotions/         # Emotion classification services
│   │   ├── insights/         # AI Emotional Twin insights generator
│   │   ├── keywords/         # Topic & stressor keyword extractor
│   │   ├── prediction/       # Random Forest mood prediction model & service
│   │   ├── sentiment/        # NLTK VADER sentiment analysis service
│   │   └── utils/            # Text preprocessing & sentence NLP engine
│   ├── assessment/           # Onboarding assessment questionnaire
│   ├── authentication/       # JWT Auth, Google OAuth, Email OTP verification
│   ├── config/               # Django settings, URLs, Celery configuration
│   ├── core/                 # Shared models (CrisisAlert)
│   ├── insights/             # Aggregated user analytics & score calculator
│   ├── journal/              # Journal entries & NLP trigger pipeline
│   ├── ml/                   # ML training pipelines & saved model binaries
│   ├── mood/                 # Daily mood check-ins & streak tracking
│   ├── recommendation/       # Recommendation engine & conflict resolution
│   ├── users/                # Extended User and UserProfile models
│   ├── manage.py             # Django management CLI
│   └── requirements.txt      # Python backend dependencies
│
├── Frontend/
│   ├── public/               # Static assets & favicons
│   ├── src/
│   │   ├── assets/           # UI images & icons
│   │   ├── components/       # Reusable components (AICompanion, AmbientMusicPlayer, Navbar, etc.)
│   │   ├── context/          # State management providers (AppContext, ThemeContext)
│   │   ├── layouts/          # Layout wrappers (AppLayout, Public Layout)
│   │   ├── pages/            # App views (Dashboard, DailyCheckIn, Journal, Wellness, Insights, Profile, etc.)
│   │   ├── services/         # Axios API client endpoints (api.js)
│   │   ├── utils/            # Helper utilities & soundscapes audio engine (soundscapes.js)
│   │   ├── App.jsx           # Client-side router tree
│   │   ├── index.css         # Tailwind v4 styles & design system
│   │   └── main.jsx          # React app entry point
│   ├── package.json          # Node.js dependencies & scripts
│   └── vite.config.js        # Vite bundler configuration
│
├── docs/                     # Architectural reference documentation
├── .env.example              # Template environment variables
├── pyrightconfig.json        # Python static analysis settings
└── README.md                 # Project documentation
```

### B. Important Files with Purpose

- [settings.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/config/settings.py): Central Django configuration (DB, CORS, SimpleJWT, Celery, Logging, Email, Gemini/Groq keys).
- [urls.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/config/urls.py): Root URL dispatcher routing requests to apps.
- [AppContext.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/context/AppContext.jsx): Central React Context state provider managing authentication, tokens, and data synchronization.
- [api.js](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/services/api.js): Axios HTTP client with Bearer token injection and automatic 401 token refresh interceptor.
- [pipeline.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/pipeline.py): Synchronous AI service pipeline runner (`run_pipeline_if_ready`).
- [services.py (Companion)](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/companion/services.py): System prompt builder and LLM client for Gemini and Groq.
- [model.py (Prediction)](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/prediction/model.py): Random Forest classifier implementation for 3-stage mood forecasting.
- [services.py (Recommendation)](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/recommendation/services.py): Multi-factor recommendation algorithm and mood-journal conflict detector.
- [preprocessing.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/utils/preprocessing.py): Clause-level NLP parser, VADER sentiment analyzer, and lemmatization pipeline.
- [AICompanion.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/components/AICompanion.jsx): React component rendering the slide-up chat drawer for the "Compass" AI companion.
- [AmbientMusicPlayer.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/components/AmbientMusicPlayer.jsx): Web Audio API player for ambient soundscapes during mindfulness sessions.

### C. Important Classes

- `User` ([Backend/users/models.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/users/models.py#L5)): Custom Django AbstractUser model using UUID primary key and email uniqueness.
- `UserProfile` ([Backend/users/models.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/users/models.py#L16)): Model holding sleep, exercise, screen time, water intake, goals, streak, and wellness score.
- `MoodLog` ([Backend/mood/models.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/mood/models.py#L6)): Model storing daily mood (1–5), stress, energy, sleep, productivity, social scores, and notes.
- `JournalEntry` ([Backend/journal/models.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/journal/models.py#L5)): Model storing text/voice journal content and JSON analysis payloads.
- `TherapyActivity` ([Backend/activities/models.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/activities/models.py#L5)): Model representing therapy catalog exercises with slug IDs and instructions.
- `Recommendation` ([Backend/recommendation/models.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/recommendation/models.py#L6)): Model storing personalized activity suggestions, confidence scores, and completion feedback.
- `MoodPredictorModel` ([Backend/ai/prediction/model.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/prediction/model.py#L23)): Class managing Random Forest training, synthetic data generation, and 3-stage prediction logic.
- `CompanionService` ([Backend/ai/companion/services.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/companion/services.py#L9)): Class building compact system prompts and executing Gemini/Groq LLM completion requests.

### D. Important Functions

- `JournalService._run_nlp_pipeline(entry)` ([Backend/journal/services.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/journal/services.py#L21)): Runs sentiment, emotion, keyword, and crisis detection on journal text.
- `RecommendationService._detect_conflict(mood_log, journal_entry)` ([Backend/recommendation/services.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/recommendation/services.py#L15)): Detects discrepancies between mood scores and journal sentiment.
- `InsightsService._calculate_wellness_for_range(user, start_date, end_date)` ([Backend/insights/services.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/insights/services.py#L101)): Computes exponential recency-weighted wellness scores (10–100 scale).
- `analyze_text_nlp(text)` ([Backend/ai/utils/preprocessing.py](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Backend/ai/utils/preprocessing.py#L324)): Clause-level sentence NLP parser identifying emotions, negations, tenses, and topics.
- `refreshDashboardData()` ([Frontend/src/context/AppContext.jsx](file:///c:/Users/DELL/OneDrive/Desktop/gsgsgra/Mind-Compass-AI/Frontend/src/context/AppContext.jsx#L144)): Concurrent frontend data synchronization function using `Promise.allSettled`.

### E. Database Tables

- `users_user`: Standard user credentials (id, username, email, password, google_id).
- `users_userprofile`: Extended user profile settings and streak counts.
- `mood_moodlog`: Daily mood check-in records (unique together on user + date).
- `journal_journalentry`: Text/voice entries and stored JSON NLP analysis.
- `activities_therapyactivity`: Pre-seeded therapy exercise catalog.
- `activities_activityfeedback`: Recorded user completion ratings and duration.
- `recommendation_recommendation`: Generated activity recommendations and improvement scores.
- `assessment_assessmentresponse`: Raw onboarding questionnaire responses.
- `ai_emotionanalysis`: Historical emotion classification records.
- `ai_moodprediction`: Persisted ML mood prediction logs.
- `ai_aiinsight`: Generated Emotional Twin weekly summary reflections.
- `core_crisisalert`: Flagged safety alerts requiring clinical attention.
- `authentication_passwordresettoken`: 6-digit OTP codes and expiration tokens.
- `authentication_emailverificationtoken`: Tokens for email verification links.

### F. API Endpoints

- `POST /api/auth/register/`: Register new account.
- `POST /api/auth/login/`: Login with email/username + password.
- `POST /api/auth/google-login/`: Login/Register via Google OAuth ID token.
- `POST /api/auth/forgot-password/`: Dispatch 6-digit password reset OTP email.
- `POST /api/auth/verify-reset-otp/`: Verify 6-digit OTP code.
- `POST /api/auth/reset-password/`: Reset password using verified OTP.
- `GET /api/auth/verify-email/`: Verify email via token link.
- `POST /api/auth/refresh/`: Rotate expired JWT access token.
- `GET /api/assessment/`: Retrieve onboarding assessment.
- `POST /api/assessment/`: Save onboarding assessment.
- `GET /api/profile/`: Get user profile with current wellness score & streak.
- `PUT /api/profile/`: Update profile settings.
- `DELETE /api/account/delete/`: Permanently delete account and all data.
- `POST /api/mood/`: Submit daily mood check-in.
- `GET /api/mood/history/`: Retrieve historical mood logs.
- `GET /api/journal/`: List user journal entries.
- `POST /api/journal/`: Create new text or voice journal entry.
- `PUT /api/journal/<id>/`: Edit journal entry text.
- `DELETE /api/journal/<id>/`: Delete journal entry.
- `GET /api/activities/`: Get therapy activities catalog.
- `POST /api/activity-feedback/`: Submit activity completion feedback.
- `GET /api/recommendation/today/`: Fetch today's active recommendation.
- `GET /api/recommendation/history/`: Fetch historical recommendations.
- `GET /api/insights/`: Fetch user analytics data.
- `GET /api/progress/`: Fetch user progress metrics & badges.
- `POST /api/ai/companion/`: Chat with AI Companion ("Compass").
- `GET /api/ai/prediction/`: Fetch ML mood prediction.
- `GET /api/ai/insights/`: Fetch Emotional Twin AI insights.
- `POST /api/ai/crisis/`: Scan text for crisis indicators.

### G. Environment Variables

- `SECRET_KEY`: Django secret key for cryptographic signing.
- `DEBUG`: Boolean flag controlling development vs production error pages.
- `ALLOWED_HOSTS`: Comma-separated list of hostnames allowed to serve the app.
- `FRONTEND_URL`: Public URL of the React frontend (used for email links).
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`: PostgreSQL connection details.
- `DATABASE_URL`: Alternative database connection URL (e.g. for Render/Heroku).
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins for CORS headers.
- `VITE_API_URL`: Backend API base URL used by Axios frontend client.
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `VITE_GOOGLE_CLIENT_ID`: Google OAuth application credentials.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`: SMTP email server settings.
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`: Redis connection URLs.
- `GEMINI_API_KEY`: API key for Google Gemini Generative AI service.
- `GROQ_API_KEY`: API key for Groq LLaMA LLM inference service.

### H. Third-party Services

- **Google Gemini API**: Generative AI language model service.
- **Groq API**: Ultra-low latency LLaMA 3.3 model inference service.
- **Google OAuth 2.0 API**: User authentication provider.
- **SMTP Server (Gmail/SendGrid)**: Sending email verification links and password reset OTPs.

### I. Authentication Flow

1. **Client Request**: User submits credentials to `POST /api/auth/login/`.
2. **Credential Validation**: `AuthService.authenticate_user()` checks email/username and password using Django's standard password hashers (`pbkdf2_sha256`).
3. **Token Generation**: SimpleJWT generates an `access` token (expires in 24 hours) and a `refresh` token (expires in 7 days).
4. **Token Storage**: Frontend stores tokens in `localStorage` (if "Remember Me" is checked) or `sessionStorage`.
5. **Request Authorization**: Axios request interceptor attaches `Authorization: Bearer <access_token>` to every subsequent HTTP request.
6. **Token Renewal**: When an access token expires, Axios response interceptor catches the `401 Unauthorized` response, calls `POST /api/auth/refresh/` with the `refresh` token, updates stored access tokens, and retries the original request seamlessly.

### J. Important Dependencies

- `Django>=5.0.0,<6.0.0`
- `djangorestframework==3.15.2`
- `djangorestframework_simplejwt==5.5.1`
- `scikit-learn>=1.2.0`
- `joblib==1.5.3`
- `nltk==3.10.0`
- `google-genai==2.16.0`
- `groq==1.6.0`
- `celery==5.6.3`
- `redis==8.0.1`
- `psycopg2-binary==2.9.12`
- `react==^19.2.7`
- `vite==^8.1.1`
- `react-router-dom==^7.18.1`
- `framer-motion==^12.42.2`
- `recharts==^3.9.2`
- `tone==^15.1.22`
- `axios==^1.18.1`

### K. Potential Weaknesses

1. **Synchronous AI Pipeline Execution**: Currently, `AIServicePipeline.run_pipeline_if_ready()` runs synchronously during check-in/journal HTTP requests. If LLM or NLP calls experience latency, the user's HTTP request will wait. *Mitigation*: Move execution to background Celery tasks.
2. **Free-Tier LLM Rate Limits**: Dependence on free-tier Gemini and Groq API keys can lead to `HTTP 429 Rate Limit` errors under high concurrent traffic. *Mitigation*: The system includes fallback error handling informing users gracefully.
3. **Rule-Based Emotion Keyword Overlap**: While clause-level NLP is used, edge cases with complex sarcasm or double negations may result in lower emotion confidence scores.

### L. Interesting Design Decisions

1. **Compact System Prompt Construction**: Instead of maintaining vector databases or embedding indexes, `CompanionService` dynamically compiles user metrics (30-day averages, sleep, stress, top themes, and latest AI insights) into a tight system prompt (<400 tokens). This drastically reduces LLM token costs while preserving high personalization.
2. **70/30 Journal-Mood Conflict Resolution**: When a user's quantitative mood score contradicts their qualitative journal sentiment (e.g. reporting mood=5/5 but writing a journal flagged as "Negative"), the recommendation engine prioritizes the journal sentiment (70% weighting) to address implicit emotional distress.
3. **3-Stage Adaptive ML Cold-Start Handling**: To avoid presenting inaccurate ML forecasts to new users, `MoodPredictorModel` enforces 3 distinct stages: Stage 1 (<7 logs: collects data), Stage 2 (7–29 logs: basic trend forecasting), and Stage 3 (30+ logs: full Random Forest model inference).
4. **Procedural Soundscape Generation**: Rather than loading large MP3 audio files, `soundscapes.js` uses Web Audio API nodes via Tone.js to procedurally synthesize ambient sounds (pink noise rain, multi-oscillator waves, wind filtered noise) directly in the browser.
