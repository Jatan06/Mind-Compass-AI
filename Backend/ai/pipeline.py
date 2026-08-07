import threading
from django.utils import timezone
from django.db import close_old_connections
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

        This is called from inside the NLP background thread (journal/services.py),
        so NLP analysis is guaranteed to be written to DB before this runs.
        When triggered from mood/views.py (check-in save), it spawns its own thread
        only if no journal exists yet (quick rec only path).
        """
        today = timezone.localdate()

        has_mood = MoodLog.objects.filter(user=user, date=today).exists()
        has_journal = JournalEntry.objects.filter(user=user, created_at__date=today).exists()

        if has_mood and has_journal:
            # Check that today's journal actually has analysis populated
            journal_entry = JournalEntry.objects.filter(user=user, created_at__date=today).first()
            if journal_entry and not journal_entry.analysis:
                # NLP not done yet — skip pipeline; it will be called again by the NLP thread
                return False

            # 1. Generate personalized recommendation
            RecommendationService.get_today_recommendation(user, force_recalculate=True)
            # 2. Generate today's mood prediction
            MoodPredictionService.predict(user)
            # 3. Update Emotional Twin (generate AI insights)
            AIInsightsService.generate_insights(user)
            return True
        return False
