# 🛠️ Mind Compass AI — Technology Stack (A to Z)

> **Complete reference of all technologies, frameworks, libraries, databases, APIs, and tools used across the Mind Compass AI platform.**

---

## 📑 Quick Navigation
- [🔤 Alphabetical Master Index (A to Z)](#-alphabetical-master-index-a-to-z)
- [💻 Frontend Architecture](#-frontend-architecture)
- [⚙️ Backend Architecture](#️-backend-architecture)
- [🤖 AI & Machine Learning Pipeline](#-ai--machine-learning-pipeline)
- [🗄️ Database, Caching & Message Queue](#️-database-caching--message-queue)
- [🔒 Authentication & Security](#-authentication--security)
- [🛠️ Developer Tooling, Quality & DevOps](#️-developer-tooling-quality--devops)

---

## 🔤 Alphabetical Master Index (A to Z)

| Technology / Library | Category | Description & Usage in Project | Version / Details |
| :--- | :--- | :--- | :--- |
| **@react-oauth/google** | Auth & Security | Google OAuth 2.0 integration library for React single sign-on | `^0.13.5` |
| **@tailwindcss/vite** | Frontend / Styling | Vite official plugin for Tailwind CSS v4 integration | `^4.3.2` |
| **Aiohttp / Aiohappyeyeballs / Aiosignal** | Backend / Networking | Asynchronous HTTP client/server framework for Python async operations | `3.14.1` |
| **Alembic** | Database | Database migration tool for SQLAlchemy | `1.18.5` |
| **AMQP (amqp / kombu)** | Backend / Messaging | Low-level messaging protocol client for Celery broker communication | `5.3.1` |
| **Anyio / Asgiref** | Backend / Networking | Asynchronous compatibility layer for ASGI framework bridging | `4.14.1 / 3.11.1` |
| **Autoprefixer** | Frontend / Tooling | PostCSS plugin to add vendor prefixes to CSS rules automatically | `^10.5.2` |
| **Axios** | Frontend / Networking | Promise-based HTTP client for browser API requests to Django backend | `^1.18.1` |
| **Celery** | Backend / Distributed Tasks | Asynchronous task queue for executing background jobs (e.g. sentiment processing, notifications) | `5.6.3` |
| **Certifi** | Backend / Security | Root CA certificates bundle for validating SSL/TLS certificates | `2026.7.22` |
| **Cryptography** | Backend / Security | Low-level cryptographic primitives for secure operations and token signing | `48.0.1` |
| **CSS3 / Vanilla CSS** | Frontend / Styling | Custom CSS variables, glassmorphism design system, dynamic animations | Native |
| **Django** | Backend Framework | Core web framework providing ORM, URL routing, administration, and application structure | `>=5.0.0, <6.0.0` |
| **django-cors-headers** | Backend / Security | Django app for handling Cross-Origin Resource Sharing (CORS) headers for React frontend | `4.9.0` |
| **Django REST Framework (DRF)** | Backend / API | Toolkit for building robust, scalable RESTful APIs with serializers & viewsets | `3.15.2` |
| **djangorestframework-simplejwt** | Backend / Auth | JSON Web Token (JWT) authentication backend for Django REST Framework | `5.5.1` |
| **Docker SDK (`docker`)** | Backend / DevOps | Python client library for Docker engine interaction and container orchestration | `7.2.0` |
| **FastAPI** | Backend Framework | High-performance Python web framework for micro-service utility endpoints | `0.139.0` |
| **Flask / Flask-CORS** | Backend Framework | Lightweight WSGI web framework for ancillary service modules | `3.13.3` |
| **Framer Motion** | Frontend / Animation | Production-ready motion and animation library for fluid UI transitions | `^12.42.2` |
| **Git / GitPython** | Version Control | Distributed version control system and Python library to interact with repositories | `3.1.50` |
| **Google AI Generative Language API** | AI / Generative AI | Low-level client library for Google PaLM & Gemini language services | `0.6.15` |
| **Google Auth (`google-auth`)** | Backend / Security | Google authentication library for verifying Google OAuth ID tokens server-side | `2.56.2` |
| **Google GenAI / Generative AI SDK** | AI / Companion | Primary SDK for interacting with Google Gemini models for the AI Wellness Companion | `2.16.0 / 0.8.6` |
| **Graphene / GraphQL Core** | Backend / API | GraphQL framework for Python schema definition and execution | `3.4.3` |
| **Groq API (`groq`)** | AI / Companion | Ultra-fast LLaMA inference API SDK powering real-time conversational companion responses | `1.6.0` |
| **gRPC (`grpcio`)** | Backend / Networking | High-performance Remote Procedure Call framework used by Google Cloud services | `>=1.50.0` |
| **Gunicorn** | Backend / Web Server | Production WSGI HTTP server for hosting Python/Django applications | `26.0.0` |
| **HTML5** | Frontend | Semantic markup standard for application structure and accessibility | Native |
| **Huey** | Backend / Tasks | Lightweight alternative multithreaded task queue for background jobs | `3.2.0` |
| **JavaScript (ES6+)** | Frontend | Primary programming language for React client logic and audio processing | Native |
| **Jinja2 / Mako / MarkupSafe** | Backend / Templating | High-performance template rendering engines for email notifications & reports | `3.1.6` |
| **Joblib** | ML / Pipeline | Serialization and deserialization tool for saving/loading trained ML models (`.joblib`) | `1.5.3` |
| **JSON Web Tokens (PyJWT)** | Auth & Security | Open standard for securely transmitting information between frontend and backend | `2.13.0` |
| **Matplotlib** | Analytics & ML | Data visualization library for generating static statistical graphs & plots | `3.11.0` |
| **MLflow** | Machine Learning | Platform for tracking ML experiments, parameters, metrics, and model versioning | `3.14.0` |
| **NLTK (VADER)** | AI / NLP | Natural Language Toolkit used for VADER sentiment analysis on journal entries | `3.10.0` |
| **Node.js & npm** | Developer Tooling | JavaScript runtime and package manager powering frontend build scripts | `v18+` |
| **NumPy** | Data Science & ML | N-dimensional array computing package powering numerical math in ML algorithms | `>=1.24.0, <2.0.0` |
| **OpenTelemetry** | Observability | Vendor-neutral framework for application performance tracing and metrics | `1.43.0` |
| **Oxlint** | Tooling / Quality | Ultra-fast JavaScript and JSX linter written in Rust for code quality enforcement | `^1.71.0` |
| **Pandas / Narwhals** | Data Science & ML | Data manipulation and tabular analysis library for mood trend calculations | `>=2.0.0, <3.0.0` |
| **Pillow (PIL)** | Backend / Media | Python imaging library for avatar processing and visual asset handling | `12.3.0` |
| **PostCSS** | Frontend / Styling | CSS transformation tool executing Tailwind CSS and Autoprefixer workflows | `^8.5.16` |
| **PostgreSQL (`psycopg2-binary`)** | Database | Primary relational database storing user profiles, mood logs, journals, & assessments | `v14+` |
| **PyArrow** | Data Science | Apache Arrow Python bindings for high-performance columnar memory layout | `24.0.0` |
| **Pydantic** | Backend / Data Validation | Data validation and settings enforcement using Python type annotations | `2.13.4` |
| **Pyright** | Developer Tooling | Fast static type checker for Python codebase validation (`pyrightconfig.json`) | Configured |
| **Python 3.x** | Backend Language | Core backend programming language powering Django, ML models, and task queues | `v3.10+` |
| **React 19 (`react`, `react-dom`)** | Frontend Framework | Modern UI library with component architecture, hooks, and Concurrent Mode | `^19.2.7` |
| **React Icons (`react-icons`)** | Frontend / UI | Icon package rendering SVG icons across dashboard navigation and cards | `^5.7.0` |
| **React Router DOM v7** | Frontend / Routing | Declarative routing library managing application views, protected routes, and redirects | `^7.18.1` |
| **Recharts** | Frontend / Analytics | Redefined chart library built with React & D3 for mood trends & score visualizations | `^3.9.2` |
| **Redis (`redis`)** | Database & Cache | In-memory data store serving as Celery message broker and application cache | `8.0.1` |
| **Requests / HTTPX** | Backend / Networking | Synchronous and asynchronous HTTP client libraries for external API requests | `2.34.2 / 0.28.1` |
| **Scikit-learn** | Machine Learning | Machine learning library for predictive analytics, activity recommendation, & clustering | `>=1.2.0` |
| **SciPy** | Data Science & ML | Scientific computing library for advanced mathematical functions and statistical tests | `>=1.10.0` |
| **Skops** | ML / Security | Secure framework for scikit-learn model persistence and deployment validation | `0.14.0` |
| **SQLite (`dj-database-url`)** | Database | Lightweight database engine used for local development and unit testing fallback | Native |
| **SQLAlchemy** | Database / ORM | SQL toolkit and Object-Relational Mapper for Python service components | `2.0.51` |
| **Starlette** | Backend Framework | Lightweight ASGI framework underlying FastAPI service components | `1.3.1` |
| **Tailwind CSS v4** | Frontend / Styling | Utility-first CSS framework providing responsive layout and modern styling | `^4.3.2` |
| **Tenacity** | Backend / Resilience | General-purpose retrying library for resilient external AI API calls | `9.1.4` |
| **Tone.js (`tone`)** | Frontend / Audio | Web Audio framework powering ambient wellness soundscapes and sound player | `^15.1.22` |
| **Uvicorn** | Backend / Web Server | Lightning-fast ASGI web server implementation for async Python endpoints | `0.51.0` |
| **Vite** | Frontend Tooling | Next-generation frontend build tool and dev server providing HMR and bundling | `^8.1.1` |
| **Waitress** | Backend / Web Server | Production-quality pure-Python WSGI server for Windows/Linux host deployments | `3.0.2` |
| **WhiteNoise** | Backend / Web Server | Radically simplified static file serving directly from Python/Django web applications | `6.12.0` |

---

## 💻 Frontend Architecture

The frontend is a modern single-page application (SPA) built for maximum responsiveness, fluid animations, and rich data presentation.

- **Core Framework**: React 19 (`react`, `react-dom`)
- **Build System & Dev Server**: Vite 8 (`vite`, `@vitejs/plugin-react`)
- **Styling System**:
  - Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`)
  - PostCSS 8 (`postcss`, `autoprefixer`)
  - Vanilla CSS design tokens (Glassmorphism, Dark/Light palettes)
- **State Management & Navigation**:
  - React Context API (AuthContext, ThemeContext)
  - React Router DOM v7 (`react-router-dom`)
- **UI Components & Visuals**:
  - Framer Motion 12 (`framer-motion`) — Micro-interactions, modal transitions, and route animations
  - Recharts 3 (`recharts`) — Interactive analytics, mood trend charts, and radar graphs
  - React Icons 5 (`react-icons`) — SVG icon system
- **Audio & Ambient Studio**:
  - Tone.js 15 (`tone`) — Web Audio API synthesizer engine and ambient sound generator
- **Networking & Authentication**:
  - Axios 1.18 (`axios`) — Formatted API client with bearer token injection
  - `@react-oauth/google` — Google OAuth 2.0 Client SDK
- **Code Quality**:
  - Oxlint 1.71 (`oxlint`) — High-speed JS/JSX linter

---

## ⚙️ Backend Architecture

The backend delivers RESTful web APIs, user authentication, async task execution, and machine learning pipelines.

- **Core Web Framework**: Django 5.x + Django REST Framework (DRF 3.15)
- **Alternative Framework Extensions**: FastAPI 0.139, Flask 3.1
- **API & Protocol Layer**: RESTful JSON endpoints, GraphQL (`graphene`, `graphql-core`), gRPC (`grpcio`)
- **Asynchronous Task Queue**: Celery 5.6 (`celery`), Redis 8 (`redis`), AMQP (`kombu`, `amqp`), Huey 3.2
- **ASGI / WSGI Web Servers**:
  - Gunicorn 26 (`gunicorn`)
  - Uvicorn 0.51 (`uvicorn`)
  - Waitress 3.0 (`waitress`)
  - WhiteNoise 6.12 (`whitenoise`)
- **Data Validation & Serialization**: Pydantic 2.13 (`pydantic`), DRF Serializers
- **Resilience & Retries**: Tenacity 9.1 (`tenacity`), Requests (`requests`), HTTPX (`httpx`), Aiohttp (`aiohttp`)

---

## 🤖 AI & Machine Learning Pipeline

Mind Compass AI integrates hybrid artificial intelligence combining pre-trained NLP models, scikit-learn recommendation engines, and LLM APIs.

- **Large Language Model (LLM) APIs**:
  - Google Gemini API (`google-genai` v2.16, `google-generativeai` v0.8) — Contextual AI companion and wellness conversational assistant
  - Groq API (`groq` v1.6) — Low-latency LLaMA inference engine
- **Natural Language Processing (NLP)**:
  - NLTK 3.10 (`nltk`) + VADER Sentiment Analyzer — Real-time journal entry emotional depth scoring
- **Machine Learning Engine**:
  - Scikit-Learn 1.2+ (`scikit-learn`) — Activity recommendation filters and mood trend predictions
  - NumPy 1.24+ (`numpy`), SciPy 1.10+ (`scipy`), Pandas 2.0+ (`pandas`) — Numerical compute and data transformations
  - Joblib 1.5 (`joblib`) & Skops 0.14 (`skops`) — Safe model binary serialization (`.joblib`)
- **ML Lifecycle & Experimentation**:
  - MLflow 3.14 (`mlflow`, `mlflow-skinny`, `mlflow-tracing`) — Model registry and experiment tracking

---

## 🗄️ Database, Caching & Message Queue

- **Primary Relational Database**: PostgreSQL 14+ (`psycopg2-binary`, `dj-database-url`)
- **Development Database Fallback**: SQLite 3
- **ORM Layers**: Django ORM, SQLAlchemy 2.0 (`sqlalchemy`), Alembic 1.18 (`alembic`)
- **Cache & Message Broker**: Redis 8 (`redis`) — In-memory caching, Celery message broker, session backend
- **Columnar Data Processing**: PyArrow 24 (`pyarrow`), Narwhals (`narwhals`)

---

## 🔒 Authentication & Security

- **JWT Authentication**: `djangorestframework-simplejwt` 5.5 (`PyJWT` 2.13) — Access/Refresh token handling
- **OAuth 2.0**: Google OAuth 2.0 via `google-auth` server-side validation and `@react-oauth/google` client side
- **Password Hashing**: Django PBKDF2 / Argon2 cryptographic password management
- **CORS Handling**: `django-cors-headers` 4.9 & `flask-cors` 6.0
- **Cryptographic Tools**: `cryptography` 48.0, `certifi`

---

## 🛠️ Developer Tooling, Quality & DevOps

- **Version Control**: Git (`GitPython`, `gitdb`)
- **Static Type Checking**: Pyright (`pyrightconfig.json`)
- **JS/JSX Quality**: Oxlint (`.oxlintrc.json`)
- **Containerization**: Docker (`docker` SDK 7.2)
- **Observability & Telemetry**: OpenTelemetry (`opentelemetry-api`, `opentelemetry-sdk`)
- **Environment Management**: Python Dotenv (`python-dotenv` 1.2), `.env.example`
