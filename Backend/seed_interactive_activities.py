import os
import django
import sys

# Configure Django settings
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from activities.models import TherapyActivity

# ----------------------------------------------------
# Massive Interactive Library Upgrade
# We preserve stable IDs (act-1 to act-15) to maintain ForeignKey relations
# We introduce rigorous new ones.
# ----------------------------------------------------

interactive_activities = [
    # 1. Breathing Circle (Deep Breathing)
    {
        "id": "act-1",
        "title": "Box Breathing",
        "category": "Breathing",
        "duration": "5 min",
        "difficulty": "Beginner",
        "interactive_type": "breathing_circle",
        "estimated_time": 5,
        "mood_range": [1, 5],
        "stress_range": [6, 10],
        "topics": ["anxiety", "panic", "stress", "work pressure", "exam anxiety"],
        "emotions": ["anxious", "overwhelmed", "stressed", "panicked"],
        "contraindications": [],
        "description": "A powerful technique to rapidly lower autonomic arousal and calm the nervous system.",
        "instructions": [
            {"type": "static_text", "text": "Box breathing helps regulate your nervous system."},
            {"type": "breathing_circle", "text": "Follow the circle. Breathe in, hold, and release.", "target_cycles": 5, "inhale_duration": 4, "hold_duration": 4, "exhale_duration": 4}
        ]
    },
    # 2. Text Input / Reframing
    {
        "id": "act-2",
        "title": "Cognitive Reframing",
        "category": "Cognitive Exercises",
        "duration": "10 min",
        "difficulty": "Moderate",
        "interactive_type": "text_input",
        "estimated_time": 10,
        "mood_range": [2, 6],
        "stress_range": [4, 8],
        "topics": ["negative thinking", "overthinking", "self-doubt", "loneliness", "relationship stress"],
        "emotions": ["sad", "hopeless", "insecure", "angry"],
        "contraindications": ["extreme depression"],
        "description": "Identify a negative thought and challenge it with a more balanced perspective.",
        "instructions": [
            {"type": "static_text", "text": "Let's examine how we process difficult moments."},
            {"type": "static_text", "text": "Your recent journal suggested feelings of {{primary_emotion}} regarding {{journal_topic}}."},
            {"type": "text_input", "text": "Write down the exact negative thought causing you distress.", "min_length": 10, "placeholder": "I am worried that..."},
            {"type": "text_input", "text": "Now, write one piece of evidence that contradicts this negative thought.", "min_length": 15, "placeholder": "Actually, in the past I..."}
        ]
    },
    # 3. Gratitude Journal (Personalized)
    {
        "id": "act-3",
        "title": "Guided Gratitude",
        "category": "Journaling",
        "duration": "5 min",
        "difficulty": "Beginner",
        "interactive_type": "text_input",
        "estimated_time": 5,
        "mood_range": [3, 10],
        "stress_range": [1, 6],
        "topics": ["positive mood maintenance", "recovery", "family", "relationships", "success"],
        "emotions": ["calm", "happy", "content", "bored"],
        "contraindications": ["severe anxiety", "active panic"],
        "description": "Shift your focus to the positive elements of your life.",
        "instructions": [
            {"type": "static_text", "text": "Gratitude rewires your brain to notice positive events."},
            {"type": "text_input", "text": "Think about {{journal_topic}} from today. What is one specific thing that went well?", "min_length": 15, "placeholder": "I am grateful today because..."}
        ]
    },
    # 4. Pattern Recall Challenge (Focus Sprint)
    {
        "id": "act-4",
        "title": "Pattern Disruption",
        "category": "Cognitive Exercises",
        "duration": "3 min",
        "difficulty": "Moderate",
        "interactive_type": "pattern_recall",
        "estimated_time": 3,
        "mood_range": [1, 4],
        "stress_range": [7, 10],
        "topics": ["rumination", "overthinking", "panic attacks"],
        "emotions": ["anxious", "scared", "panicked", "spiraling"],
        "contraindications": ["low energy", "fatigue"],
        "description": "Interrupt panic and rumination by engaging your working memory.",
        "instructions": [
            {"type": "static_text", "text": "When the mind races, we can anchor it with a cognitive task."},
            {"type": "progress_tap", "text": "Focus on the present moment. Tap the circle 15 times rhythmically.", "target_taps": 15}
        ]
    },
    # 5. Checklist (Goal Breakdown)
    {
        "id": "act-5",
        "title": "Values & Priority Alignment",
        "category": "Stress Management",
        "duration": "5 min",
        "difficulty": "Beginner",
        "interactive_type": "checklist",
        "estimated_time": 5,
        "mood_range": [2, 6],
        "stress_range": [6, 9],
        "topics": ["burnout", "work pressure", "lack of motivation"],
        "emotions": ["overwhelmed", "lost", "tired", "stressed"],
        "contraindications": [],
        "description": "Break down overwhelming stress into actionable, value-aligned checkpoints.",
        "instructions": [
            {"type": "static_text", "text": "Burnout occurs when our effort doesn't feel aligned with our progress."},
            {"type": "checklist", "text": "Acknowledge these truths before we begin:", "list_items": [
                "I cannot control everything.", 
                "I will focus only on my immediate next step.", 
                "My worth is not tied to my productivity."
            ]},
            {"type": "text_input", "text": "What is the ONE most important task you must do today?", "min_length": 5, "placeholder": "I need to..."}
        ]
    },
    # 6. Physical Activity (Hold Release / Isometric)
    {
        "id": "act-6",
        "title": "Progressive Muscle Relaxation",
        "category": "Physical Activity",
        "duration": "10 min",
        "difficulty": "Beginner",
        "interactive_type": "hold_release",
        "estimated_time": 10,
        "mood_range": [1, 7],
        "stress_range": [5, 10],
        "topics": ["physical tension", "poor sleep", "anxiety"],
        "emotions": ["tense", "anxious", "restless", "angry"],
        "contraindications": ["physical injury"],
        "description": "Release trapped tension in the body by systematically tensing and relaxing muscle groups.",
        "instructions": [
            {"type": "static_text", "text": "Somatic release helps signal safety to the brain."},
            {"type": "hold_release", "text": "Tense your shoulders and hands tightly. Hold the button to build tension.", "hold_seconds": 6},
            {"type": "static_text", "text": "Release. Notice the sensation of warmth as the muscles drop."},
            {"type": "hold_release", "text": "Now, tense your legs and core. Hold firmly.", "hold_seconds": 6}
        ]
    },
    # 7. Emotion Identification (Slider)
    {
        "id": "act-7",
        "title": "Emotional Temperature Check",
        "category": "Emotional Regulation",
        "duration": "2 min",
        "difficulty": "Beginner",
        "interactive_type": "slider",
        "estimated_time": 2,
        "mood_range": [1, 10],
        "stress_range": [1, 10],
        "topics": ["emotional conflict", "loneliness", "digital fatigue", "unspecified drift"],
        "emotions": ["numb", "confused", "detached", "lost"],
        "contraindications": [],
        "description": "A quick pulse check to identify the intensity of underlying feelings.",
        "instructions": [
            {"type": "static_text", "text": "Sometimes we feel off without knowing exactly why."},
            {"type": "slider", "text": "How tense does your physical body feel right now?", "min_label": "Completely Relaxed", "max_label": "Highly Tense"},
            {"type": "slider", "text": "How fast are your thoughts racing?", "min_label": "Stagnant / Slow", "max_label": "Spiraling / Rapid"}
        ]
    },
    # 8. Anxiety Grounding
    {
        "id": "act-8",
        "title": "5-4-3-2-1 Grounding",
        "category": "Grounding",
        "duration": "5 min",
        "difficulty": "Beginner",
        "interactive_type": "text_input",
        "estimated_time": 5,
        "mood_range": [1, 5],
        "stress_range": [7, 10],
        "topics": ["panic", "anxiety", "dissociation"],
        "emotions": ["fearful", "panicked", "overwhelmed"],
        "contraindications": [],
        "description": "Anchor yourself in reality using your five senses.",
        "instructions": [
            {"type": "static_text", "text": "Use this exercise to pull yourself out of a spiral."},
            {"type": "checklist", "text": "Look around and explicitly acknowledge:", "list_items": [
                "I see a window or light source.",
                "I feel the chair or floor beneath me.",
                "I hear a background noise."
            ]},
            {"type": "text_input", "text": "Name 3 things you can see right now.", "min_length": 5, "placeholder": "A desk, my hands..."}
        ]
    },
    
    # 9. Low Energy Focus
    {
        "id": "act-9",
        "title": "Energy Rehabilitation",
        "category": "Physical Activity",
        "duration": "3 min",
        "difficulty": "Beginner",
        "interactive_type": "progress_tap",
        "estimated_time": 3,
        "mood_range": [1, 4],
        "stress_range": [1, 5],
        "topics": ["low energy", "fatigue", "depression"],
        "emotions": ["tired", "exhausted", "hopeless"],
        "contraindications": [],
        "description": "A micro-intervention to gently kickstart the nervous system when energy is extremely low.",
        "instructions": [
            {"type": "static_text", "text": "When energy is low, momentum is key. Start small."},
            {"type": "checklist", "text": "Take these tiny physical actions now.", "list_items": [
                "Sit up 1% straighter.",
                "Take one deep breath.",
                "Roll your shoulders back once."
            ]},
            {"type": "progress_tap", "text": "Tap here 10 times to build a tiny micro-momentum.", "target_taps": 10}
        ]
    },

    # 10. Study Anxiety Relief
    {
        "id": "act-10",
        "title": "Exam Anxiety Release",
        "category": "Stress Management",
        "duration": "5 min",
        "difficulty": "Beginner",
        "interactive_type": "breathing_circle",
        "estimated_time": 5,
        "mood_range": [2, 6],
        "stress_range": [6, 10],
        "topics": ["study stress", "exam anxiety", "academic pressure"],
        "emotions": ["anxious", "worried", "stressed"],
        "contraindications": [],
        "description": "Clear your mind to regain focus before or during intense study sessions.",
        "instructions": [
            {"type": "static_text", "text": "Performance anxiety clouds working memory. Let's clear the fog."},
            {"type": "breathing_circle", "text": "Take 4 slow breaths to regulate.", "target_cycles": 4, "inhale_duration": 4, "hold_duration": 2, "exhale_duration": 6},
            {"type": "checklist", "text": "Acknowledge the facts:", "list_items": [
                "I have prepared to the best of my current ability.",
                "Perfection is not required for progress.",
                "I will tackle the next question one at a time."
            ]}
        ]
    },
    # 11. Work Pressure (Decision Fatigue)
    {
        "id": "act-11",
        "title": "Decision Fatigue Reboot",
        "category": "Cognitive Exercises",
        "duration": "5 min",
        "difficulty": "Moderate",
        "interactive_type": "text_input",
        "estimated_time": 5,
        "mood_range": [2, 5],
        "stress_range": [6, 10],
        "topics": ["work pressure", "burnout", "decision fatigue", "overwhelmed"],
        "emotions": ["tired", "exhausted", "stressed", "overwhelmed"],
        "contraindications": [],
        "description": "Clear out mental clutter by temporarily outsourcing your decisions.",
        "instructions": [
            {"type": "static_text", "text": "When making decisions becomes exhausting, we need to artificially narrow our choices."},
            {"type": "text_input", "text": "List exactly 1 thing you must do in the next hour.", "min_length": 5, "placeholder": "I just need to finish..."},
            {"type": "progress_tap", "text": "Give yourself permission to ignore everything else. Tap 10 times to lock this focus.", "target_taps": 10}
        ]
    },
    # 12. Digital Fatigue
    {
        "id": "act-12",
        "title": "Digital Overload Reset",
        "category": "Digital Wellbeing",
        "duration": "3 min",
        "difficulty": "Beginner",
        "interactive_type": "breathing_circle",
        "estimated_time": 3,
        "mood_range": [1, 6],
        "stress_range": [4, 8],
        "topics": ["digital fatigue", "brain fog", "scrolling", "distraction"],
        "emotions": ["numb", "tired", "detached", "bored"],
        "contraindications": [],
        "description": "A rapid physical reset to pull you out of mindless scrolling.",
        "instructions": [
            {"type": "static_text", "text": "Your eyes and brain need a break from the screen glare."},
            {"type": "checklist", "text": "Perform these physical actions immediately:", "list_items": [
                "Look at an object 20 feet away for 20 seconds.",
                "Blink rapidly 10 times to lubricate your eyes.",
                "Roll your neck slowly from left to right."
            ]},
            {"type": "breathing_circle", "text": "Close your eyes if you want, and follow the rhythmic haptics or visuals.", "target_cycles": 3, "inhale_duration": 4, "hold_duration": 0, "exhale_duration": 4}
        ]
    },
    # 13. Family Conflict
    {
        "id": "act-13",
        "title": "Conflict De-escalation",
        "category": "Social Wellness",
        "duration": "8 min",
        "difficulty": "Advanced",
        "interactive_type": "text_input",
        "estimated_time": 8,
        "mood_range": [1, 4],
        "stress_range": [7, 10],
        "topics": ["family conflict", "relationship issues", "arguments", "anger"],
        "emotions": ["angry", "frustrated", "misunderstood", "hurt"],
        "contraindications": [],
        "description": "Process elevated anger and frustration before reacting externally.",
        "instructions": [
            {"type": "static_text", "text": "During conflict, our \"fight or flight\" amygdala overrides our logical brain."},
            {"type": "hold_release", "text": "Squeeze your fists tightly to concentrate the physical anger. Hold the button to track.", "hold_seconds": 8},
            {"type": "static_text", "text": "Now let's engage the logical prefrontal cortex."},
            {"type": "text_input", "text": "What is the core boundary or need you feel is being violated right now?", "min_length": 10, "placeholder": "I feel like I am not being heard when..."}
        ]
    }
]

print("Initializing seed update for Interactive Activity Overhaul...")
valid_ids = []

for data in interactive_activities:
    activity, created = TherapyActivity.objects.update_or_create(
        id=data["id"],
        defaults={
            "title": data["title"],
            "category": data["category"],
            "duration": data["duration"],
            "difficulty": data["difficulty"],
            "interactive_type": data["interactive_type"],
            "estimated_time": data["estimated_time"],
            "mood_range": data["mood_range"],
            "stress_range": data["stress_range"],
            "topics": data["topics"],
            "emotions": data["emotions"],
            "contraindications": data["contraindications"],
            "description": data["description"],
            "instructions": data["instructions"],
        }
    )
    valid_ids.append(activity.id)
    print(f"[{'NEW' if created else 'UPDATED'}] {activity.id}: {activity.title} ({activity.interactive_type})")

# Let's ensure any activity not in this list still exists for safety,
# but we can force them to use a safe interactive static fallback if they lack instructions.
print("Iterating through all other activities to ensure JSON valid structures...")
for fallback in TherapyActivity.objects.exclude(id__in=valid_ids):
    # Just ensure instructions isn't totally broken
    is_updated = False
    new_inst = []
    if type(fallback.instructions) is list:
        for it in fallback.instructions:
            if type(it) is str:
                new_inst.append({"type": "static_text", "text": it})
                is_updated = True
            else:
                new_inst.append(it)
    elif fallback.instructions:
        new_inst = [{"type": "static_text", "text": fallback.description}]
        is_updated = True
        
    if not new_inst:
        new_inst = [{"type": "static_text", "text": fallback.description}]
        is_updated = True
    
    # ENFORCE WIDGET: If no widget exists, append one!
    has_widget = any(i.get('type') != 'static_text' for i in new_inst)
    if not has_widget:
        cat = fallback.category.lower() if fallback.category else ''
        if 'breath' in cat or 'relax' in cat or 'meditat' in cat or 'sleep' in cat:
            new_inst.append({"type": "breathing_circle", "text": "Take a few regulated breaths to integrate this.", "target_cycles": 3, "inhale_duration": 4, "hold_duration": 0, "exhale_duration": 4})
        elif 'cogni' in cat or 'journal' in cat or 'gratitude' in cat:
            new_inst.append({"type": "text_input", "text": "Reflect on one specific takeaway from this exercise.", "min_length": 5, "placeholder": "I realize that..."})
        elif 'phys' in cat or 'ground' in cat:
            new_inst.append({"type": "hold_release", "text": "Tense your core to physically ground yourself, then release.", "hold_seconds": 4})
        else:
            new_inst.append({"type": "progress_tap", "text": "Acknowledge this information. Tap 5 times to confirm.", "target_taps": 5})
        is_updated = True
    
    if is_updated:
        fallback.instructions = new_inst
        fallback.save(update_fields=['instructions'])
        print(f"[FORCED WIDGET FALLBACK] {fallback.id}: {fallback.title}")

print("✅ Successfully seeded 10 high-quality Interactive Minigames, and patched remaining legacy files.")
