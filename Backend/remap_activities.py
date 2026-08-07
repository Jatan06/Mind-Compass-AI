import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from activities.models import TherapyActivity

acts = TherapyActivity.objects.all()

for act in acts:
    topics = []
    emotions = []
    mood_range = [1, 5]
    stress_range = [0, 10]
    
    title = act.title.lower()
    category = act.category.lower()

    # 1. Base Category Rules
    if category == "stress management" or category == "breathing":
        topics.extend(["stress", "pressure", "work", "overwhelmed"])
        emotions.extend(["Stress", "Anxiety", "Frustrated", "Overwhelmed", "Nervous"])
        stress_range = [6, 10]
    
    elif category == "grounding":
        topics.extend(["panic", "racing thoughts", "dissociation", "what if"])
        emotions.extend(["Panic", "Anxiety", "Fearful", "Stuck"])
        stress_range = [7, 10]

    elif category == "digital wellbeing":
        topics.extend(["screen", "doomscrolling", "headache", "tired"])
        emotions.extend(["Fatigue", "Apathetic", "Bored"])
        mood_range = [1, 4]

    elif category == "social wellness":
        topics.extend(["partner", "parents", "friends", "argument", "misunderstanding", "fight"])
        emotions.extend(["Lonely", "Hurt", "Angry", "Guilty"])

    elif category == "sleep hygiene":
        topics.extend(["insomnia", "sleep", "tired", "woke up", "restless"])
        emotions.extend(["Tired", "Restless", "Fatigue", "Irritable"])
        stress_range = [4, 10]

    elif category == "gratitude":
        topics.extend(["success", "routine", "friends", "blessed", "good"])
        emotions.extend(["Joy", "Contentment", "Proud", "Hopeful"])
        mood_range = [3, 5]
        stress_range = [0, 5]

    elif category == "anxiety relief":
        topics.extend(["worry", "what if", "future", "mind racing", "dread"])
        emotions.extend(["Anxiety", "Fearful", "Restless", "Dread"])
        stress_range = [5, 10]

    elif category == "cognitive exercises":
        topics.extend(["mistake", "failure", "imposter", "stuck"])
        emotions.extend(["Insecure", "Anxious", "Frustrated"])
        mood_range = [2, 4]

    elif category == "emotional regulation":
        topics.extend(["crying", "mood swings", "loss", "grief", "pain"])
        emotions.extend(["Sadness", "Grief", "Lost", "Pain"])
        mood_range = [1, 3]

    elif category == "physical activity":
        topics.extend(["stiff", "ache", "sluggish", "couch"])
        emotions.extend(["Sluggish", "Frustrated"])
        stress_range = [3, 8]

    # 2. Specific Title Overrides
    if "exam anxiety" in title:
        topics = ["exam", "study", "school", "finals", "failing", "test"]
        emotions = ["Anxious", "Fearful", "Stress"]
        stress_range = [6, 10]
    
    if "decision fatigue" in title:
        topics = ["choices", "decisions", "overload", "too many"]
        emotions = ["Overwhelmed", "Fatigue"]
        stress_range = [5, 9]
        
    if "communication reflection" in title or "conflict" in title:
        topics = ["family", "fight", "misunderstanding", "argument", "parents", "partner"]
        emotions = ["Frustrated", "Angry", "Hurt"]
        
    if "goal" in title or "socratic" in title or "values" in title:
        topics = ["motivation", "stuck", "procrastination", "avoiding", "lazy"]
        emotions = ["Apathetic", "Sluggish", "Overwhelmed", "Guilty"]
        mood_range = [1, 4]
        stress_range = [2, 8]
        
    if "walk" in title or "somatic" in title:
        topics = ["burnout", "exhausted", "low energy", "stuck"]
        emotions = ["Fatigue", "Sluggish", "Tired"]
        stress_range = [1, 5]

    if "three good things" in title:
        topics = ["happy", "success", "milestone", "friend", "feeling better"]
        emotions = ["Joy", "Proud", "Inspired", "Hopeful", "Calm"]
        mood_range = [4, 5]
        stress_range = [0, 4]
        
    if "gratitude jar" in title or "letter" in title:
        topics = ["alone", "loss", "grief", "ignored", "solitude", "no messages"]
        emotions = ["Lonely", "Sadness", "Grief"]
        mood_range = [1, 3]

    if "digital detox" in title:
        topics = ["digital", "screens", "social media", "overload"]
        emotions = ["Apathetic", "Brain Fog", "Tired"]

    # Special handling for missing overrides entirely - make it very general baseline
    if not topics and not emotions:
        topics = ["routine"]
        emotions = ["Neutral"]
        mood_range = [2, 4]
        
    act.topics = list(set(topics))
    act.emotions = list(set(emotions))
    act.mood_range = mood_range
    act.stress_range = stress_range
    act.save()

print(f"Successfully remapped {acts.count()} activities dynamically via clinical categorization rules.")
