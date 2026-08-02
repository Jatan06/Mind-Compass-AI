from django.utils import timezone
from mood.models import MoodLog
from journal.models import JournalEntry
from recommendation.services import RecommendationService
from ai.prediction.services import MoodPredictionService
from ai.insights.services import AIInsightsService

class AIServicePipeline:
    @classmethod
    def run_pipeline_if_ready(cls, user):
        """
        Runs the complete AI pipeline synchronously if both today's mood check-in
        and today's journal entry exist.
        """
        today = timezone.localdate()
        
        has_mood = MoodLog.objects.filter(user=user, date=today).exists()
        has_journal = JournalEntry.objects.filter(user=user, created_at__date=today).exists()
        
        if has_mood and has_journal:
            # 1-10. Generate personalized recommendation
            RecommendationService.get_today_recommendation(user, force_recalculate=True)
            # 11. Generate today's mood prediction
            MoodPredictionService.predict(user)
            # 12. Update Emotional Twin (generate AI insights)
            AIInsightsService.generate_insights(user)
            return True
        return False
