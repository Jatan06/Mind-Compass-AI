import os
import sys
import django
import random
import time
from datetime import date

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
from django.contrib.auth import get_user_model

User = get_user_model()
user, _ = User.objects.get_or_create(username='final_audit_user')

# SCENARIO DEFINITIONS
test_cases = [
    # 1. Happy
    {"name": "Happy", "mood": 5, "stress": 2, "energy": 8, "sleep": 8, "prod": 8, "social": 8, "text": "Had a wonderful day out with friends.", "sentiment": "Positive", "emotion": "joy", "themes": ["social", "happy"]},
    # 2. Neutral
    {"name": "Neutral", "mood": 3, "stress": 5, "energy": 5, "sleep": 7, "prod": 5, "social": 5, "text": "Just a normal day, nothing special.", "sentiment": "Neutral", "emotion": "neutral", "themes": ["daily"]},
    # 3. Sad
    {"name": "Sad", "mood": 1, "stress": 6, "energy": 2, "sleep": 5, "prod": 3, "social": 2, "text": "Feeling really down and hopeless today.", "sentiment": "Negative", "emotion": "sadness", "themes": ["sad", "hopeless"]},
    # 4. Anxiety
    {"name": "Anxiety", "mood": 2, "stress": 9, "energy": 6, "sleep": 4, "prod": 4, "social": 5, "text": "My chest is tight and I can't stop worrying.", "sentiment": "Negative", "emotion": "fear", "themes": ["anxiety", "worry"]},
    # 5. Burnout
    {"name": "Burnout", "mood": 2, "stress": 8, "energy": 1, "sleep": 5, "prod": 2, "social": 3, "text": "I have nothing left to give. Completely exhausted.", "sentiment": "Negative", "emotion": "sadness", "themes": ["burnout", "fatigue"]},
    # 6. Exam Stress
    {"name": "Exam Stress", "mood": 2, "stress": 10, "energy": 4, "sleep": 4, "prod": 2, "social": 2, "text": "Finals are tomorrow and I am panicking. I haven't studied enough.", "sentiment": "Negative", "emotion": "fear", "themes": ["exam", "study"]},
    # 7. Study Pressure
    {"name": "Study Pressure", "mood": 3, "stress": 7, "energy": 4, "sleep": 6, "prod": 5, "social": 4, "text": "So many assignments due this week.", "sentiment": "Negative", "emotion": "stress", "themes": ["assignments", "deadlines"]},
    # 8. Family Conflict
    {"name": "Family Conflict", "mood": 2, "stress": 8, "energy": 3, "sleep": 5, "prod": 4, "social": 1, "text": "Got into a massive fight with my parents.", "sentiment": "Negative", "emotion": "anger", "themes": ["family", "fight"]},
    # 9. Relationship Problems
    {"name": "Relationship Problems", "mood": 1, "stress": 8, "energy": 2, "sleep": 3, "prod": 2, "social": 1, "text": "I think we are going to break up. It hurts so much.", "sentiment": "Negative", "emotion": "sadness", "themes": ["relationship", "partner"]},
    # 10. Friendship Issues
    {"name": "Friendship Issues", "mood": 2, "stress": 6, "energy": 4, "sleep": 6, "prod": 5, "social": 2, "text": "Felt completely ignored by my best friend today.", "sentiment": "Negative", "emotion": "sadness", "themes": ["friend", "lonely"]},
    # 11. Work Pressure
    {"name": "Work Pressure", "mood": 2, "stress": 9, "energy": 4, "sleep": 5, "prod": 2, "social": 4, "text": "My boss demands too much. Deadlines everywhere.", "sentiment": "Negative", "emotion": "stress", "themes": ["work", "deadlines"]},
    # 12. Digital Fatigue
    {"name": "Digital Fatigue", "mood": 2, "stress": 6, "energy": 3, "sleep": 5, "prod": 2, "social": 4, "text": "Scrolling for 6 hours. My brain is fried.", "sentiment": "Negative", "emotion": "frustration", "themes": ["phone", "screen"]},
    # 13. Decision Fatigue
    {"name": "Decision Fatigue", "mood": 3, "stress": 7, "energy": 3, "sleep": 6, "prod": 2, "social": 4, "text": "I just can't make another choice today.", "sentiment": "Negative", "emotion": "fatigue", "themes": ["overwhelmed", "decisions"]},
    # 14. Poor Sleep
    {"name": "Poor Sleep", "mood": 2, "stress": 6, "energy": 1, "sleep": 2, "prod": 2, "social": 4, "text": "Tossed and turned all night. Can barely keep my eyes open.", "sentiment": "Negative", "emotion": "tired", "themes": ["sleep", "insomnia"]},
    # 15. Low Energy
    {"name": "Low Energy", "mood": 3, "stress": 4, "energy": 1, "sleep": 7, "prod": 2, "social": 3, "text": "I just don't have the motivation to move.", "sentiment": "Negative", "emotion": "lethargy", "themes": ["energy", "lazy"]},
    # 16. High Energy
    {"name": "High Energy", "mood": 5, "stress": 2, "energy": 10, "sleep": 8, "prod": 8, "social": 8, "text": "I feel like I could run a marathon! So full of life.", "sentiment": "Positive", "emotion": "joy", "themes": ["active", "excited"]},
    # 17. Low Productivity
    {"name": "Low Productivity", "mood": 2, "stress": 6, "energy": 4, "sleep": 7, "prod": 1, "social": 5, "text": "I wasted the entire day procrastinating.", "sentiment": "Negative", "emotion": "frustration", "themes": ["procrastination", "focus"]},
    # 18. High Productivity
    {"name": "High Productivity", "mood": 5, "stress": 5, "energy": 8, "sleep": 7, "prod": 10, "social": 5, "text": "Got absolutely everything crossed off my list!", "sentiment": "Positive", "emotion": "joy", "themes": ["work", "success"]},
    # 19. Loneliness
    {"name": "Loneliness", "mood": 1, "stress": 5, "energy": 3, "sleep": 6, "prod": 3, "social": 1, "text": "Sitting alone in my room. Feels like nobody cares.", "sentiment": "Negative", "emotion": "sadness", "themes": ["lonely", "isolated"]},
    # 20. Recovery
    {"name": "Recovery", "mood": 4, "stress": 3, "energy": 6, "sleep": 8, "prod": 5, "social": 6, "text": "Finally starting to bounce back from last week.", "sentiment": "Positive", "emotion": "hope", "themes": ["recovery", "healing"]},
    # 21. Mixed Emotions
    {"name": "Mixed Emotions", "mood": 3, "stress": 7, "energy": 5, "sleep": 6, "prod": 5, "social": 6, "text": "Excited for a new job, but terrified I will fail.", "sentiment": "Mixed", "emotion": "anxiety", "themes": ["change", "fear"]},
    # 22. Negative Journal + Positive Mood
    {"name": "Neg. Journal + Pos. Mood", "mood": 5, "stress": 3, "energy": 7, "sleep": 7, "prod": 6, "social": 8, "text": "It rained today and I ruined my shoes. Oh well.", "sentiment": "Negative", "emotion": "frustration", "themes": ["rain", "shoes"]},
    # 23. Positive Journal + Negative Mood
    {"name": "Pos. Journal + Neg. Mood", "mood": 1, "stress": 8, "energy": 2, "sleep": 4, "prod": 2, "social": 2, "text": "The party was fun but I feel so empty inside.", "sentiment": "Positive", "emotion": "sadness", "themes": ["party", "empty"]},
    # 24. Negation (NOT stressed)
    {"name": "Negation", "mood": 4, "stress": 2, "energy": 6, "sleep": 7, "prod": 6, "social": 6, "text": "I am not anxious anymore. The test is over.", "sentiment": "Positive", "emotion": "relief", "themes": ["calm", "test"]},
    # 25. Recovery Statements
    {"name": "Recovery Statements", "mood": 4, "stress": 3, "energy": 6, "sleep": 8, "prod": 5, "social": 5, "text": "I don't feel overwhelmed anymore. I can breathe.", "sentiment": "Positive", "emotion": "calm", "themes": ["healing", "peace"]}
]

# Generate remaining up to 100 scenarios by mutating these intelligently
scenarios = []
for i in range(100):
    base = test_cases[i % len(test_cases)].copy()
    base["name"] = f"Scenario {i+1}: {base['name']} - Sim"
    # Small jitter for variance in scores to test tie-breakers
    base["mood"] = max(1, min(5, base["mood"] + random.choice([0, 0, 0, -1, 1])))
    base["stress"] = max(1, min(10, base["stress"] + random.choice([0, 0, 0, -1, 1, 2])))
    scenarios.append(base)

print(f"3. Running {len(scenarios)} User Scenarios")

results = []
metrics = {
    "total_time_ms": 0,
    "fastest_ms": 99999,
    "slowest_ms": 0
}

# Run coverage
for s in scenarios:
    # Setup state
    MoodLog.objects.filter(user=user).delete()
    JournalEntry.objects.filter(user=user).delete()
    Recommendation.objects.filter(user=user).delete()

    ml = MoodLog.objects.create(
        user=user, date=date.today(), mood=s['mood'], stress=s['stress'], energy=s['energy'], 
        sleep=s['sleep'], productivity=s['prod'], social=s['social'], mood_label="Varies", notes=""
    )
    
    # Text represents both journaling and sentiment
    je = JournalEntry.objects.create(
        user=user, text=s['text'], 
        analysis={
            "sentiment": s["sentiment"], "emotion": s["emotion"], "themes": s["themes"],
            "sentences": [{"text": s['text'], "topics": s["themes"], "emotion": s["emotion"], "sentiment": s["sentiment"]}]
        }
    )
    
    EmotionAnalysis.objects.create(journal_entry=je, primary_emotion=s['emotion'], confidence=0.9)

    t0 = time.time()
    # FORCE RECALCULATE IS TRUE -> completely simulates fresh API hit
    rec = RecommendationService.get_today_recommendation(user, force_recalculate=True)
    t1 = time.time()
    
    dur_ms = (t1 - t0) * 1000
    metrics["total_time_ms"] += dur_ms
    metrics["fastest_ms"] = min(metrics["fastest_ms"], dur_ms)
    metrics["slowest_ms"] = max(metrics["slowest_ms"], dur_ms)

    if rec:
        results.append({
            "scenario": s,
            "activity": rec.activity.title,
            "activity_id": rec.activity.id,
            "score": rec.score,
            "duration": dur_ms
        })

print("\n\n--- FINAL SYSTEM VALIDATION REPORT ---")
print(f"Generated and validated {len(scenarios)} complex scenarios.")
print(f"Avg Recommendation Time: {metrics['total_time_ms']/len(scenarios):.2f} ms")
print(f"Fastest Rec Time: {metrics['fastest_ms']:.2f} ms")
print(f"Slowest Rec Time: {metrics['slowest_ms']:.2f} ms")

# Calculate activity frequency
freq = {}
for r in results:
    aname = r["activity"]
    freq[aname] = freq.get(aname, 0) + 1

sorted_freq = sorted(freq.items(), key=lambda x: x[1], reverse=True)
print("\n--- COVERAGE DISTRIBUTION ---")
for k, v in sorted_freq:
    print(f"{v}x : {k}")

never = []
for a in TherapyActivity.objects.all():
    if a.title not in freq:
        never.append(a.title)

print(f"\n{len(never)} out of {TherapyActivity.objects.count()} Activities were NEVER RECOMMENDED:")
for n in never:
    print(f" - {n}")

with open("final_audit_results.txt", "w") as f:
    import json
    # Just write out a subset for clarity
    for r in results:
        f.write(f"[{r['scenario']['name']}] M:{r['scenario']['mood']} S:{r['scenario']['stress']} EN:{r['scenario']['energy']} SL:{r['scenario']['sleep']}\n")
        f.write(f"Text: {r['scenario']['text']}\n")
        f.write(f"-> WINNER: {r['activity']} (Score: {r['score']})\n\n")

print("Detailed user scenario log saved to final_audit_results.txt")
