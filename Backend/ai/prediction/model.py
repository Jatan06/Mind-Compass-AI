import os
import numpy as np
import joblib
from django.conf import settings
from sklearn.ensemble import RandomForestClassifier
import random

from mood.models import MoodLog
from journal.models import JournalEntry
from activities.models import ActivityFeedback

MODEL_PATH = os.path.join(os.path.dirname(__file__), "mood_predictor.pkl")

MOOD_LABELS = {
    1: "Difficult",
    2: "Low",
    3: "Calm",
    4: "Good",
    5: "Excellent"
}


class MoodPredictorModel:

    # ─────────────────────────────────────────────────────────────
    #  Shared helpers
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def get_feature_names(cls):
        return [
            "mood", "stress", "energy", "sleep", "productivity", "social",
            "sentiment_score", "pos_emotions", "neg_emotions", "activities_completed"
        ]

    @classmethod
    def extract_features_for_day(cls, user, date_obj):
        """Extracts a 10-element feature vector for a single calendar date."""
        log = MoodLog.objects.filter(user=user, date=date_obj).first()
        if not log:
            return None

        mood = log.mood
        stress = log.stress
        energy = log.energy
        sleep = float(log.sleep) if log.sleep else 7.0
        productivity = log.productivity
        social = log.social

        sentiment_score = 0.0
        pos_emotions = 0
        neg_emotions = 0

        journal = JournalEntry.objects.filter(user=user, created_at__date=date_obj).first()
        if journal and journal.analysis:
            sent = journal.analysis.get("sentiment", "Neutral")
            if sent == "Positive":
                sentiment_score = 1.0
            elif sent == "Negative":
                sentiment_score = -1.0

            em = journal.analysis.get("emotion", "Calm")
            if em in ["Happy", "Calm", "Hopeful", "Excited"]:
                pos_emotions = 1
            elif em in ["Sad", "Angry", "Fear", "Anxiety", "Stress", "Frustrated", "Lonely", "Overwhelmed"]:
                neg_emotions = 1

        activities_count = ActivityFeedback.objects.filter(user=user, created_at__date=date_obj).count()

        return [
            float(mood), float(stress), float(energy), float(sleep),
            float(productivity), float(social), sentiment_score,
            float(pos_emotions), float(neg_emotions), float(activities_count)
        ]

    # ─────────────────────────────────────────────────────────────
    #  RF model management
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def generate_synthetic_training_data(cls):
        X, y = [], []
        for _ in range(200):
            sleep = random.uniform(4.0, 9.5)
            stress = random.randint(1, 10)
            energy = random.randint(1, 10)
            mood = random.randint(1, 5)
            productivity = random.randint(2, 9)
            social = random.randint(2, 9)

            if mood >= 4 and stress <= 4:
                sentiment = 1.0; pos_em = 1; neg_em = 0
            elif mood <= 2 or stress >= 7:
                sentiment = -1.0; pos_em = 0; neg_em = 1
            else:
                sentiment = 0.0; pos_em = 0; neg_em = 0

            act_count = random.randint(0, 3)
            features = [float(mood), float(stress), float(energy), sleep,
                        float(productivity), float(social), sentiment,
                        float(pos_em), float(neg_em), float(act_count)]
            X.append(features)

            tomorrow = mood
            if stress >= 7: tomorrow -= 1
            if sleep < 6.0: tomorrow -= 1
            if energy >= 7 and stress < 5: tomorrow += 1
            if act_count >= 2: tomorrow += 1
            y.append(max(1, min(5, tomorrow)))
        return np.array(X), np.array(y)

    @classmethod
    def get_model(cls):
        if not os.path.exists(MODEL_PATH):
            cls.train_model()
        try:
            return joblib.load(MODEL_PATH)
        except Exception:
            cls.train_model()
            return joblib.load(MODEL_PATH)

    @classmethod
    def train_model(cls):
        X_real, y_real = [], []
        all_logs = MoodLog.objects.all().order_by('user', 'date')
        user_logs = {}
        for log in all_logs:
            user_logs.setdefault(log.user_id, []).append(log)

        for uid, logs in user_logs.items():
            for i in range(len(logs) - 1):
                tlog = logs[i]; nlog = logs[i + 1]
                if (nlog.date - tlog.date).days == 1:
                    feats = cls.extract_features_for_day(tlog.user, tlog.date)
                    if feats:
                        X_real.append(feats)
                        y_real.append(nlog.mood)

        X_syn, y_syn = cls.generate_synthetic_training_data()
        if X_real:
            X = np.vstack([X_syn, np.array(X_real)])
            y = np.concatenate([y_syn, np.array(y_real)])
        else:
            X, y = X_syn, y_syn

        clf = RandomForestClassifier(n_estimators=150, max_depth=7, random_state=42)
        clf.fit(X, y)
        joblib.dump(clf, MODEL_PATH)

    # ─────────────────────────────────────────────────────────────
    #  Main prediction entry point
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def predict_next_day(cls, user):
        """
        3-stage adaptive prediction:
          Stage 1: < 7 logs  → no prediction
          Stage 2: 7–29 logs → basic trend-aware prediction (medium confidence)
          Stage 3: 30+ logs  → full personalized prediction (high confidence)
        """
        from django.utils import timezone
        today = timezone.localdate()

        logs_qs = MoodLog.objects.filter(user=user).order_by('date')
        log_count = logs_qs.count()

        # ── Stage 1 ─────────────────────────────────────────────
        if log_count < 7:
            days_remaining = 7 - log_count
            return {
                "has_prediction": False,
                "stage": 1,
                "predicted_mood": None,
                "mood_label": None,
                "confidence": None,
                "confidence_label": None,
                "why": None,
                "evidence": None,
                "risk_factors": None,
                "protective_factors": None,
                "message": (
                    f"We're still learning your emotional patterns. "
                    f"Continue checking in daily — predictions become available after at least 7 days of history "
                    f"({days_remaining} day{'s' if days_remaining != 1 else ''} to go)."
                )
            }

        # Determine stage
        stage = 2 if log_count < 30 else 3

        # ── Load RF model ────────────────────────────────────────
        clf = cls.get_model()

        # Use latest log as today's feature vector
        latest_log = logs_qs.last()
        features = cls.extract_features_for_day(user, latest_log.date)
        if not features:
            # Shouldn't happen since logs exist, but guard anyway
            return {
                "has_prediction": False,
                "stage": stage,
                "predicted_mood": None,
                "mood_label": None,
                "confidence": None,
                "confidence_label": None,
                "why": None,
                "evidence": None,
                "risk_factors": None,
                "protective_factors": None,
                "message": "Could not extract features for the latest check-in. Please try again after logging today."
            }

        x_input = np.array([features])
        predicted_mood = int(clf.predict(x_input)[0])
        raw_conf = float(np.max(clf.predict_proba(x_input)[0]))

        # ── Stage 2 logic ────────────────────────────────────────
        if stage == 2:
            return cls._build_stage2_result(
                user, logs_qs, predicted_mood, raw_conf, features
            )

        # ── Stage 3 logic ────────────────────────────────────────
        return cls._build_stage3_result(
            user, logs_qs, predicted_mood, raw_conf, features, today
        )

    # ─────────────────────────────────────────────────────────────
    #  Stage 2 – basic trend prediction
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def _build_stage2_result(cls, user, logs_qs, predicted_mood, raw_conf, features):
        recent = list(logs_qs.order_by('-date')[:7])[::-1]  # oldest→newest

        mood_vals = [l.mood for l in recent]
        stress_vals = [l.stress for l in recent]
        sleep_vals = [float(l.sleep) for l in recent]
        energy_vals = [l.energy for l in recent]

        mood_start = round(sum(mood_vals[:3]) / 3, 1)
        mood_end   = round(sum(mood_vals[-3:]) / 3, 1)
        stress_avg = round(sum(stress_vals) / len(stress_vals), 1)
        sleep_avg  = round(sum(sleep_vals) / len(sleep_vals), 1)
        energy_avg = round(sum(energy_vals) / len(energy_vals), 1)

        # Trend direction
        mood_delta = mood_end - mood_start
        mood_trend_label = (
            "been improving" if mood_delta > 0.3
            else "been declining" if mood_delta < -0.3
            else "remained stable"
        )

        # Journal sentiment summary
        journals = JournalEntry.objects.filter(user=user).order_by('-created_at')[:7]
        sentiments = [j.analysis.get("sentiment", "Neutral") for j in journals if j.analysis]
        pos_count = sentiments.count("Positive")
        neg_count = sentiments.count("Negative")
        sentiment_note = ""
        if pos_count > neg_count:
            sentiment_note = " Positive journaling expressions are supporting your outlook."
        elif neg_count > pos_count:
            sentiment_note = " Elevated negative sentiment in your journal entries may weigh on energy."

        # Cap confidence to medium range (0.50 – 0.74)
        confidence = round(min(0.74, max(0.50, raw_conf)), 2)

        # Build why
        stress_note = ""
        if stress_avg >= 6.5:
            stress_note = f" though elevated stress (avg {stress_avg}/10) may reduce energy tomorrow"

        why = (
            f"Your mood has {mood_trend_label} during the past week "
            f"(avg {mood_start} → {mood_end}){stress_note}.{sentiment_note}"
        )

        evidence = [
            {"metric": "Mood", "trend": f"{mood_start} → {mood_end}"},
            {"metric": "Stress", "trend": f"avg {stress_avg}/10"},
            {"metric": "Sleep", "trend": f"avg {sleep_avg}h"},
            {"metric": "Energy", "trend": f"avg {energy_avg}/10"},
        ]

        risk_factors = []
        protective_factors = []
        if stress_avg >= 6.5:
            risk_factors.append(f"High stress average this week ({stress_avg}/10)")
        if sleep_avg < 6.0:
            risk_factors.append(f"Insufficient sleep average this week ({sleep_avg}h)")
        if neg_count > pos_count:
            risk_factors.append("More negative than positive journal entries this week")

        if sleep_avg >= 7.0:
            protective_factors.append("Consistent sleep levels this week")
        if energy_avg >= 6.5:
            protective_factors.append("Strong energy levels observed")
        if pos_count >= 3:
            protective_factors.append("Regular positive journaling")

        return {
            "has_prediction": True,
            "stage": 2,
            "predicted_mood": predicted_mood,
            "mood_label": MOOD_LABELS.get(predicted_mood, "Calm"),
            "confidence": confidence,
            "confidence_label": "Medium",
            "why": why,
            "evidence": evidence,
            "risk_factors": risk_factors,
            "protective_factors": protective_factors,
            "message": "Prediction based on your recent 7-day trend."
        }

    # ─────────────────────────────────────────────────────────────
    #  Stage 3 – full personalized prediction
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def _build_stage3_result(cls, user, logs_qs, predicted_mood, raw_conf, features, today):
        from django.utils import timezone
        from activities.models import ActivityFeedback
        from recommendation.models import Recommendation

        all_logs = list(logs_qs.order_by('-date'))
        recent_7  = all_logs[:7][::-1]
        recent_30 = all_logs[:30][::-1]

        # ── Metric trends ────────────────────────────────────────
        def avg(lst): return round(sum(lst) / len(lst), 2) if lst else 0.0

        mood_r7   = [l.mood     for l in recent_7]
        stress_r7 = [l.stress   for l in recent_7]
        sleep_r7  = [float(l.sleep) for l in recent_7]
        energy_r7 = [l.energy   for l in recent_7]

        mood_r30   = [l.mood     for l in recent_30]
        stress_r30 = [l.stress   for l in recent_30]
        sleep_r30  = [float(l.sleep) for l in recent_30]

        mood_w_avg   = avg(mood_r7)
        mood_m_avg   = avg(mood_r30)
        stress_w_avg = avg(stress_r7)
        stress_m_avg = avg(stress_r30)
        sleep_w_avg  = avg(sleep_r7)
        energy_w_avg = avg(energy_r7)

        # Trend directions
        mood_delta    = mood_w_avg - mood_m_avg
        stress_delta  = stress_w_avg - stress_m_avg   # negative = improving

        # Mood variability (standard deviation)
        if len(mood_r30) > 1:
            mood_std = float(np.std(mood_r30))
        else:
            mood_std = 0.0

        # Sleep consistency (lower std = more consistent)
        if len(sleep_r30) > 1:
            sleep_std = float(np.std(sleep_r30))
        else:
            sleep_std = 0.0

        # ── Journal / activity enrichment ────────────────────────
        journals_30 = JournalEntry.objects.filter(
            user=user, created_at__date__gte=today - timezone.timedelta(days=30)
        )
        sentiments = [j.analysis.get("sentiment", "Neutral") for j in journals_30 if j.analysis]
        pos_count = sentiments.count("Positive")
        neg_count = sentiments.count("Negative")

        themes = []
        for j in journals_30:
            if j.analysis:
                themes.extend(j.analysis.get("themes", []))
        common_themes = list(set(themes))[:3]

        recs = Recommendation.objects.filter(
            user=user,
            created_at__date__gte=today - timezone.timedelta(days=30)
        )
        total_recs = recs.count()
        completed_recs = recs.filter(completed=True).count()
        completion_rate = (completed_recs / total_recs) if total_recs > 0 else 0.0

        feedbacks = ActivityFeedback.objects.filter(
            user=user,
            created_at__date__gte=today - timezone.timedelta(days=30)
        )
        avg_sat = (
            sum(f.satisfaction for f in feedbacks) / feedbacks.count()
            if feedbacks.count() > 0 else 0.0
        )

        # ── Confidence calibration ───────────────────────────────
        # Penalize variability: high mood std → reduce confidence
        variability_penalty = min(0.15, mood_std * 0.05)
        calibrated_conf = round(min(0.95, max(0.60, raw_conf - variability_penalty)), 2)
        confidence_label = "High" if calibrated_conf >= 0.75 else "Medium"

        # ── Build why ────────────────────────────────────────────
        parts = []
        if mood_delta > 0.3:
            parts.append(f"your mood has been trending upward this week (week avg {round(mood_w_avg,1)} vs month avg {round(mood_m_avg,1)})")
        elif mood_delta < -0.3:
            parts.append(f"your mood has dipped this week (week avg {round(mood_w_avg,1)} vs month avg {round(mood_m_avg,1)})")

        if stress_delta < -0.5:
            parts.append(f"stress has gradually decreased (+{round(abs(stress_delta),1)} improvement)")
        elif stress_delta > 0.5:
            parts.append(f"stress has risen compared to last month (+{round(stress_delta,1)})")

        if sleep_w_avg >= 7.5:
            parts.append("sleep quality has improved this week")
        elif sleep_w_avg < 5.8:
            parts.append("sleep has been notably short this week")

        if not parts:
            parts.append("your patterns have been broadly consistent this month")

        why = "This prediction reflects that " + "; ".join(parts) + "."

        # ── Evidence ─────────────────────────────────────────────
        evidence = [
            {"metric": "Mood",   "trend": f"{round(mood_m_avg,1)} → {round(mood_w_avg,1)}"},
            {"metric": "Stress", "trend": f"{round(stress_m_avg,1)} → {round(stress_w_avg,1)}"},
            {"metric": "Sleep",  "trend": f"avg {round(sleep_w_avg,1)}h (weekly)"},
            {"metric": "Energy", "trend": f"avg {round(energy_w_avg,1)}/10"},
        ]
        if completion_rate > 0:
            evidence.append({"metric": "Activity Completion", "trend": f"{round(completion_rate * 100)}%"})
        if common_themes:
            evidence.append({"metric": "Journal Themes", "trend": ", ".join(common_themes)})

        # ── Risk factors ─────────────────────────────────────────
        risk_factors = []
        if stress_w_avg >= 6.5:
            risk_factors.append(f"Elevated stress this week (avg {round(stress_w_avg,1)}/10)")
        if sleep_w_avg < 6.0:
            risk_factors.append(f"Sleep deprivation (avg {round(sleep_w_avg,1)}h/night)")
        if mood_std > 1.2:
            risk_factors.append("High mood variability — emotional instability pattern detected")
        if neg_count > pos_count and neg_count > 3:
            risk_factors.append("Predominantly negative journal sentiment this month")
        if mood_delta < -0.4:
            risk_factors.append("Downward mood trend compared to last month")

        # ── Protective factors ───────────────────────────────────
        protective_factors = []
        if sleep_w_avg >= 7.0 and sleep_std < 1.0:
            protective_factors.append("Consistent, quality sleep schedule")
        if stress_delta < -0.5:
            protective_factors.append("Declining stress trend — positive recovery momentum")
        if completion_rate >= 0.6:
            protective_factors.append(f"Strong wellness activity engagement ({round(completion_rate*100)}% completion)")
        if avg_sat >= 4.0:
            protective_factors.append("High satisfaction from completed therapy activities")
        if pos_count > neg_count and pos_count >= 4:
            protective_factors.append("Regular positive journaling is reinforcing emotional stability")
        if mood_delta > 0.3:
            protective_factors.append("Upward mood trend shows building resilience")

        return {
            "has_prediction": True,
            "stage": 3,
            "predicted_mood": predicted_mood,
            "mood_label": MOOD_LABELS.get(predicted_mood, "Calm"),
            "confidence": calibrated_conf,
            "confidence_label": confidence_label,
            "why": why,
            "evidence": evidence,
            "risk_factors": risk_factors,
            "protective_factors": protective_factors,
            "message": "Personalized prediction based on your full behavioral history."
        }
