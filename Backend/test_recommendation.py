import os
import django
import sys
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from recommendation.services import RecommendationService
from django.contrib.auth import get_user_model
from mood.models import MoodLog
from journal.models import JournalEntry
from ai.utils.preprocessing import analyze_text_nlp
from activities.models import TherapyActivity
from recommendation.models import Recommendation
from ai.models import EmotionAnalysis

User = get_user_model()
user = User.objects.first()

print(f"Testing for user {user.username}")

today = timezone.localdate()

# Clean up today's data for clean test
MoodLog.objects.filter(user=user, date=today).delete()
JournalEntry.objects.filter(user=user, created_at__date=today).delete()

# Test Case 1: Happy / No stress
mood = MoodLog.objects.create(
    user=user, date=today,
    mood=5, stress=2, sleep=8.0, energy=4, social=4, productivity=4
)

text = 'I am happy today. Everything went well. No problems.'
analysis = {'sentiment': 'Positive', 'themes': ['happy', 'gratitude']}

print("TEST 1 - HAPPY")
print("Text:", text)
print("NLP Analysis:", analysis)

journal = JournalEntry.objects.create(
    user=user, text=text, analysis=analysis
)

# We should also generate EmotionAnalysis for it so EmotionMatch works
EmotionAnalysis.objects.create(
    journal_entry=journal,
    primary_emotion='Joy',
    confidence=1.0
)

print("----- SCORING PROCESS STARTS -----")
rec = RecommendationService.get_today_recommendation(user, force_recalculate=True)
print("----- SCORING PROCESS ENDS -----")

if rec:
    print(f"\nRECOMMENDED ACTIVITY: {rec.activity.title} (ID: {rec.activity.id})")
    print(f"Top Score: {rec.score}")
else:
    print("NO RECOMMENDATION FOUND")
