"""
Complete verification script for recommendation engine.
Tests 7 scenarios to prove recommendations change based on input.
"""
import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.utils import timezone
from recommendation.services import RecommendationService
from recommendation.models import Recommendation
from django.contrib.auth import get_user_model
from mood.models import MoodLog
from journal.models import JournalEntry
from ai.models import EmotionAnalysis

User = get_user_model()
user = User.objects.first()
if not user:
    print("ERROR: No user in database")
    sys.exit(1)

today = timezone.localdate()

SCENARIOS = [
    {
        "name": "1. HAPPY USER",
        "mood": 5, "stress": 2, "sleep": 8.0, "energy": 5, "social": 5, "productivity": 5,
        "text": "I am happy today. Everything went well. I feel grateful and proud of myself.",
        "analysis": {"sentiment": "Positive", "themes": ["happy", "gratitude"],
                     "sentences": [{"text": "I am happy today.", "emotion": "Happy", "is_negated": False, "tense": "present", "status": "neutral", "topics": [], "sentiment": "Positive", "stress_sources": []}]},
        "emotion": "Joy",
    },
    {
        "name": "2. EXAM STRESS",
        "mood": 2, "stress": 9, "sleep": 5.0, "energy": 2, "social": 3, "productivity": 2,
        "text": "I am so worried about my exams. I have finals tomorrow and I cannot concentrate. I feel like I will fail.",
        "analysis": {"sentiment": "Negative", "themes": ["exam", "study"],
                     "sentences": [{"text": "I am so worried about my exams.", "emotion": "Anxiety", "is_negated": False, "tense": "present", "status": "distress", "topics": ["exam"], "sentiment": "Negative", "stress_sources": ["exams"]}]},
        "emotion": "Anxiety",
    },
    {
        "name": "3. FAMILY CONFLICT",
        "mood": 2, "stress": 8, "sleep": 6.0, "energy": 3, "social": 1, "productivity": 3,
        "text": "I had a fight with my parents today. We had a big argument about my future. I feel hurt and angry.",
        "analysis": {"sentiment": "Negative", "themes": ["family"],
                     "sentences": [{"text": "I had a fight with my parents today.", "emotion": "Angry", "is_negated": False, "tense": "present", "status": "distress", "topics": ["family"], "sentiment": "Negative", "stress_sources": ["family conflict"]}]},
        "emotion": "Angry",
    },
    {
        "name": "4. DIGITAL FATIGUE",
        "mood": 3, "stress": 5, "sleep": 6.0, "energy": 2, "social": 2, "productivity": 2,
        "text": "I spent the whole day scrolling Instagram and watching YouTube. My head hurts and my eyes are tired from screens.",
        "analysis": {"sentiment": "Negative", "themes": ["digital", "screens"],
                     "sentences": [{"text": "I spent the whole day scrolling Instagram.", "emotion": "Apathetic", "is_negated": False, "tense": "present", "status": "distress", "topics": ["digital"], "sentiment": "Negative", "stress_sources": ["screen time"]}]},
        "emotion": "Apathetic",
    },
    {
        "name": "5. BURNOUT",
        "mood": 2, "stress": 7, "sleep": 4.0, "energy": 1, "social": 2, "productivity": 1,
        "text": "I am completely exhausted. I have been working nonstop and I feel burned out. Low energy all day.",
        "analysis": {"sentiment": "Negative", "themes": ["work", "burnout"],
                     "sentences": [{"text": "I am completely exhausted.", "emotion": "Fatigue", "is_negated": False, "tense": "present", "status": "distress", "topics": ["work"], "sentiment": "Negative", "stress_sources": ["burnout"]}]},
        "emotion": "Fatigue",
    },
    {
        "name": "6. PANIC",
        "mood": 1, "stress": 10, "sleep": 5.0, "energy": 2, "social": 2, "productivity": 1,
        "text": "I had a panic attack today. My heart was racing and I could not breathe. I feel scared.",
        "analysis": {"sentiment": "Negative", "themes": ["panic"],
                     "sentences": [{"text": "I had a panic attack today.", "emotion": "Panic", "is_negated": False, "tense": "present", "status": "distress", "topics": ["panic"], "sentiment": "Negative", "stress_sources": ["panic"]}]},
        "emotion": "Panic",
    },
    {
        "name": "7. LOW MOTIVATION",
        "mood": 3, "stress": 4, "sleep": 7.0, "energy": 2, "social": 3, "productivity": 1,
        "text": "I have no motivation to do anything. I keep procrastinating and avoiding my tasks. I feel lazy and stuck.",
        "analysis": {"sentiment": "Negative", "themes": ["motivation", "procrastination"],
                     "sentences": [{"text": "I have no motivation to do anything.", "emotion": "Apathetic", "is_negated": False, "tense": "present", "status": "distress", "topics": ["motivation"], "sentiment": "Negative", "stress_sources": ["procrastination"]}]},
        "emotion": "Apathetic",
    },
]

results = []

for scenario in SCENARIOS:
    # Clean up today's data
    EmotionAnalysis.objects.filter(journal_entry__user=user, created_at__date=today).delete()
    Recommendation.objects.filter(user=user, created_at__date=today).delete()
    JournalEntry.objects.filter(user=user, created_at__date=today).delete()
    MoodLog.objects.filter(user=user, date=today).delete()

    # Create mood log
    mood = MoodLog.objects.create(
        user=user, date=today,
        mood=scenario["mood"], stress=scenario["stress"],
        sleep=scenario["sleep"], energy=scenario["energy"],
        social=scenario["social"], productivity=scenario["productivity"],
    )

    # Create journal
    journal = JournalEntry.objects.create(
        user=user, text=scenario["text"], analysis=scenario["analysis"]
    )

    # Create emotion analysis
    EmotionAnalysis.objects.create(
        journal_entry=journal,
        primary_emotion=scenario["emotion"],
        confidence=1.0
    )

    # Generate recommendation
    rec = RecommendationService.get_today_recommendation(user, force_recalculate=True)

    if rec:
        result = {
            "scenario": scenario["name"],
            "activity": f"{rec.activity.title} ({rec.activity.id})",
            "category": rec.activity.category,
            "score": rec.score,
        }
    else:
        result = {
            "scenario": scenario["name"],
            "activity": "NONE",
            "category": "NONE",
            "score": 0,
        }
    results.append(result)

# Print results
print("=" * 80)
print("VERIFICATION RESULTS")
print("=" * 80)
for r in results:
    print(f"\n{r['scenario']}")
    print(f"  → Activity: {r['activity']}")
    print(f"  → Category: {r['category']}")
    print(f"  → Score:    {r['score']}")

# Check uniqueness
activities = [r["activity"] for r in results]
unique = set(activities)
print(f"\n{'=' * 80}")
print(f"UNIQUE ACTIVITIES: {len(unique)} / {len(activities)}")
if len(unique) == 1:
    print("FAIL: All scenarios recommended the same activity!")
elif len(unique) < 4:
    print("WARNING: Low variety in recommendations")
else:
    print("PASS: Different scenarios produce different recommendations!")
print(f"{'=' * 80}")
