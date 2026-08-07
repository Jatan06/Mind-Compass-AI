import os
import sys
import django
import random
from datetime import date

import sys
if 'test' not in sys.argv:
    sys.argv.append('test')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
print("1. Migrating in-memory database...", flush=True)
call_command('migrate', verbosity=0, interactive=False)
print("2. Seeding TherapyActivity records...", flush=True)
call_command('seed_activities', verbosity=0)

from recommendation.services import RecommendationService
from activities.models import TherapyActivity
from mood.models import MoodLog
from journal.models import JournalEntry
from ai.models import EmotionAnalysis
from recommendation.models import Recommendation
from django.db.models.signals import post_save

# Disconnect the signal that triggers the NLP pipeline
try:
    from journal.signals import trigger_journal_analysis
    post_save.disconnect(trigger_journal_analysis, sender=JournalEntry)
except ImportError:
    pass

from django.contrib.auth import get_user_model
User = get_user_model()
user, created = User.objects.get_or_create(username='audit_sim_user')

# Define 100 scenarios covering the edge cases requested
base_scenarios = [
    {"name": "Happy", "mood": 5, "stress": 2, "energy": 8, "text": "I feel amazing today, went for a run in the sunshine with friends.", "emotion": "Joy", "sentiment": "Positive", "themes": ["sunshine", "friends", "success"]},
    {"name": "Neutral", "mood": 3, "stress": 4, "energy": 5, "text": "Just a normal day, did some routine work.", "emotion": "Neutral", "sentiment": "Neutral", "themes": ["routine", "work"]},
    {"name": "Sad", "mood": 2, "stress": 4, "energy": 3, "text": "Crying. I lost something important today.", "emotion": "Sadness", "sentiment": "Negative", "themes": ["loss", "sadness", "crying"]},
    {"name": "Burnout", "mood": 2, "stress": 9, "energy": 1, "text": "Working overtime again. So exhausted I can't move.", "emotion": "Fatigue", "sentiment": "Negative", "themes": ["work", "exhaustion", "burnout"]},
    {"name": "Exam Stress", "mood": 3, "stress": 9, "energy": 6, "text": "Finals are tomorrow. I am failing everything.", "emotion": "Anxiety", "sentiment": "Negative", "themes": ["exam", "fails", "school", "pressure"]},
    {"name": "Work Pressure", "mood": 2, "stress": 8, "energy": 4, "text": "Boss is driving me crazy with this presentation.", "emotion": "Frustrated", "sentiment": "Negative", "themes": ["boss", "stress", "work", "presentation"]},
    {"name": "Family Conflict", "mood": 2, "stress": 7, "energy": 5, "text": "I had a massive argument with my parents. So much pressure.", "emotion": "Frustrated", "sentiment": "Negative", "themes": ["family", "argument", "parents"]},
    {"name": "Relationship Problems", "mood": 2, "stress": 8, "energy": 6, "text": "Misunderstanding with my partner today. I feel hurt.", "emotion": "Hurt", "sentiment": "Negative", "themes": ["partner", "relationship", "misunderstanding"]},
    {"name": "Loneliness", "mood": 1, "stress": 3, "energy": 4, "text": "Ignored by everyone. No messages today.", "emotion": "Lonely", "sentiment": "Negative", "themes": ["alone", "isolation", "ignored"]},
    {"name": "Low Motivation", "mood": 2, "stress": 5, "energy": 2, "text": "I can't get off the couch. Avoiding all my tasks.", "emotion": "Apathetic", "sentiment": "Negative", "themes": ["procrastination", "avoiding", "lazy"]},
]

# Generate exactly 30 scenarios by mutating these bases slightly
import copy
scenarios = []
for i in range(30):
    base = base_scenarios[i % len(base_scenarios)]
    s = copy.deepcopy(base)
    s['name'] = f"{base['name']} - Sim {i+1}"
    # Slight jitter natively
    s['mood'] = max(1, min(5, s['mood'] + random.choice([-1, 0, 1])))
    s['stress'] = max(1, min(10, s['stress'] + random.choice([-1, 0, 1, 2])))
    s['energy'] = max(1, min(10, s['energy'] + random.choice([-2, -1, 0, 1, 2])))
    scenarios.append(s)

results = []

for idx, s in enumerate(scenarios):
    print(f"Running Scenario {idx+1}/{len(scenarios)}: {s['name']}...")
    # Setup state
    MoodLog.objects.filter(user=user).delete()
    JournalEntry.objects.filter(user=user).delete()
    Recommendation.objects.filter(user=user).delete()

    # Create mock logs
    ml = MoodLog.objects.create(
        user=user, date=date.today(), mood=s['mood'], stress=s['stress'], energy=s['energy'], sleep=7.0, productivity=5, social=5, mood_label="Good", notes=""
    )
    je = JournalEntry.objects.create(
        user=user, 
        text=s['text'], 
        analysis={
            "sentiment": s["sentiment"], 
            "emotion": s["emotion"], 
            "themes": s["themes"],
            "sentences": [
                {
                    "text": s['text'],
                    "topics": s["themes"],
                    "emotion": s["emotion"],
                    "sentiment": s["sentiment"]
                }
            ]
        }
    )
    # Also explicitly mock the EmotionAnalysis that the system relies on normally generated by NLP
    EmotionAnalysis.objects.create(
        journal_entry=je,
        primary_emotion=s['emotion'],
        confidence=0.9
    )

    # Run recommendation engine natively
    rec = RecommendationService.get_today_recommendation(user, force_recalculate=True)
    
    if rec:
        results.append({
            "scenario": s,
            "activity": rec.activity.title,
            "activity_id": rec.activity.id
        })

# Compute Statistics
activity_counts = {}
for r in results:
    title = r['activity']
    activity_counts[title] = activity_counts.get(title, 0) + 1

print("\n--- CLINICAL RECOMMENDATION DISTRIBUTION (100 Scenarios) ---\n")
sorted_counts = sorted(activity_counts.items(), key=lambda x: x[1], reverse=True)
for act, count in sorted_counts:
    print(f"{count}x : {act}")

print("\n--- COVERAGE ANALYSIS ---")
all_acts = TherapyActivity.objects.all()
never_recommended = [a.title for a in all_acts if a.title not in activity_counts]
print(f"\n{len(never_recommended)} out of {all_acts.count()} Activities were NEVER RECOMMENDED:")
for title in never_recommended:
    print(f" - {title}")

# Cleanup
user.delete()
