import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from activities.models import TherapyActivity

activities = TherapyActivity.objects.all()

for act in activities:
    # Default assignments based on logic in services.py
    cat = act.category.lower()
    title = act.title.lower()
    
    act.topics = []
    act.emotions = []
    act.contraindications = []
    act.interactive_type = 'static'
    act.stress_range = [0, 10]
    act.mood_range = [1, 5]

    try:
        dur_int = int(act.duration.replace("min", "").strip())
    except:
        dur_int = 5
    act.estimated_time = dur_int
    
    # Overrides matching legacy logic directly:
    if act.id == 'act-1':
        act.stress_range = [7, 10]
        act.interactive_type = 'breathing'
    elif act.id == 'act-17':
        act.mood_range = [4, 5]
        act.topics = ['gratitude', 'positive', 'happy']
    elif act.id == 'act-10':
        act.mood_range = [1, 5]
    elif act.id == 'act-37':
        # "Somating Shakeout" - Low energy mapping => let's say it's active movement
        act.interactive_type = 'somatic'
        act.mood_range = [1, 3] # Low mood / energy
    elif act.id == 'act-15':
        act.topics = ['sleep', 'insomnia', 'rest']
    elif act.id == 'act-33':
        act.emotions = ['Sad', 'Angry', 'Fear', 'Anxiety', 'Stress', 'Frustrated', 'Lonely', 'Overwhelmed']
        act.interactive_type = 'grounding'
        act.mood_range = [1, 2] # Low mood
    
    # General categorical allocations
    if 'sleep' in title or 'sleep' in cat:
        act.topics.extend(['sleep', 'insomnia', 'rest'])
    if 'breathing' in cat:
        act.stress_range = [5, 10]
        if act.interactive_type == 'static': act.interactive_type = 'breathing'
        act.emotions.extend(['Anxiety', 'Stress', 'Fear', 'Overwhelmed', 'Frustrated'])
    if 'grounding' in cat:
        if act.interactive_type == 'static': act.interactive_type = 'grounding'
        act.emotions.extend(['Anxiety', 'Overwhelmed', 'Stress', 'Fear'])
        act.mood_range = [1, 3]
    if 'somatic' in cat:
        act.emotions.extend(['Frustrated', 'Overwhelmed', 'Anxiety'])
        if act.interactive_type == 'static': act.interactive_type = 'somatic'
    if 'gratitude' in cat:
        act.topics.extend(['relationship', 'family'])
        act.emotions.extend(['Sad', 'Lonely', 'Grief'])
    if 'meditation' in cat or 'mindfulness' in cat:
        if act.interactive_type == 'static': act.interactive_type = 'mindfulness'
        act.topics.extend(['exam', 'study', 'work', 'stress'])

    # Deduplicate
    act.topics = list(set(act.topics))
    act.emotions = list(set(act.emotions))

    act.save()

print("Activity properties seeded successfully.")
