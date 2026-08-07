import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from recommendation.models import Recommendation
from activities.models import TherapyActivity

print("Testing Clinical Recommendation Logic...")

scenarios = [
    {
        "name": "Burnout (High Stress, Low Energy, Low Mood)",
        "mood": 2,
        "stress": 8,
        "energy": 2,
        "journal_themes": ["work", "exhaustion", "deadline", "tired"],
        "emotions": ["Fatigue", "Overwhelmed"]
    },
    {
        "name": "Anxiety (High Stress, Medium Mood, Restless)",
        "mood": 3,
        "stress": 9,
        "energy": 8,
        "journal_themes": ["exam", "nervous", "future", "fear"],
        "emotions": ["Anxious", "Nervous", "Fearful"]
    },
    {
        "name": "Loneliness (Low Mood, Low Stress, Sadness)",
        "mood": 2,
        "stress": 3,
        "energy": 4,
        "journal_themes": ["alone", "isolation", "friends", "sad"],
        "emotions": ["Sadness", "Lonely"]
    },
    {
        "name": "Happy/Stable (High Mood, Low Stress, High Energy)",
        "mood": 5,
        "stress": 2,
        "energy": 9,
        "journal_themes": ["success", "happy", "sunshine", "walk"],
        "emotions": ["Joy", "Excitement"]
    }
]

for idx, scenario in enumerate(scenarios):
    print(f"\n--- Scenario {idx+1}: {scenario['name']} ---")
    activities = TherapyActivity.objects.all()
    if not activities.exists():
        print("No activities available.")
        continue
    
    scores = []
    
    for act in activities:
        score = 0.0
        details = []
        
        # Mood Alignment (Array [min, max])
        try:
            if act.mood_range and len(act.mood_range) == 2:
                if act.mood_range[0] <= scenario['mood'] <= act.mood_range[1]:
                    score += 20
                    details.append(f"Mood Match in {act.mood_range}")
                else:
                    score -= 5
        except (TypeError, ValueError):
            pass
            
        # Stress Alignment (Array [min, max])
        try:
            if act.stress_range and len(act.stress_range) == 2:
                if act.stress_range[0] <= scenario['stress'] <= act.stress_range[1]:
                    score += 20
                    details.append(f"Stress Match in {act.stress_range}")
        except (TypeError, ValueError):
            pass
            
        # Theme matching
        matched_themes = [t for t in act.topics if t.lower() in [s.lower() for s in scenario['journal_themes']]]
        if matched_themes:
            score += len(matched_themes) * 15
            details.append(f"Theme match ({', '.join(matched_themes)})")
            
        # Emotion match
        matched_emotions = [e for e in act.emotions if e.lower() in [s.lower() for s in scenario['emotions']]]
        if matched_emotions:
            score += len(matched_emotions) * 10
            details.append(f"Emotion match ({', '.join(matched_emotions)})")
            
        scores.append({
            "activity": act.title,
            "category": act.category,
            "score": score,
            "details": details
        })
        
    scores.sort(key=lambda x: x['score'], reverse=True)
    print(f"Top 3 Recommendations:")
    for i in range(min(3, len(scores))):
        s = scores[i]
        print(f"  {i+1}. {s['activity']} (Score: {s['score']}) [{s['category']}]")
        print(f"     Reasons: {', '.join(s['details'])}")
