from django.utils import timezone
from ai.models import MoodPrediction
from ai.prediction.model import MoodPredictorModel
from recommendation.services import RecommendationService

class MoodPredictionService:
    @classmethod
    def predict(cls, user):
        """
        Retrieves next-day mood prediction from the Random Forest model.
        Persists the result in the MoodPrediction model table.
        """
        # Execute Scikit-learn forecast pipeline
        pred_res = MoodPredictorModel.predict_next_day(user)
        predicted = pred_res["predicted_mood"]
        confidence = pred_res["confidence"]
        reasons = pred_res["feature_contributions"]

        # Dynamically determine a coping activity to suggest based on prediction
        # (e.g. if mood is forecasted down, suggest grounding; if positive, gratitude)
        suggested_act = "act-12"  # Mindfulness breathing
        if predicted <= 2:
            suggested_act = "act-33"  # Grounding
            reasons.append("Suggested coping activity: 5-4-3-2-1 Grounding to break negative thought loops.")
        elif predicted >= 4:
            suggested_act = "act-17"  # Three Good Things
            reasons.append("Suggested coping activity: practicing gratitude to sustain positive momentum.")
        else:
            reasons.append("Suggested coping activity: Mindful Breathing to ground focus.")

        # Persist prediction in database MoodPrediction
        prediction_obj = MoodPrediction.objects.create(
            user=user,
            predicted_mood=predicted,
            confidence=confidence,
            reasons=reasons
        )

        return {
            "predicted_mood": predicted,
            "confidence": confidence,
            "reasons": reasons
        }
