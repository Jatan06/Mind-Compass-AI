import os
import sys
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from activities.models import TherapyActivity

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

import copy
scenarios = []
for i in range(100):
    base = base_scenarios[i % len(base_scenarios)]
    s = copy.deepcopy(base)
    s['name'] = f"{base['name']} - Sim {i+1}"
    s['mood'] = max(1, min(5, s['mood'] + random.choice([-1, 0, 1])))
    s['stress'] = max(1, min(10, s['stress'] + random.choice([-1, 0, 1, 2])))
    s['energy'] = max(1, min(10, s['energy'] + random.choice([-2, -1, 0, 1, 2])))
    scenarios.append(s)

activities = list(TherapyActivity.objects.all())

results = []
activity_counts = {}

# Replicate the core logic loop
for idx, s in enumerate(scenarios):
    goals = []
    has_conflict = False
    
    # No overrides based on ID directly!
    
    # Calculate scores directly
    scores = []
    
    for act in activities:
        mood_match = 0.0
        emotion_match = 0.0
        topic_match = 0.0
        
        current_mood_match = 0.0
        current_stress_match = 0.0
        if act.mood_range and len(act.mood_range) == 2:
            if act.mood_range[0] <= s['mood'] <= act.mood_range[1]:
                current_mood_match = 1.0
        if act.stress_range and len(act.stress_range) == 2:
            if act.stress_range[0] <= s['stress'] <= act.stress_range[1]:
                current_stress_match = 1.0
                
        mood_match = (current_mood_match + current_stress_match) / 2.0
        
        if s['emotion'] in act.emotions:
            emotion_match = 1.0
            
        journal_themes_lower = [t.lower() for t in s['themes']]
        for theme in journal_themes_lower:
            if theme in act.topics or theme in act.category.lower() or theme in act.title.lower():
                topic_match = 1.0
                
        suitability_score = (mood_match * 0.3) + (emotion_match * 0.3) + (topic_match * 0.2)
        
        # Tie-breaker jitter natively used in the system
        suitability_score += sum(ord(c) for c in act.id) % 100 / 1000.0
        
        scores.append((act, suitability_score))
        
    scores.sort(key=lambda x: x[1], reverse=True)
    best_act = scores[0][0]
    results.append({"scenario": s, "activity": best_act.title})
    activity_counts[best_act.title] = activity_counts.get(best_act.title, 0) + 1

print("\n--- CLINICAL RECOMMENDATION DISTRIBUTION (100 Scenarios) ---\n")
sorted_counts = sorted(activity_counts.items(), key=lambda x: x[1], reverse=True)
for act, count in sorted_counts:
    print(f"{count}x : {act}")

print("\n--- COVERAGE ANALYSIS ---")
never_recommended = [a.title for a in activities if a.title not in activity_counts]
print(f"\n{len(never_recommended)} out of {len(activities)} Activities were NEVER RECOMMENDED:")
for title in never_recommended:
    print(f" - {title}")
