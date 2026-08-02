import os
import random
import numpy as np
import joblib
from django.conf import settings
from sklearn.ensemble import RandomForestClassifier

from mood.models import MoodLog
from journal.models import JournalEntry
from activities.models import ActivityFeedback

MODEL_PATH = os.path.join(os.path.dirname(__file__), "mood_predictor.pkl")

class MoodPredictorModel:
    @classmethod
    def get_feature_names(cls):
        return [
            "mood", "stress", "energy", "sleep", "productivity", "social",
            "sentiment_score", "pos_emotions", "neg_emotions", "activities_completed"
        ]

    @classmethod
    def extract_features_for_day(cls, user, date_obj):
        """
        Extracts a feature array for a user on a specific calendar date.
        """
        # Fetch daily mood log
        log = MoodLog.objects.filter(user=user, date=date_obj).first()
        if not log:
            return None

        # Base checkin metrics
        mood = log.mood
        stress = log.stress
        energy = log.energy
        sleep = float(log.sleep) if log.sleep else 7.0
        productivity = log.productivity
        social = log.social

        # Journal sentiment & emotion scores
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

        # Completed wellness activities count
        activities_count = ActivityFeedback.objects.filter(user=user, date=date_obj).count()

        return [
            float(mood), float(stress), float(energy), float(sleep), 
            float(productivity), float(social), sentiment_score, 
            float(pos_emotions), float(neg_emotions), float(activities_count)
        ]

    @classmethod
    def generate_synthetic_training_data(cls):
        """
        Generates clean synthetic dataset to train the base model.
        Forces the model to learn correct behavioral correlations:
          - High sleep + Low stress + Positive sentiment -> Good/Excellent mood tomorrow.
          - Low sleep + High stress + Negative sentiment -> Bad/Terrible mood tomorrow.
          - Otherwise -> Stable/Neutral mood.
        """
        X = []
        y = []
        
        # 150 samples
        for _ in range(150):
            sleep = random.uniform(4.0, 9.5)
            stress = random.randint(1, 10)
            energy = random.randint(1, 10)
            mood = random.randint(1, 5)
            productivity = random.randint(2, 9)
            social = random.randint(2, 9)
            
            # Sentiment correlations
            if mood >= 4 and stress <= 4:
                sentiment = 1.0
                pos_em = 1
                neg_em = 0
            elif mood <= 2 or stress >= 7:
                sentiment = -1.0
                pos_em = 0
                neg_em = 1
            else:
                sentiment = 0.0
                pos_em = 0
                neg_em = 0
                
            act_count = random.randint(0, 3)

            features = [
                float(mood), float(stress), float(energy), sleep,
                float(productivity), float(social), sentiment,
                float(pos_em), float(neg_em), float(act_count)
            ]
            X.append(features)

            # Determine target tomorrow mood label (y) based on day's characteristics
            tomorrow_mood = mood
            
            # Decrements
            if stress >= 7:
                tomorrow_mood -= 1
            if sleep < 6.0:
                tomorrow_mood -= 1
            # Increments
            if energy >= 7 and stress < 5:
                tomorrow_mood += 1
            if act_count >= 2:
                tomorrow_mood += 1
                
            tomorrow_mood = max(1, min(5, tomorrow_mood))
            y.append(tomorrow_mood)
            
        return np.array(X), np.array(y)

    @classmethod
    def get_model(cls):
        """
        Loads the saved classification model if it exists, else runs first training cycle.
        """
        import os
        if not os.path.exists(MODEL_PATH):
            cls.train_model()
        try:
            return joblib.load(MODEL_PATH)
        except Exception:
            cls.train_model()
            return joblib.load(MODEL_PATH)

    @classmethod
    def train_model(cls):
        """
        Fetches all user check-ins, builds transition matrices (today features -> tomorrow mood status),
        merges with synthetic baseline data, trains the Random Forest model, and persists via joblib.
        """
        X_real = []
        y_real = []

        # Find all mood logs that have a next day log (transition target)
        all_logs = MoodLog.objects.all().order_by('user', 'date')
        user_logs = {}
        for log in all_logs:
            if log.user_id not in user_logs:
                user_logs[log.user_id] = []
            user_logs[log.user_id].append(log)

        for user_id, logs in user_logs.items():
            for i in range(len(logs) - 1):
                today_log = logs[i]
                tomorrow_log = logs[i+1]

                # Check if they are consecutive days
                if (tomorrow_log.date - today_log.date).days == 1:
                    features = cls.extract_features_for_day(today_log.user, today_log.date)
                    if features:
                        X_real.append(features)
                        y_real.append(tomorrow_log.mood)

        # Merge with synthetic seed data
        X_syn, y_syn = cls.generate_synthetic_training_data()
        
        if X_real:
            X = np.vstack([X_syn, np.array(X_real)])
            y = np.concatenate([y_syn, np.array(y_real)])
        else:
            X = X_syn
            y = y_syn

        # Train a RandomForest Classifier
        clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
        clf.fit(X, y)

        # Save model
        joblib.dump(clf, MODEL_PATH)

    @classmethod
    def predict_next_day(cls, user):
        """
        Loads the saved model and predicts tomorrow's mood.
        If the model does not exist, triggers a retraining sequence.
        """
        if not os.path.exists(MODEL_PATH):
            cls.train_model()

        try:
            clf = joblib.load(MODEL_PATH)
        except Exception:
            # Rebuild if model loading corrupted
            cls.train_model()
            clf = joblib.load(MODEL_PATH)

        # Fetch latest mood log date
        latest_log = MoodLog.objects.filter(user=user).order_by('-date').first()
        if not latest_log:
            # Return baseline forecast
            return {
                "predicted_mood": 3,
                "confidence": 0.60,
                "feature_contributions": ["No check-in history logged yet"]
            }

        features = cls.extract_features_for_day(user, latest_log.date)
        if not features:
            return {
                "predicted_mood": 3,
                "confidence": 0.60,
                "feature_contributions": ["Baseline default"]
            }

        # Predict tomorrow's mood probabilities
        x_input = np.array([features])
        predicted_mood = int(clf.predict(x_input)[0])
        probabilities = clf.predict_proba(x_input)[0]
        
        # Max confidence score
        confidence = float(np.max(probabilities))

        # Explainability: inspect feature values against thresholds to see contributions
        contributions = []
        # features indices:
        # 0: mood, 1: stress, 2: energy, 3: sleep, 4: productivity, 5: social,
        # 6: sentiment_score, 7: pos_emotions, 8: neg_emotions, 9: activities_completed
        if features[1] >= 7:
            contributions.append("High stress levels logged today indicate potential fatigue tomorrow.")
        if features[3] < 6.0:
            contributions.append("Sub-optimal sleep window restricts physical energy restoration.")
        if features[2] >= 7 and features[1] < 5:
            contributions.append("Strong energy-to-stress balance suggests high cognitive resilience.")
        if features[9] >= 2:
            contributions.append("Active therapy participation helps reinforce stability.")
        if features[6] < 0.0:
            contributions.append("Expressive sadness or concern in journal indicates lower emotional reserves.")
        if features[6] > 0.0:
            contributions.append("Positive journaling expressions support wellness.")

        if not contributions:
            contributions.append("Stable baseline metrics indicate emotional consistency tomorrow.")

        return {
            "predicted_mood": predicted_mood,
            "confidence": round(confidence, 2),
            "feature_contributions": contributions
        }
