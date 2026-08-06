# MindCompass — Dashboard Feature: Developer Notes
> Prepared for viva. Based 100% on actual project code.

---

## 1. Dashboard Overview

### Purpose
The Dashboard is the main home screen for logged-in users. It pulls together all of the user's wellness data — mood history, AI prediction, recommendation, journal preview, wellness score, and streak — and displays them in a single view, updated fresh every time the page loads.

### What the Dashboard Displays
| Card / Section | What It Shows |
|---|---|
| Header Greeting | User's first name from `userProfile.name` |
| Wellness Score | Calculated score 0–100 from `InsightsService` |
| Daily Streak | Consecutive check-in days from `MoodService` |
| Today's Mood | Today's mood label or "Not Checked In" |
| Weekly Mood Trend (Graph) | Recharts AreaChart of last 7 check-ins |
| Recommendation Card | Activity suggestion (Locked / Quick / Complete) |
| Conflict Alert | Amber banner if mood and journal signals conflict |
| Personalized Suggestion | `daily_suggestion` text from recommendation |
| Yesterday's Recommendation | Previous rec with completion status and rating |
| Mood Prediction Card | Tomorrow's predicted mood (Stage 1/2/3) |
| Recent Journal Preview | Latest journal text + NLP themes |

### High-Level Architecture
```
Browser (React + Tailwind)
  └── Dashboard.jsx
        ├── useApp() → AppContext (global state)
        ├── refreshDashboardData() → 8 concurrent API calls
        └── Renders cards from context state

AppContext.jsx
  └── Promise.allSettled([
        profileAPI.get(), moodAPI.getHistory(), journalAPI.getAll(),
        activitiesAPI.getFeedback(), recommendationAPI.getToday(),
        aiAPI.getPrediction(), aiAPI.getInsights(), insightsAPI.getAnalytics()
      ])

Django Backend (DRF + PostgreSQL)
  ├── /api/profile/           → ProfileView
  ├── /api/mood/history/      → MoodHistoryView
  ├── /api/journal/           → JournalListView
  ├── /api/activity-feedback/ → ActivityFeedbackView
  ├── /api/recommendation/today/ → TodayRecommendationView
  ├── /api/ai/prediction/     → MoodPredictionView
  ├── /api/ai/insights/       → AIInsightsView
  └── /api/insights/          → InsightsAnalyticsView
```

---

## 2. Dashboard Flow

```
User navigates to /app (Dashboard)
        │
        ▼
Dashboard.jsx mounts
  React.useEffect(() => { refreshDashboardData() }, [])
        │
        ▼
AppContext.jsx — refreshDashboardData()
  Sets all loading flags to true
  Fires Promise.allSettled([8 API calls concurrently])
        │
        ├── GET /api/profile/?today=YYYY-MM-DD
        │     └── ProfileView → InsightsService.get_user_progress() → recalculates wellness_score + streak
        │         → MoodPredictionService.predict() → returns predicted_mood
        │
        ├── GET /api/mood/history/
        │     └── MoodHistoryView → MoodService.get_user_history() → mood_moodlog table
        │
        ├── GET /api/journal/
        │     └── JournalListView → journal_journalentry table (with analysis JSON)
        │
        ├── GET /api/activity-feedback/
        │     └── ActivityFeedbackView → activities_activityfeedback table
        │
        ├── GET /api/recommendation/today/
        │     └── TodayRecommendationView → checks mood+journal state
        │         → locked / quick / complete response
        │
        ├── GET /api/ai/prediction/
        │     └── MoodPredictionView → MoodPredictionService.predict()
        │         → MoodPredictorModel.predict_next_day() (RandomForest)
        │
        ├── GET /api/ai/insights/
        │     └── AIInsightsView → AIInsightsService.generate_insights()
        │         → mood + journal + emotion data → profile_state, summary, focus
        │
        └── GET /api/insights/
              └── InsightsAnalyticsView → InsightsService.get_user_analytics()
                  → avg mood/stress/sleep, trend, recovery statement
        │
        ▼
Each result checked for status === 'fulfilled'
State variables updated: checkins, journals, userProfile, streak,
wellnessScore, todayRecommendation, predictionData, aiInsightsData, analyticsData
        │
        ▼
Dashboard.jsx re-renders
  ├── Quick Stats Grid (Wellness Score, Streak, Today's Mood)
  ├── Weekly Mood Trend Graph (Recharts AreaChart)
  ├── Recommendation Card (locked/quick/complete)
  ├── Mood Prediction Card (Stage 1/2/3)
  └── Recent Journal Preview (text + themes)
```

---

## 3. Frontend

### Files Involved
| File | Role |
|---|---|
| `Frontend/src/pages/Dashboard.jsx` | Main dashboard component — renders all cards |
| `Frontend/src/context/AppContext.jsx` | Global state + `refreshDashboardData()` |
| `Frontend/src/services/api.js` | All Axios call wrappers |
| `Frontend/src/App.jsx` | Route `/app` → `<Dashboard />` inside `<AppLayout />` |

### Components Used in Dashboard
- `YesterdayRecCard` — local sub-component inside `Dashboard.jsx` — renders previous recommendation with star rating
- `PageTransition` — wraps page in Framer Motion animation (used via AppLayout)
- `Recharts` — `ResponsiveContainer`, `AreaChart`, `Area`, `XAxis`, `Tooltip` — Weekly Mood Trend graph
- `motion.div` (Framer Motion) — stat card hover animation (`whileHover={{ y: -3 }}`)
- React Icons — `FiActivity`, `FiZap`, `FiSmile`, `FiCompass`, `FiBookOpen`, etc.

### Context API Usage
Dashboard calls `useApp()` which returns from `AppContext.jsx`:
```js
const {
  userProfile,        // name, email, etc.
  checkins,           // array of all mood logs
  journals,           // array of all journal entries
  streak,             // integer day count
  wellnessScore,      // integer 0–100 or null
  isOnboarded,        // boolean
  refreshDashboardData,
  todayRecommendation, recLoading,
  predictionData, predictionLoading
} = useApp();
```

### React Hooks Used
| Hook | Where | Purpose |
|---|---|---|
| `React.useEffect` | `Dashboard.jsx` | Calls `refreshDashboardData()` on mount |
| `useState` (in AppContext) | `AppContext.jsx` | Holds all state: checkins, journals, streak, etc. |
| `useCallback` | `AppContext.jsx` | Memoizes `refreshDashboardData`, `fetchUserProfile` |
| `useNavigate` | `Dashboard.jsx` | Navigate to `/app/checkin`, `/app/wellness` |
| `useContext` | via `useApp()` | Consumes AppContext |

### Axios Calls (all in api.js, fired from AppContext)
| Function | Method | URL |
|---|---|---|
| `profileAPI.get(todayStr)` | GET | `/api/profile/?today=YYYY-MM-DD` |
| `moodAPI.getHistory()` | GET | `/api/mood/history/` |
| `journalAPI.getAll()` | GET | `/api/journal/` |
| `activitiesAPI.getFeedback()` | GET | `/api/activity-feedback/` |
| `recommendationAPI.getToday()` | GET | `/api/recommendation/today/` |
| `aiAPI.getPrediction()` | GET | `/api/ai/prediction/` |
| `aiAPI.getInsights()` | GET | `/api/ai/insights/` |
| `insightsAPI.getAnalytics()` | GET | `/api/insights/` |

JWT token injected automatically by the request interceptor in `api.js`.

### State Management Summary
All dashboard data lives in `AppContext.jsx`. Dashboard.jsx only reads it via `useApp()`. No local state for data — only local computed values like `moodHistory` (array sliced from `checkins`) and `prediction` (computed from `predictionData` via `getPrediction()`).

### Card Rendering Logic
- Stats grid: built from `mockStats` array — values pulled from `wellnessScore`, `streak`, `todaysCheckin`
- Mood chart: `checkins.slice(-7)` → mapped to `{ date, mood, stress }` array → fed to Recharts
- Recommendation: conditional render based on `recommendation?.status` → `locked` / `quick` / `complete` / `wellness`
- Prediction: `getPrediction()` helper function returns a `case` string → determines which prediction UI to show
- Journal preview: `journals[0]` (most recent) → shows `text`, `date`, `isVoice`, `analysis.themes`


---

## 4. Backend

### APIs Used by Dashboard
| URL | View | Method |
|---|---|---|
| `/api/profile/` | `ProfileView` | GET |
| `/api/mood/history/` | `MoodHistoryView` | GET |
| `/api/journal/` | `JournalListView` | GET |
| `/api/activity-feedback/` | `ActivityFeedbackView` | GET |
| `/api/recommendation/today/` | `TodayRecommendationView` | GET |
| `/api/ai/prediction/` | `MoodPredictionView` | GET |
| `/api/ai/insights/` | `AIInsightsView` | GET |
| `/api/insights/` | `InsightsAnalyticsView` | GET |

All views have `permission_classes = [IsAuthenticated]` — JWT required.

### Views
- `ProfileView` (`users/views.py`) — calls `InsightsService.get_user_progress()` to recalculate wellness_score and streak, then returns full profile + predicted_mood
- `MoodHistoryView` (`mood/views.py`) — returns all `MoodLog` records for the user
- `TodayRecommendationView` (`recommendation/views.py`) — returns locked/quick/complete state based on whether mood and journal exist for today
- `MoodPredictionView` (`ai/views.py`) — always runs `MoodPredictionService.predict()` regardless of today's data; stage is determined by total log count
- `AIInsightsView` (`ai/views.py`) — checks if both mood and journal exist today; if not returns `pending: True`; if yes runs `AIInsightsService.generate_insights()`
- `InsightsAnalyticsView` (`insights/views.py`) — returns avg mood/stress/sleep + trend + recovery statement + daily_trends + cognitive themes

### Serializers
| Serializer | File | What It Does |
|---|---|---|
| `UserProfileSerializer` | `users/serializers.py` | Serializes UserProfile fields |
| `MoodLogSerializer` | `mood/serializers.py` | Serializes MoodLog fields |
| `RecommendationSerializer` | `recommendation/serializers.py` | Serializes Recommendation + nested TherapyActivity; computed fields: `reason`, `historical_matches`, `previous_success_rate` |
| `MoodPredictionResponseSerializer` | `ai/serializers.py` | Serializes prediction dict from `MoodPredictorModel` |
| `AIInsightsResponseSerializer` | `ai/serializers.py` | Serializes insights dict from `AIInsightsService` |

### Services Called on Dashboard Load
| Service | File | Called By |
|---|---|---|
| `InsightsService.get_user_progress()` | `insights/services.py` | `ProfileView.get()` |
| `InsightsService._calculate_wellness_for_range()` | `insights/services.py` | called inside `get_user_progress()` |
| `MoodService.calculate_streak()` | `mood/services.py` | called inside `get_user_progress()` |
| `MoodService.get_user_history()` | `mood/services.py` | `MoodHistoryView.get()` |
| `MoodPredictionService.predict()` | `ai/prediction/services.py` | `MoodPredictionView.get()` and `ProfileView.get()` |
| `MoodPredictorModel.predict_next_day()` | `ai/prediction/model.py` | called inside `MoodPredictionService.predict()` |
| `RecommendationService.get_today_recommendation()` | `recommendation/services.py` | `TodayRecommendationView.get()` |
| `QuickRecommendationService.get_quick_recommendation()` | `recommendation/services.py` | `TodayRecommendationView.get()` |
| `AIInsightsService.generate_insights()` | `ai/insights/services.py` | `AIInsightsView.get()` |
| `InsightsService.get_user_analytics()` | `insights/services.py` | `InsightsAnalyticsView.get()` |

### Models & Database Tables Accessed
| Model | Table | Used For |
|---|---|---|
| `UserProfile` | `users_userprofile` | streak, wellness_score, is_onboarded |
| `MoodLog` | `mood_moodlog` | all check-in data, mood history, chart |
| `JournalEntry` | `journal_journalentry` | journal preview, NLP analysis JSON |
| `Recommendation` | `recommendation_recommendation` | today's rec, yesterday's rec |
| `TherapyActivity` | `activities_therapyactivity` | nested in recommendation |
| `ActivityFeedback` | `activities_activityfeedback` | activity completion tracking |
| `EmotionAnalysis` | `ai_emotionanalysis` | used in insights and recommendation scoring |
| `AIInsight` | `ai_aiinsight` | stores generated insight summaries |
| `MoodPrediction` | `ai_moodprediction` | stores persisted predictions |

---

## 5. Dashboard Cards

### Wellness Score
- Data source: `wellnessScore` from AppContext → set by `InsightsService.get_user_progress()`
- API: `GET /api/profile/`
- Backend service: `InsightsService._calculate_wellness_for_range()` in `insights/services.py`
- Model/Table: `mood_moodlog`, `journal_journalentry`, `recommendation_recommendation`, `activities_activityfeedback`
- How it reaches UI: `ProfileView` calls `get_user_progress()` → saves `wellness_score` to `UserProfile` → serialized → AppContext sets `wellnessScore` → displayed as `{wellnessScore}/100`
- Formula: Recency-weighted (0.92^days_ago decay) blend of mood (25%), stress inverted (20%), sleep (15%), energy (10%), productivity (10%), journal sentiment (10%), rec completion (5%), activity feedback (5%), plus streak bonus and trend delta

### Daily Streak
- Data source: `streak` from AppContext
- API: `GET /api/profile/`
- Backend service: `MoodService.calculate_streak()` in `mood/services.py`
- Model/Table: `mood_moodlog`, `users_userprofile`
- How it reaches UI: `get_user_progress()` calls `calculate_streak()` → saves to `profile.streak` → serialized → AppContext sets `streak` → displayed as `{streak} Days`

### Today's Mood
- Data source: `checkins` array → `checkins.find(c => c.date === todayStr)`
- API: `GET /api/mood/history/`
- Backend service: `MoodService.get_user_history()`
- Model/Table: `mood_moodlog`
- How it reaches UI: If `todaysCheckin` found → shows `moodLabel`; else shows "Not Checked In"

### Weekly Mood Trend (Graph)
- Data source: `checkins.slice(-7)` → mapped to `{ date (MM/DD), mood, stress }`
- API: `GET /api/mood/history/`
- Backend service: `MoodService.get_user_history()`
- Model/Table: `mood_moodlog`
- How it reaches UI: Recharts `AreaChart` with orange gradient fill. X-axis = date, Y-axis = mood. If no data → dashed empty state placeholder.

### Recommendation Card (Locked / Quick / Complete)
- Data source: `todayRecommendation` from AppContext
- API: `GET /api/recommendation/today/`
- Backend service: `TodayRecommendationView` → `QuickRecommendationService` or `RecommendationService`
- Model/Table: `recommendation_recommendation`, `activities_therapyactivity`
- How it reaches UI: Three states based on `recommendation.status`:
  - `locked` → no mood today → shows yesterday's rec card
  - `quick` → mood exists, no journal → shows activity title, reason, confidence, score; upgrade prompt shown
  - `complete` / `wellness` → both mood and journal exist → shows full activity, confidence, score, historical_matches, success_rate

### Personalized Suggestion
- Data source: `recommendation.daily_suggestion` field from `Recommendation` model
- API: same as recommendation (`GET /api/recommendation/today/`)
- Backend service: generated inside `_generate_recommendation_logic()` in `recommendation/services.py`
- Model/Table: `recommendation_recommendation`
- How it reaches UI: Shown as an indigo info box inside the recommendation card when `recommendation.daily_suggestion` is not null

### Conflict Alert Banner
- Data source: `recommendation.has_conflict` and `recommendation.conflict_reason`
- API: `GET /api/recommendation/today/`
- Backend service: `RecommendationService._detect_conflict()` — compares `mood_log.mood` with `journal_entry.analysis.sentiment`
- How it reaches UI: Amber warning card shown above recommendation card only when `recommendation.has_conflict === true`

### Yesterday's Recommendation (`YesterdayRecCard`)
- Data source: `recommendation.yesterday_recommendation` object in the recommendation API response
- API: `GET /api/recommendation/today/`
- Backend: `TodayRecommendationView` queries `Recommendation.objects.filter(user, date__lt=today).order_by('-created_at').first()`
- Shows: activity name, completed/ignored badge, mood improvement string, star rating, date

### Mood Prediction Card
- Data source: `predictionData` from AppContext
- API: `GET /api/ai/prediction/`
- Backend service: `MoodPredictionService.predict()` → `MoodPredictorModel.predict_next_day()`
- Model/Table: `mood_moodlog` (features), `journal_journalentry` (sentiment), `ai_moodprediction` (persisted)
- How it reaches UI: `getPrediction()` helper in Dashboard.jsx computes `case` string from `predictionData`:
  - `zero_logs` / `not_onboarded` → basic prompt to start check-ins
  - `learning` → progress bar (logCount / 7)
  - `basic` (Stage 2, 7–29 logs) → mood_label + confidence + why + risk/protective factors
  - `personalized` (Stage 3, 30+ logs) → full prediction with risk factors and protective factors

### Recent Journal Preview
- Data source: `journals[0]` (most recent) from AppContext
- API: `GET /api/journal/`
- Backend service: `JournalListView` in `journal/views.py`
- Model/Table: `journal_journalentry`
- How it reaches UI: Shows `journals[0].text` (clamped to 3 lines), date, `isVoice` badge, and `analysis.themes` as pill tags. If no journals → dashed empty state with "Write Entry" link.

### AI Insights (used in Insights page, fed from Dashboard data)
- Data source: `aiInsightsData` from AppContext
- API: `GET /api/ai/insights/`
- Backend service: `AIInsightsService.generate_insights()`
- Model/Table: `mood_moodlog`, `journal_journalentry`, `ai_emotionanalysis`, `recommendation_recommendation`
- Note: Dashboard loads this data via `refreshDashboardData()` but the detailed Insights display is on `/app/insights`. The Dashboard's journal card indirectly shows NLP themes from `analysis.themes`.

---

## 6. NLP & AI Connection

### How Dashboard Uses NLP Results
The Dashboard does NOT call NLP endpoints directly. NLP runs when a journal is saved (`POST /api/journal/`). The results are stored inside `JournalEntry.analysis` as a JSON field. The Dashboard just reads that stored JSON.

```
JournalEntry.analysis = {
  "sentiment": "Negative",       ← used in recommendation conflict detection
  "emotion": "Anxiety",          ← used in recommendation scoring
  "themes": ["stress", "work"],  ← shown as tags in Journal Preview card
  "sentences": [...]             ← used in detailed recommendation reasoning
}
```

### Sentiment
- Stored in `journal_journalentry.analysis["sentiment"]` → values: Positive / Negative / Neutral
- Used by `RecommendationService._detect_conflict()` to compare with mood score
- Used by `InsightsService._calculate_wellness_for_range()` — Positive=100, Negative=15, Neutral=55
- Used by `MoodPredictorModel.extract_features_for_day()` — converted to float: +1.0 / -1.0 / 0.0

### Emotion
- Stored in `journal_journalentry.analysis["emotion"]` and `ai_emotionanalysis` table
- Used by `AIInsightsService` — top 3 emotions identified from `EmotionAnalysis` records
- Used by `RecommendationService` to route clinical target (e.g. Anxiety → act-1 breathing)
- Used in ML feature vector as `pos_emotions` (1/0) and `neg_emotions` (1/0) flags

### Topics / Themes
- Stored in `journal_journalentry.analysis["themes"]` — list of strings
- Shown in Dashboard as pill tags on the Journal Preview card
- Used by `RecommendationService._generate_recommendation_logic()` — themes matched against activity categories for theme_score (25% of recommendation score)
- Used by `AIInsightsService` — top 3 themes used to determine `primary_focus` and `s2` insight sentence

### Recommendation Engine (Dashboard Connection)
- Dashboard reads final result from `GET /api/recommendation/today/`
- The engine (`RecommendationService`) scores every `TherapyActivity` using 5 factors:
  1. Current mood/state (30%) — mood, stress, sleep, energy
  2. Theme similarity (25%) — journal themes matched to activity keywords
  3. Historical success (20%) — past improvement scores
  4. User feedback satisfaction (15%) — past ratings
  5. Diversity penalty (10%) — avoids recently done activities
- Dashboard shows: title, reason list, confidence %, score, historical_matches, success_rate, daily_suggestion

### Mood Prediction (Dashboard Connection)
- 3-Stage RandomForest model (`MoodPredictorModel`) in `ai/prediction/model.py`
- Features: mood, stress, energy, sleep, productivity, social, sentiment_score, pos_emotions, neg_emotions, activities_completed (10 features per day)
- Stage 1 (<7 logs): no prediction, progress bar shown
- Stage 2 (7–29 logs): basic prediction with medium confidence, 7-day trend
- Stage 3 (30+ logs): full personalized prediction — 30-day trend, risk/protective factors, variability penalty

### Wellness Score (Dashboard Connection)
- Calculated by `InsightsService._calculate_wellness_for_range()` in `insights/services.py`
- Uses exponential decay weighting (`0.92^days_ago`) so recent days count more
- Factors: mood, inverted stress, sleep, energy, productivity (from MoodLog) + journal sentiment + recommendation completion + activity feedback satisfaction
- Streak bonus: `min(10, streak * 1.5)` added on top
- Crisis penalty: -20 if any CrisisAlert exists in range
- Final range: clamped to 10–100

---

## 7. Technologies Used

| Technology | Where Used in Dashboard |
|---|---|
| React | `Dashboard.jsx` — functional component, hooks, conditional rendering of all cards |
| Context API | `AppContext.jsx` — provides `checkins`, `journals`, `streak`, `wellnessScore`, `todayRecommendation`, `predictionData` etc. to Dashboard via `useApp()` |
| Axios | `api.js` — all 8 GET requests; request interceptor injects JWT; response interceptor auto-refreshes expired tokens |
| React Router | `App.jsx` — route `/app` → `<Dashboard />` inside `<AppLayout />`; `useNavigate` in Dashboard for "Log Check-in" and "Start Activity" buttons; `<Link>` for "Full Analytics" and "View All" journal |
| Tailwind CSS | All UI styling in `Dashboard.jsx` — responsive grid (`grid-cols-12`), dark mode (`dark:`), gradient backgrounds, rounded cards |
| Framer Motion | Stat card hover animation (`whileHover={{ y:-3 }}`), imported as `motion.div` |
| Recharts | Weekly Mood Trend AreaChart — `ResponsiveContainer`, `AreaChart`, `Area`, `XAxis`, `Tooltip` |
| Django | All backend views — `APIView` subclasses in `views.py` files across mood, recommendation, ai, insights, users apps |
| Django REST Framework | `APIView`, `IsAuthenticated`, `Response`, `status` — used in every dashboard backend view; serializers for all responses |
| PostgreSQL | All data stored and queried via Django ORM — tables: mood_moodlog, journal_journalentry, recommendation_recommendation, users_userprofile, ai_emotionanalysis, ai_moodprediction |
| Django ORM | `MoodLog.objects.filter()`, `Recommendation.objects.filter()`, `UserProfile.objects.get_or_create()`, aggregate `Avg()` — all in services |
| JWT | `api.js` interceptor reads `access_token` from localStorage/sessionStorage → `Authorization: Bearer <token>`; auto-refresh on 401 |
| Scikit-learn | `RandomForestClassifier` in `ai/prediction/model.py` — `n_estimators=150`, `max_depth=7`; trained on real + 200 synthetic samples; saved as `mood_predictor.pkl` via `joblib` |
| NLP (custom) | `ai/utils/preprocessing.py` — `analyze_text_nlp()` — used for journal themes, emotion, sentiment stored in `JournalEntry.analysis`; results read by Dashboard indirectly |


---

## 8. Important Functions

### `refreshDashboardData()` — `AppContext.jsx`
- Purpose: Master data fetch — re-fetches all dashboard data after any mutation or on page load
- Input: None
- Output: Updates 8 context state variables
- Calls next: `fetchUserProfile()`, `moodAPI.getHistory()`, `journalAPI.getAll()`, `activitiesAPI.getFeedback()`, `recommendationAPI.getToday()`, `aiAPI.getPrediction()`, `aiAPI.getInsights()`, `insightsAPI.getAnalytics()` — all via `Promise.allSettled`

### `fetchUserProfile()` — `AppContext.jsx`
- Purpose: Fetches and maps profile data from backend, updates `userProfile`, `streak`, `wellnessScore`, `isOnboarded`
- Input: None (uses `getUTCDateString()` internally for today param)
- Output: Updates `userProfile`, `streak`, `wellnessScore`, `isOnboarded` state
- Calls next: `profileAPI.get(todayStr)` → `ProfileView.get()`

### `ProfileView.get()` — `users/views.py`
- Purpose: Returns full user profile + recalculates wellness score + runs prediction
- Input: `request` (JWT authenticated), optional `?today=` query param
- Output: Serialized UserProfile + `predicted_mood`
- Calls next: `InsightsService.get_user_progress()`, `MoodPredictionService.predict()`

### `InsightsService.get_user_progress()` — `insights/services.py`
- Purpose: Calculates wellness score for 3 weekly ranges, recalculates streak, builds badges
- Input: `user`, optional `today` date
- Output: Dict with `wellnessScore`, `streak`, `badges`, `history`, `has_wellness_score`
- Calls next: `_calculate_wellness_for_range()` (3 times), `MoodService.calculate_streak()`

### `InsightsService._calculate_wellness_for_range()` — `insights/services.py`
- Purpose: Recency-weighted wellness score from mood logs, journals, recommendations, activity feedback
- Input: `user`, `start_date`, `end_date`
- Output: Integer score 10–100, or `None` if no data
- Calls next: Nothing (pure calculation using ORM queries)

### `TodayRecommendationView.get()` — `recommendation/views.py`
- Purpose: Returns the correct recommendation state (locked/quick/complete) based on today's data
- Input: `request` (JWT authenticated)
- Output: JSON with `status`, `activity`, `reason`, `confidence`, `has_conflict`, `yesterday_recommendation`
- Calls next: `QuickRecommendationService.get_quick_recommendation()` or `RecommendationService.get_today_recommendation()`

### `MoodPredictionService.predict()` — `ai/prediction/services.py`
- Purpose: Runs the prediction pipeline and persists result if real prediction available
- Input: `user`
- Output: Dict with `has_prediction`, `stage`, `predicted_mood`, `mood_label`, `confidence`, `why`, `risk_factors`, `protective_factors`
- Calls next: `MoodPredictorModel.predict_next_day(user)`

### `MoodPredictorModel.predict_next_day()` — `ai/prediction/model.py`
- Purpose: 3-stage RandomForest prediction of tomorrow's mood
- Input: `user`
- Output: Full prediction dict (stage-dependent)
- Calls next: `get_model()`, `extract_features_for_day()`, `_build_stage2_result()` or `_build_stage3_result()`

### `AIInsightsService.generate_insights()` — `ai/insights/services.py`
- Purpose: Synthesizes mood logs, journals, emotions into weekly reflection, focus area, profile state
- Input: `user`
- Output: Dict with `weekly_summary`, `profile_state`, `primary_focus_area`, `supporting_habit`, `recovery_spectrum`
- Calls next: Persists `AIInsight.objects.create()`, queries `EmotionAnalysis`, `JournalEntry`, `MoodLog`

### `getPrediction()` — `Dashboard.jsx` (local helper)
- Purpose: Maps raw `predictionData` from API into a `case` string for conditional rendering
- Input: Reads `predictionData`, `predictionLoading`, `isOnboarded`, `checkins.length` from context
- Output: Object with `case` (zero_logs/learning/basic/personalized/loading), `status` (positive/warning/neutral), and prediction fields
- Calls next: Nothing (pure mapping function)

---

## 9. Complete Data Flow Diagram

```
USER opens /app (Dashboard)
        │
        ▼
[1] Dashboard.jsx mounts
    React.useEffect(() => { refreshDashboardData() }, [])
        │
        ▼
[2] AppContext.jsx — refreshDashboardData()
    Sets: recLoading=true, predictionLoading=true, insightsLoading=true, analyticsLoading=true
        │
        ▼
[3] Promise.allSettled fires 8 API calls at once ─────────────────────────────────────────┐
        │                                                                                   │
    ┌───┴──────────────────────────────────────────────────────────────────┐               │
    │ GET /api/profile/?today=2026-08-06                                   │  (and 7 more) │
    │   ProfileView.get()                                                   │               │
    │     → InsightsService.get_user_progress()                            │               │
    │         → _calculate_wellness_for_range() × 3 (Week1/2/3)           │               │
    │         → MoodService.calculate_streak()                             │               │
    │         → profile.wellness_score = 73, profile.streak = 5, save()   │               │
    │     → MoodPredictionService.predict()                                │               │
    │         → MoodPredictorModel.predict_next_day()                      │               │
    │             → get_model() → load mood_predictor.pkl (RandomForest)   │               │
    │             → extract_features_for_day() → [10 feature floats]       │               │
    │             → clf.predict() → predicted_mood = 4                     │               │
    │             → _build_stage3_result() → risk/protective factors       │               │
    │     → Returns: { wellness_score:73, streak:5, predicted_mood:4, ...} │               │
    └──────────────────────────────────────────────────────────────────────┘               │
                                                                                            │
    ┌──────────────────────────────────────────────────────────────────────┐               │
    │ GET /api/mood/history/                                                │◄──────────────┘
    │   MoodHistoryView.get()                                               │
    │     → MoodService.get_user_history(user)                             │
    │     → MoodLog.objects.filter(user=user)                              │
    │     → Returns: [{id, date, mood, mood_label, stress, energy, ...}]   │
    └──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────┐
    │ GET /api/recommendation/today/                                        │
    │   TodayRecommendationView.get()                                       │
    │     → has_mood? has_journal?                                          │
    │     → If both: RecommendationService.get_today_recommendation()       │
    │         → _generate_recommendation_logic() scores all activities      │
    │         → picks highest scoring activity                              │
    │         → Returns: { status:"complete", activity:{...}, reason:[...], │
    │                       confidence:87, has_conflict:false, ...}         │
    └──────────────────────────────────────────────────────────────────────┘
        │
        ▼
[4] All 8 results collected by Promise.allSettled
    Each checked: if status === 'fulfilled' && value.status === 200
        │
        ▼
[5] AppContext state updated:
    setCheckins([...mappedCheckins.reverse()])
    setJournals([...mappedJournals])
    setStreak(profileData.streak)
    setWellnessScore(profileData.wellness_score)
    setTodayRecommendation(recRes.value.data)
    setPredictionData(predRes.value.data)
    setAiInsightsData(insightsRes.value.data)
    setAnalyticsData(analyticsRes.value.data)
    Loading flags set to false
        │
        ▼
[6] Dashboard.jsx re-renders with fresh data
    ├── Quick Stats: wellnessScore=73/100, streak=5 Days, mood="Good"
    ├── Chart: checkins.slice(-7) → 7 data points → Recharts AreaChart
    ├── Recommendation: status="complete" → activity title + reasons + confidence 87%
    ├── Prediction: case="personalized" → mood_label="Good", why=..., risk_factors=[...]
    └── Journal: journals[0].text + analysis.themes as pill tags
```

---

## 10. Edge Cases

| Edge Case | What Happens |
|---|---|
| New user (no check-ins, no journals) | `InsightsService.get_user_progress()` returns `has_wellness_score: false`, wellness shows "--". Prediction shows "zero_logs" case. Recommendation is "locked". Journal shows empty dashed state. Streak = 0. |
| No journal today (only mood done) | Recommendation returns `status: "quick"` — shows Quick AI Match. AI Insights returns `pending: true`. Prediction still runs (uses log history). Amber upgrade prompt shown. |
| No recommendation (locked state) | Recommendation shows "Log today's check-in to unlock" + `YesterdayRecCard` if yesterday's rec exists |
| No prediction (< 7 logs) | `getPrediction()` returns `case: 'learning'` → progress bar (logCount / 7) shown instead of prediction data |
| API failure (one of the 8 calls) | `Promise.allSettled` does NOT abort others. Failed call has `status: 'rejected'`. That state variable stays at its previous value (not updated). Loading flag still set to false. No crash. |
| Loading state | `recLoading`, `predictionLoading`, `insightsLoading`, `analyticsLoading` flags control skeleton text ("Loading matches...", "Calculating mood prediction...") while data is in-flight |
| Empty mood history (graph) | `moodHistory.length === 0` → dashed empty state shown instead of chart: "Complete your first Check-in to build trend data." |
| JWT expired during dashboard load | `api.js` response interceptor catches 401 → tries refresh token → if refresh succeeds, retries all calls; if refresh fails, dispatches `auth_session_expired` → `clearAuthData()` → user logged out |
| Prediction confidence variability | Stage 3 uses `variability_penalty = min(0.15, mood_std * 0.05)` — high mood variability reduces confidence automatically |
| No previous recommendation | `YesterdayRecCard` receives `data=null` → renders "No previous recommendation available." fallback |

---

## 11. Viva Questions & Answers

**Q1. What does the Dashboard load on mount and how?**
A: `Dashboard.jsx` calls `refreshDashboardData()` inside `React.useEffect(() => {...}, [])`. This fires 8 API calls concurrently using `Promise.allSettled` in `AppContext.jsx` and updates all context state variables when results return.

**Q2. Why `Promise.allSettled` instead of `Promise.all`?**
A: `Promise.all` fails entirely if any single call fails. `Promise.allSettled` always resolves — each result has a `status` of `'fulfilled'` or `'rejected'`. Dashboard can still show all other cards even if one API (e.g. AI insights) fails.

**Q3. How does the Dashboard know if the user has already done today's check-in?**
A: `const todayStr = new Date().toISOString().split('T')[0]` (UTC). Then `checkins.find(c => c.date === todayStr)`. If found → `todaysCheckin` is set and used in the "Today's Mood" stat card.

**Q4. Explain the three Recommendation states on the Dashboard.**
A: `TodayRecommendationView` checks: if no mood today → `status: "locked"` (shows yesterday's rec). If mood but no journal → `status: "quick"` (shows Quick AI Match). If both → `status: "complete"` or `"wellness"` (shows full Deep AI Match with all scoring factors).

**Q5. What is the difference between Quick Recommendation and Complete Recommendation?**
A: Quick uses only mood score (no journal). It routes to a clinical activity based on stress/energy/sleep thresholds. Complete uses the full 5-factor scoring system including journal themes (25%), emotion analysis, historical success, user feedback, and diversity penalty. Quick is `rec_type='quick'` in the DB.

**Q6. What does the Wellness Score represent and how is it calculated?**
A: It's a 0–100 score reflecting overall mental wellness for the past 7 days. Calculated by `InsightsService._calculate_wellness_for_range()` using exponential decay weighting (0.92^days_ago): mood (25%), inverted stress (20%), sleep (15%), energy (10%), productivity (10%), journal sentiment (10%), recommendation completion (5%), activity feedback (5%). Streak bonus and mood trend delta are added on top. Clamped to 10–100.

**Q7. Explain the 3 stages of Mood Prediction.**
A: Stage 1 (<7 logs): no prediction — shows progress bar. Stage 2 (7–29 logs): basic RandomForest prediction using last 7 days, medium confidence (capped at 0.74). Stage 3 (30+ logs): full personalized prediction — 30-day trend, variability penalty applied to confidence, risk and protective factors listed.

**Q8. What are the 10 ML features used for mood prediction?**
A: `[mood, stress, energy, sleep, productivity, social, sentiment_score, pos_emotions, neg_emotions, activities_completed]` — extracted per day from `MoodLog`, `JournalEntry.analysis`, and `ActivityFeedback` in `MoodPredictorModel.extract_features_for_day()`.

**Q9. What ML model does MindCompass use for prediction and where is it stored?**
A: `RandomForestClassifier` from scikit-learn (`n_estimators=150, max_depth=7`). Saved as `mood_predictor.pkl` via `joblib` at `Backend/ai/prediction/mood_predictor.pkl`. Loaded with `joblib.load(MODEL_PATH)`. If the file doesn't exist, `train_model()` is called to retrain.

**Q10. How does the Recommendation Engine handle a conflict between mood and journal?**
A: `RecommendationService._detect_conflict()` compares `mood_log.mood >= 4` with `journal_sentiment == "Negative"` (and vice versa). If conflict detected, the `has_conflict` flag and `conflict_reason` string are attached to the `Recommendation` object as transient attributes. Dashboard shows the amber conflict banner and the recommendation logic leans toward the journal signal.

**Q11. Where are NLP results stored and how does the Dashboard read them?**
A: NLP runs when a journal is saved. Results are stored in `JournalEntry.analysis` as a JSON field (sentiment, emotion, themes, sentences). The Dashboard reads `journals[0].analysis.themes` for the journal preview pill tags. The recommendation and wellness services read `analysis["sentiment"]` and `analysis["emotion"]` from this same JSON field.

**Q12. How does the Recent Journal card display NLP themes?**
A: `journals[0].analysis?.themes` — an array of strings stored in the `JournalEntry.analysis` JSON field. Each theme is rendered as a pill tag: `<span>{theme}</span>`.

**Q13. What is the `YesterdayRecCard` component and where is it defined?**
A: A local React component defined at the top of `Dashboard.jsx`. It renders the most recent past recommendation with: activity name, completed/ignored badge, star rating (`renderStars()`), mood improvement string, and the date. It receives `data` from `recommendation.yesterday_recommendation` in the API response.

**Q14. How is the Weekly Mood Trend chart built?**
A: `checkins.slice(-7)` gives the last 7 check-ins. Mapped to `{ date: 'MM/DD', mood, stress }`. Fed into Recharts `<AreaChart>`. Orange gradient fill (`linearGradient id="colorMood"`). Only mood is plotted (not stress). If array is empty → dashed placeholder shown.

**Q15. How does Dashboard know the Recommendation is "complete" vs "quick"?**
A: The `status` field in the `GET /api/recommendation/today/` response. The view sets it to `"quick"` if journal is missing, `"complete"` if both mood and journal exist, or `"wellness"` if the activity `rec_type == 'wellness'`.

**Q16. Where is `streak` stored and how does it reach the Dashboard?**
A: In `UserProfile.streak` (integer) in `users_userprofile` table. `InsightsService.get_user_progress()` calls `MoodService.calculate_streak()` and saves the result. `ProfileView` serializes it. `AppContext.fetchUserProfile()` sets `setStreak(profileData.streak)`. Dashboard reads `streak` from `useApp()`.

**Q17. What happens to the Dashboard if the user has no journals at all?**
A: Journal Preview shows an empty dashed state with "Write Entry" link. AI Insights returns `pending: true` from `AIInsightsView`. Recommendation stays in `quick` state (no journal → can't upgrade to complete). Mood Prediction still works based on check-in history.

**Q18. How does the Personalized Suggestion get generated and displayed?**
A: `Recommendation.daily_suggestion` is a TextField populated inside `_generate_recommendation_logic()` in `recommendation/services.py`. It's included in `RecommendationSerializer`. The Dashboard renders it as an indigo info box when `recommendation.daily_suggestion` is not null/empty.

**Q19. How does `refreshDashboardData()` handle partial failures?**
A: Via `Promise.allSettled`. Each result is checked: `if (moodRes.status === 'fulfilled' && moodRes.value?.status === 200 && Array.isArray(moodRes.value.data))`. If any check fails, that state is simply not updated — the old value remains. No error is thrown to the user.

**Q20. What does `AppContext` store that Dashboard uses?**
A: `userProfile` (name), `checkins` (all MoodLogs), `journals` (all JournalEntries), `streak` (integer), `wellnessScore` (integer/null), `isOnboarded` (bool), `todayRecommendation` (full rec object), `recLoading`, `predictionData` (full prediction), `predictionLoading`, `aiInsightsData`, `analyticsData`.

**Q21. What happens when the JWT expires during a Dashboard load?**
A: `api.js` response interceptor catches HTTP 401. Sets `originalRequest._retry = true`. POSTs to `/api/auth/refresh/` with `refresh_token` from storage. If successful, stores new `access_token` and retries the original request. If refresh fails → clears all tokens → dispatches `auth_session_expired` event → `AppContext` calls `clearAuthData()` → user is logged out.

**Q22. Why does `profileAPI.get()` receive a `todayStr` parameter?**
A: The backend `InsightsService.get_user_progress()` needs to know the client's current UTC date to correctly calculate which 7-day window to score for wellness. Without it, the backend uses `timezone.localdate()` which is already UTC, but passing it explicitly ensures both sides agree on the date boundary.

**Q23. How does `getPrediction()` work in Dashboard.jsx?**
A: It's a pure helper function that reads `predictionData` from context and maps it to a `case` string. If `!isOnboarded` → `not_onboarded`. If loading → `loading`. If no data and logCount < 7 → `learning`. If `predictionData.has_prediction === false` → `learning`. If `predictionData.stage === 3` → `personalized`, else → `basic`. This case string drives conditional rendering.

**Q24. How are the 3 Quick Stats (Wellness, Streak, Mood) built?**
A: Defined as a `mockStats` array inside `Dashboard.jsx`:
```js
const mockStats = [
  { label: 'Wellness Score', val: `${wellnessScore}/100`, ... },
  { label: 'Daily Streak', val: `${streak} Days`, ... },
  { label: "Today's Mood", val: todaysCheckin ? todaysCheckin.moodLabel : 'Not Checked In', ... }
]
```
Mapped to `<motion.div>` cards with `whileHover={{ y: -3 }}`.

**Q25. What is the route for the Dashboard and how is it protected?**
A: Route `/app` → `<Dashboard />` inside `<AppLayout />` in `App.jsx`. `AppLayout` (from `Frontend/src/layouts/`) handles authentication guards — if the user is not authenticated (`!token`), it redirects to `/login`. `token` comes from `AppContext` which reads `access_token` from localStorage/sessionStorage on init.
