from ai.models import MoodPrediction
from ai.prediction.model import MoodPredictorModel


class MoodPredictionService:
    """
    Service layer for the adaptive mood prediction pipeline.
    Wraps MoodPredictorModel and persists the result as a MoodPrediction DB record
    only when a real prediction is available (has_prediction = True).
    """

    @classmethod
    def predict(cls, user):
        """
        Run the 3-stage mood prediction pipeline for the given user.

        Returns a structured dict with:
          has_prediction, stage, predicted_mood, mood_label, confidence,
          confidence_label, why, evidence, risk_factors, protective_factors, message
        """
        result = MoodPredictorModel.predict_next_day(user)

        # Persist only real predictions — not "Stage 1 / no data" placeholders
        if result.get("has_prediction"):
            MoodPrediction.objects.create(
                user=user,
                predicted_mood=result["predicted_mood"],
                confidence=result["confidence"],
                reasons=[result.get("why", "")] + (result.get("protective_factors") or []),
            )

        return result
