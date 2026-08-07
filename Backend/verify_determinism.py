import os
import sys
import django
from django.utils import timezone

# Append 'test' to sys.argv if not present, so config/settings.py configures SQLite in-memory
if 'test' not in sys.argv:
    sys.argv.append('test')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db.models.signals import post_save
from journal.models import JournalEntry

# Disconnect the signal that triggers the NLP pipeline
try:
    from journal.signals import trigger_journal_analysis
    post_save.disconnect(trigger_journal_analysis, sender=JournalEntry)
except ImportError:
    pass

from users.models import User
from mood.models import MoodLog
from ai.models import EmotionAnalysis
from recommendation.services import RecommendationService
from recommendation.models import Recommendation
from activities.models import TherapyActivity

# Migrate the in-memory database schema (create tables)
from django.core.management import call_command
print("1. Migrating in-memory database...", flush=True)
call_command('migrate', verbosity=0, interactive=False)

def test_determinism():
    print("2. Seeding TherapyActivity records...", flush=True)
    act_configs = {
        'act-1': {'title': 'Box Breathing', 'stress': [7,10], 'mood': [1,10], 'topics': ['stress', 'panic', 'anxiety']},
        'act-12': {'title': '3-Min Breathing', 'stress': [1,6], 'mood': [2,8], 'topics': ['calm', 'default']},
        'act-15': {'title': '10-3-2-1-0 Sleep Protocol', 'stress': [1,10], 'mood': [1,10], 'topics': ['sleep', 'insomnia', 'night']},
        'act-16': {'title': 'PMR', 'stress': [1,10], 'mood': [1,10], 'topics': ['sleep', 'insomnia', 'rest']},
        'act-17': {'title': 'Three Good Things', 'stress': [1,10], 'mood': [1,10], 'topics': ['gratitude', 'happy']},
        'act-33': {'title': '5-4-3-2-1 Grounding', 'stress': [1,10], 'mood': [1,10], 'topics': ['anxiety', 'panic', 'overwhelmed', 'grounding']},
        'act-37': {'title': 'Somatic Shakeout', 'stress': [1,10], 'mood': [1,10], 'topics': ['energy', 'fatigue', 'tired']}
    }
    
    for s, conf in act_configs.items():
        TherapyActivity.objects.create(
            id=s,
            title=conf['title'],
            category="Mindfulness" if s not in ['act-15', 'act-16'] else "Sleep Hygiene",
            duration="10 mins",
            difficulty="Easy",
            description="Test activity description",
            instructions=["Step 1", "Step 2"],
            stress_range=conf['stress'],
            mood_range=conf['mood'],
            topics=conf['topics'],
            emotions=["calm", "neutral"]
        )

    print("3. Getting/creating user...", flush=True)
    user = User.objects.create_user(username='determinism_test_user', email='det@example.com', password='Password123!')
        
    today = timezone.localdate()
    
    print("4. Creating MoodLog...", flush=True)
    mood_log = MoodLog.objects.create(
        user=user,
        date=today,
        mood=3,
        mood_label="Neutral",
        stress=8,
        energy=4,
        sleep=5.5,
        productivity=5,
        social=5,
        notes="Feeling anxious and stressed about exams."
    )
    
    print("5. Creating JournalEntry...", flush=True)
    journal_entry = JournalEntry.objects.create(
        user=user,
        text="Stressed and anxious about exams.",
        analysis={
            "themes": ["exam", "stress"],
            "sentiment": "Negative",
            "emotion": "Anxiety",
            "sentences": [
                {
                    "text": "Stressed and anxious about exams.",
                    "topics": ["exam", "stress"],
                    "emotion": "Anxiety",
                    "sentiment": "Negative"
                }
            ]
        }
    )
    
    print("6. Creating EmotionAnalysis...", flush=True)
    EmotionAnalysis.objects.create(
        journal_entry=journal_entry,
        primary_emotion="anxiety",
        confidence=0.9
    )
    
    print("7. Calling get_today_recommendation 1...", flush=True)
    rec1 = RecommendationService.get_today_recommendation(user, force_recalculate=True)
    
    print("8. Calling get_today_recommendation 2...", flush=True)
    rec2 = RecommendationService.get_today_recommendation(user, force_recalculate=True)
    
    print(f"First run recommendation: {rec1.activity.title} ({rec1.activity.id})", flush=True)
    print(f"Second run recommendation: {rec2.activity.title} ({rec2.activity.id})", flush=True)
    
    assert rec1.activity.id == rec2.activity.id, f"Recommendation is not deterministic! {rec1.activity.id} vs {rec2.activity.id}"
    print("SUCCESS: Recommendation is 100% deterministic for identical inputs!", flush=True)

if __name__ == "__main__":
    test_determinism()
