import json
from django.core.management.base import BaseCommand
from activities.models import TherapyActivity

def make_desc(short_desc, purpose, moods, conditions, benefits, precautions, setting, format_type, equipment, rationale, evidence):
    return (
        f"{short_desc}\n\n"
        f"---\n"
        f"**Clinical Purpose:** {purpose}\n"
        f"**Suitable Moods:** {moods}\n"
        f"**Suitable Mental Health Conditions:** {conditions}\n"
        f"**Scientific Benefits:** {benefits}\n"
        f"**Contraindications/Precautions:** {precautions}\n"
        f"**Setting:** {setting}\n"
        f"**Format:** {format_type}\n"
        f"**Equipment Required:** {equipment}\n"
        f"**Scientific Rationale:** {rationale}\n"
        f"**Evidence Level:** {evidence}"
    )

# ─────────────────────────────────────────────────────────────────────────────
# Activity metadata: topics, emotions, mood_range, stress_range
# mood_range: [min_mood, max_mood]  (1=Down … 5=Excellent)
# stress_range: [min_stress, max_stress]  (0=Calm … 10=Highly Stressed)
# topics: list of journal themes this activity addresses
# emotions: list of emotion labels this activity targets
# ─────────────────────────────────────────────────────────────────────────────
ACTIVITY_METADATA = {
    "act-1":  {"mood_range": [1, 3], "stress_range": [6, 10], "topics": ["stress", "anxiety", "study", "exam", "work"],     "emotions": ["Anxiety", "Stress", "Overwhelmed", "Fear"]},
    "act-2":  {"mood_range": [1, 3], "stress_range": [5, 10], "topics": ["sleep", "anxiety"],                               "emotions": ["Anxiety", "Stress", "Fear"]},
    "act-3":  {"mood_range": [1, 4], "stress_range": [4, 9],  "topics": ["stress", "work", "study"],                       "emotions": ["Stress", "Anxiety", "Frustrated"]},
    "act-4":  {"mood_range": [1, 2], "stress_range": [7, 10], "topics": ["stress", "panic", "anxiety"],                    "emotions": ["Fear", "Overwhelmed", "Stress", "Anxiety"]},
    "act-5":  {"mood_range": [1, 3], "stress_range": [4, 10], "topics": ["sleep", "health", "stress"],                     "emotions": ["Emotionally exhausted", "Stress", "Overwhelmed"]},
    "act-6":  {"mood_range": [1, 3], "stress_range": [0, 7],  "topics": ["family", "relationship", "friends", "loneliness"],"emotions": ["Lonely", "Sad", "Angry"]},
    "act-7":  {"mood_range": [1, 3], "stress_range": [4, 9],  "topics": ["stress", "work", "study"],                       "emotions": ["Stress", "Overwhelmed", "Frustrated"]},
    "act-8":  {"mood_range": [1, 4], "stress_range": [3, 8],  "topics": ["study", "exam", "work"],                         "emotions": ["Stress", "Anxiety", "Frustrated"]},
    "act-9":  {"mood_range": [1, 4], "stress_range": [0, 6],  "topics": ["food", "health"],                                "emotions": ["Emotionally exhausted", "Overwhelmed"]},
    "act-10": {"mood_range": [1, 3], "stress_range": [3, 8],  "topics": ["stress", "exercise", "work"],                    "emotions": ["Anxiety", "Sad", "Emotionally exhausted"]},
    "act-11": {"mood_range": [1, 3], "stress_range": [4, 9],  "topics": ["anxiety", "stress", "study"],                   "emotions": ["Anxiety", "Overwhelmed", "Stress"]},
    "act-12": {"mood_range": [2, 4], "stress_range": [4, 8],  "topics": ["stress", "work", "study"],                       "emotions": ["Stress", "Overwhelmed", "Frustrated"]},
    "act-13": {"mood_range": [1, 3], "stress_range": [3, 8],  "topics": ["sleep"],                                         "emotions": ["Stress", "Anxiety", "Emotionally exhausted"]},
    "act-14": {"mood_range": [1, 3], "stress_range": [4, 9],  "topics": ["sleep", "anxiety", "study"],                    "emotions": ["Anxiety", "Stress", "Overwhelmed"]},
    "act-15": {"mood_range": [1, 3], "stress_range": [3, 8],  "topics": ["sleep"],                                         "emotions": ["Emotionally exhausted", "Stress", "Anxiety"]},
    "act-16": {"mood_range": [1, 3], "stress_range": [3, 8],  "topics": ["sleep", "health"],                               "emotions": ["Stress", "Emotionally exhausted", "Anxiety"]},
    "act-17": {"mood_range": [3, 5], "stress_range": [0, 5],  "topics": ["family", "friends", "exercise"],                 "emotions": ["Happy", "Calm", "Grateful", "Hopeful"]},
    "act-18": {"mood_range": [2, 4], "stress_range": [0, 6],  "topics": ["family", "friends", "relationship", "loneliness"],"emotions": ["Lonely", "Sad", "Grateful"]},
    "act-19": {"mood_range": [1, 3], "stress_range": [0, 5],  "topics": ["family", "friends"],                             "emotions": ["Sad", "Lonely", "Hopeful"]},
    "act-20": {"mood_range": [3, 5], "stress_range": [0, 5],  "topics": ["family", "friends", "exercise"],                 "emotions": ["Happy", "Calm", "Grateful"]},
    "act-21": {"mood_range": [1, 3], "stress_range": [4, 9],  "topics": ["study", "work", "anxiety"],                     "emotions": ["Frustrated", "Angry", "Anxiety", "Stress"]},
    "act-22": {"mood_range": [1, 2], "stress_range": [4, 10], "topics": ["family", "relationship", "health"],              "emotions": ["Sad", "Overwhelmed", "Fear", "Angry"]},
    "act-23": {"mood_range": [1, 3], "stress_range": [2, 7],  "topics": ["career", "work", "study"],                      "emotions": ["Frustrated", "Sad", "Overwhelmed"]},
    "act-24": {"mood_range": [2, 4], "stress_range": [2, 7],  "topics": ["career", "study", "work"],                      "emotions": ["Frustrated", "Motivated", "Hopeful"]},
    "act-25": {"mood_range": [2, 4], "stress_range": [3, 8],  "topics": ["stress", "work", "exercise"],                   "emotions": ["Anxiety", "Stress", "Overwhelmed"]},
    "act-26": {"mood_range": [1, 3], "stress_range": [2, 7],  "topics": ["exercise", "sleep", "work"],                    "emotions": ["Sad", "Emotionally exhausted", "Overwhelmed"]},
    "act-27": {"mood_range": [1, 2], "stress_range": [6, 10], "topics": ["stress", "anxiety"],                             "emotions": ["Angry", "Fear", "Overwhelmed", "Stress"]},
    "act-28": {"mood_range": [2, 4], "stress_range": [3, 8],  "topics": ["stress", "work", "exercise"],                   "emotions": ["Stress", "Emotionally exhausted", "Frustrated"]},
    "act-29": {"mood_range": [1, 3], "stress_range": [4, 9],  "topics": ["stress", "health", "work"],                     "emotions": ["Stress", "Anxiety", "Emotionally exhausted"]},
    "act-30": {"mood_range": [1, 3], "stress_range": [5, 10], "topics": ["stress", "work", "study"],                      "emotions": ["Stress", "Overwhelmed", "Emotionally exhausted"]},
    "act-31": {"mood_range": [1, 3], "stress_range": [4, 9],  "topics": ["stress", "health", "anxiety"],                  "emotions": ["Stress", "Anxiety", "Emotionally exhausted"]},
    "act-32": {"mood_range": [1, 1], "stress_range": [8, 10], "topics": ["anxiety", "stress"],                             "emotions": ["Fear", "Overwhelmed", "Anxiety"]},
    "act-33": {"mood_range": [1, 2], "stress_range": [5, 10], "topics": ["anxiety", "stress", "study"],                   "emotions": ["Anxiety", "Fear", "Sad", "Overwhelmed"]},
    "act-34": {"mood_range": [1, 2], "stress_range": [5, 10], "topics": ["anxiety", "stress"],                             "emotions": ["Anxiety", "Fear", "Overwhelmed"]},
    "act-35": {"mood_range": [1, 3], "stress_range": [5, 10], "topics": ["work", "study", "career"],                      "emotions": ["Overwhelmed", "Stressed", "Frustrated"]},
    "act-36": {"mood_range": [1, 3], "stress_range": [5, 9],  "topics": ["work", "study", "anxiety"],                     "emotions": ["Overwhelmed", "Anxiety", "Stress"]},
    "act-37": {"mood_range": [1, 3], "stress_range": [5, 10], "topics": ["stress", "exercise"],                            "emotions": ["Stress", "Angry", "Overwhelmed", "Emotionally exhausted"]},
    "act-38": {"mood_range": [1, 3], "stress_range": [5, 9],  "topics": ["stress", "health", "work"],                     "emotions": ["Stress", "Anxiety", "Frustrated"]},
    "act-39": {"mood_range": [1, 3], "stress_range": [4, 9],  "topics": ["anxiety", "study", "work"],                     "emotions": ["Anxiety", "Overwhelmed", "Stress"]},
    "act-40": {"mood_range": [1, 3], "stress_range": [4, 8],  "topics": ["anxiety", "stress"],                             "emotions": ["Anxiety", "Overwhelmed", "Stress"]},
    "act-41": {"mood_range": [1, 3], "stress_range": [5, 10], "topics": ["anxiety", "study", "exam", "work"],             "emotions": ["Anxiety", "Fear", "Overwhelmed"]},
    "act-42": {"mood_range": [1, 2], "stress_range": [4, 9],  "topics": ["family", "relationship"],                       "emotions": ["Angry", "Sad", "Fear"]},
    "act-43": {"mood_range": [1, 3], "stress_range": [3, 8],  "topics": ["family", "relationship", "loneliness"],         "emotions": ["Sad", "Lonely", "Overwhelmed"]},
    "act-44": {"mood_range": [1, 3], "stress_range": [3, 7],  "topics": ["stress", "anxiety"],                             "emotions": ["Frustrated", "Overwhelmed", "Angry", "Sad"]},
    "act-45": {"mood_range": [1, 2], "stress_range": [7, 10], "topics": ["anxiety", "stress"],                             "emotions": ["Fear", "Angry", "Overwhelmed", "Stress"]},
    "act-46": {"mood_range": [1, 3], "stress_range": [3, 8],  "topics": ["sleep", "work", "study"],                       "emotions": ["Emotionally exhausted", "Stress", "Overwhelmed"]},
    "act-47": {"mood_range": [1, 3], "stress_range": [3, 7],  "topics": ["sleep", "work"],                                 "emotions": ["Stress", "Emotionally exhausted", "Frustrated"]},
    "act-48": {"mood_range": [1, 3], "stress_range": [4, 8],  "topics": ["work", "study", "sleep"],                       "emotions": ["Stress", "Overwhelmed", "Frustrated"]},
    "act-49": {"mood_range": [1, 3], "stress_range": [2, 7],  "topics": ["family", "relationship", "loneliness"],         "emotions": ["Lonely", "Sad", "Angry"]},
    "act-50": {"mood_range": [1, 3], "stress_range": [2, 6],  "topics": ["loneliness", "family", "friends"],              "emotions": ["Lonely", "Sad", "Overwhelmed"]},
    "act-51": {"mood_range": [3, 5], "stress_range": [0, 5],  "topics": ["exercise", "friends", "family"],                "emotions": ["Happy", "Excited", "Motivated", "Grateful"]},
}

ACTIVITIES = [
    {
        "id": "act-1", "title": "Box Breathing", "category": "Breathing", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "A classic box breathing technique to reduce immediately felt stress and recenter thoughts.",
        "purpose": "Slow down heart rate and lower cortisol.",
        "moods": "Anxious, Stressed, Overwhelmed", "conditions": "Generalized Anxiety Disorder (GAD), Panic Disorder",
        "benefits": "Downregulates sympathetic arousal and improves focus.",
        "precautions": "Individuals with severe respiratory conditions (COPD) should breathe at their own pace.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Equal-ratio paced breathing with brief breath retention stimulates the vagus nerve.", "evidence": "Level 1b",
        "instructions": [
            "Find a comfortable seated position with your back straight.",
            "Inhale slowly through your nose for a count of 4 seconds.",
            "Hold your breath for a count of 4 seconds.",
            "Exhale slowly and smoothly through your mouth for 4 seconds.",
            "Hold your lungs empty for a count of 4 seconds.",
            "Repeat this cycle for 5 minutes."
        ]
    },
    {
        "id": "act-2", "title": "4-7-8 Breathing", "category": "Breathing", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "A deep relaxation breathing pattern to calm a hyperactive nervous system and aid sleep.",
        "purpose": "Reduce anxiety, aid sleep onset, and stimulate parasympathetic pathway.",
        "moods": "Anxious, Restless, Panicked", "conditions": "Insomnia, Anxiety Disorders",
        "benefits": "Calms racing thoughts and lowers immediate muscle tension.",
        "precautions": "May cause minor lightheadedness initially. Do not practice while driving.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Extended exhalation relative to inhalation triggers parasympathetic dominance.", "evidence": "Level 2",
        "instructions": [
            "Exhale completely through your mouth with a whoosh sound.",
            "Close your mouth and inhale quietly through your nose for 4 seconds.",
            "Hold your breath for a count of 7 seconds.",
            "Exhale completely through mouth for 8 seconds.",
            "Repeat the cycle 4 times."
        ]
    },
    {
        "id": "act-3", "title": "Alternate Nostril Breathing", "category": "Breathing", "duration": "8 min", "difficulty": "Intermediate",
        "short_desc": "A traditional breath control practice to balance hemispheric brain activity and ease stress.",
        "purpose": "Autonomic nervous system regulation and mental balancing.",
        "moods": "Unbalanced, Distracted, Stressed", "conditions": "Generalized Anxiety Disorder (GAD)",
        "benefits": "Improves cognitive performance, balances blood pressure, and lowers heart rate.",
        "precautions": "Avoid if you have a nasal blockage or cold.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Unilateral nostril breathing alternates stimulation of contralateral cerebral hemispheres.", "evidence": "Level 1b",
        "instructions": [
            "Sit comfortably and close your right nostril with your right thumb.",
            "Inhale slowly through your left nostril.",
            "Close your left nostril with your ring finger, open and exhale through the right.",
            "Inhale through the right, close it, and exhale through the left.",
            "Repeat this cycle slowly for 8 minutes."
        ]
    },
    {
        "id": "act-4", "title": "Physiological Sigh", "category": "Breathing", "duration": "2 min", "difficulty": "Beginner",
        "short_desc": "The fastest physiological way to reduce autonomic arousal in real-time.",
        "purpose": "Rapid heart rate reduction and carbon dioxide offload.",
        "moods": "Panicked, Stressed, Frustrated", "conditions": "Acute Stress, Panic Attacks",
        "benefits": "Nearly instantaneous reduction in physical tension and heart rate.",
        "precautions": "None.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Double inhalation inflates collapsed alveoli, and the long exhalation offloads excess CO2, slowing the heart.", "evidence": "Level 1b",
        "instructions": [
            "Take a deep, full inhalation through your nose.",
            "Immediately take a second, quick sniff/inhalation to fully fill your lungs.",
            "Slowly and fully exhale all the air through your mouth.",
            "Repeat this sequence 4 to 5 times."
        ]
    },
    {
        "id": "act-5", "title": "Body Scan Meditation", "category": "Meditation", "duration": "15 min", "difficulty": "Beginner",
        "short_desc": "A foundational MBSR technique to cultivate somatic mindfulness and release chronic muscle holding.",
        "purpose": "Increase somatic awareness and decrease chronic physical tension.",
        "moods": "Tense, Distracted, Exhausted", "conditions": "Chronic Pain, Somatoform Disorders, MDD",
        "benefits": "Reconnects mind-body awareness, reduces physical pain perception, and improves sleep.",
        "precautions": "Individuals with severe physical trauma should focus only on comfortable body parts.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Yoga mat or bed",
        "rationale": "Systematic shifting of attention trains executive control networks and dampens somatic pain amplification.", "evidence": "Level 1a",
        "instructions": [
            "Lie down comfortably on your back with eyes closed.",
            "Take three deep breaths, allowing your body to sink into the floor.",
            "Bring attention to your toes on the left foot, noticing any sensations.",
            "Slowly move attention up your leg, torso, arms, neck, and face.",
            "Observe sensations without judgment or trying to change them."
        ]
    },
    {
        "id": "act-6", "title": "Loving-Kindness Meditation", "category": "Meditation", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "A meditation focusing on developing compassionate love and warm feelings toward oneself and others.",
        "purpose": "Mitigate self-criticism, increase social connectedness, and reduce social anxiety.",
        "moods": "Lonely, Angry, Self-Critical", "conditions": "Depression, Social Anxiety Disorder (SAD)",
        "benefits": "Increases positive emotions, reduces isolation, and decreases negative self-talk.",
        "precautions": "If directing feelings toward others triggers grief, redirect the focus back to self-compassion.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Repeated mental pairing of self/others with warm intentions activates brain regions linked to social bonding.", "evidence": "Level 1b",
        "instructions": [
            "Sit comfortably, close your eyes, and take a few relaxing breaths.",
            "Visualize yourself and repeat silently: 'May I be happy. May I be healthy. May I be safe. May I live with ease.'",
            "Visualize a family member or friend and repeat the phrases for them.",
            "Visualize a neutral person, then a difficult person, wishing them wellness.",
            "Finally, extend these feelings to all living beings everywhere."
        ]
    },
    {
        "id": "act-7", "title": "MBSR Sitting Meditation", "category": "Meditation", "duration": "20 min", "difficulty": "Intermediate",
        "short_desc": "A formal mindfulness meditation focusing on breath, bodily sensations, and cognitive non-attachment.",
        "purpose": "Develop mindfulness capacity and cognitive flexibility.",
        "moods": "Stressed, Restless, Scattered", "conditions": "Major Depressive Disorder (MDD), Chronic Stress",
        "benefits": "Decreases psychological distress, reduces rumination, and improves working memory.",
        "precautions": "Sit on a chair if floor posture causes knee/back pain.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Meditation cushion or chair",
        "rationale": "Mindfulness meditation downregulates default mode network activity, associated with rumination.", "evidence": "Level 1a",
        "instructions": [
            "Sit upright on a cushion or chair with hands resting on thighs.",
            "Direct your attention to the physical sensation of the breath at the nose or abdomen.",
            "When a thought, emotion, or sensation arises, acknowledge it and gently return to the breath.",
            "Stay present with the rise and fall of the breath without controlling it."
        ]
    },
    {
        "id": "act-8", "title": "Zen Counting Meditation", "category": "Meditation", "duration": "10 min", "difficulty": "Intermediate",
        "short_desc": "A Zen training technique of counting breaths to build sustained attention and stabilize the mind.",
        "purpose": "Enhance cognitive control and attention metrics.",
        "moods": "Distracted, Confused, Impassive", "conditions": "Attention Deficit Hyperactivity Disorder (ADHD), Stress",
        "benefits": "Strengthens concentration, reduces distractibility, and grounds focus.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Counting acts as an explicit cognitive feedback loop to detect attention shifts.", "evidence": "Level 2",
        "instructions": [
            "Sit in a comfortable posture with eyes slightly open, cast downward.",
            "Focus on the natural flow of your breath.",
            "Count 'one' on the first exhalation, 'two' on the next, up to 'ten'.",
            "If you lose count or go past ten, return to 'one' and start again.",
            "Practice this focus for 10 minutes."
        ]
    },
    {
        "id": "act-9", "title": "Mindful Eating", "category": "Mindfulness", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "A sensory immersion practice using food to train present-moment awareness and change reactivity.",
        "purpose": "Slow down eating pace, reduce binge behaviors, and cultivate presence.",
        "moods": "Hurried, Numb, Detached", "conditions": "Binge Eating Disorder (BED), Bulimia Nervosa",
        "benefits": "Increases sensory satisfaction, reduces emotional eating.",
        "precautions": "Use a non-triggering food if you suffer from severe restrictive eating disorders.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "A small piece of food (e.g., raisin, grape, nut)",
        "rationale": "Slowing down and using all five senses engages prefrontal executive networks over habits.", "evidence": "Level 2",
        "instructions": [
            "Hold the piece of food in your hand. Examine its texture, shape, and color.",
            "Smell the food, noting how your body responds (salivation, anticipation).",
            "Place the food in your mouth, notice its texture on your tongue without chewing.",
            "Chew slowly, concentrating on the release of flavor and sound.",
            "Swallow consciously and feel it travel down to your stomach."
        ]
    },
    {
        "id": "act-10", "title": "Mindful Walking", "category": "Mindfulness", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "A walking practice focusing fully on the sensations of movement and foot contact.",
        "purpose": "Anxiety reduction, kinetic somatic grounding.",
        "moods": "Agitated, Anxious, Lethargic", "conditions": "Generalized Anxiety Disorder, Moderate Depression",
        "benefits": "Reduces somatic stress markers, improves balance, and connects body with space.",
        "precautions": "Walk on a flat, clutter-free surface; maintain spatial awareness.",
        "setting": "Both", "format_type": "Individual", "equipment": "Comfortable shoes (optional)",
        "rationale": "Focusing on gait feedback overrides intellectualizing and cyclic negative thinking.", "evidence": "Level 1b",
        "instructions": [
            "Find a straight path of 10-15 paces indoors or outdoors.",
            "Walk slowly, paying attention to the lifting, shifting, and placing of your feet.",
            "Observe your body weight transfer from heel to toe.",
            "Turn slowly and walk back, focusing on the movement coordination.",
            "Keep eyes open and soft, scanning the environment gently without focusing on detail."
        ]
    },
    {
        "id": "act-11", "title": "Leaves on a Stream", "category": "Mindfulness", "duration": "8 min", "difficulty": "Beginner",
        "short_desc": "An Acceptance & Commitment Therapy defusion exercise to visualize letting go of intrusive thoughts.",
        "purpose": "Cultivate cognitive defusion, stop struggle with thoughts.",
        "moods": "Overthinking, Anxious, Obsessive", "conditions": "Obsessive-Compulsive Disorder (OCD), Generalized Anxiety",
        "benefits": "Reduces cognitive fusion, increases tolerance of uncomfortable thoughts.",
        "precautions": "Avoid if visualization triggers dissociation or strong traumatic flashbacks.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Externalizing thoughts as objects helps users realize they are observers of thoughts, not thoughts themselves.", "evidence": "Level 1a",
        "instructions": [
            "Close your eyes and visualize a gently flowing stream in a forest.",
            "Imagine leaves falling from trees and floating down the stream.",
            "Whenever a thought arises, place it on a leaf.",
            "Watch the leaf float down the stream until it disappears from view.",
            "If your mind wanders, label it 'mind wandering' and return to the stream."
        ]
    },
    {
        "id": "act-12", "title": "The 3-Minute Breathing Space", "category": "Mindfulness", "duration": "3 min", "difficulty": "Beginner",
        "short_desc": "A rapid, three-step mindfulness check-in for transitions or high-stress moments.",
        "purpose": "Halt automatic stress reactions and reset cognitive perspectives.",
        "moods": "Stressed, Overwhelmed, Busy", "conditions": "Major Depressive Disorder, Anxiety",
        "benefits": "Enables fast stress recovery and shifts the brain into a responsive state.",
        "precautions": "None.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "An hourglass attention structure (broad to narrow to broad) resets cognitive load.", "evidence": "Level 1a",
        "instructions": [
            "First minute: Ask 'What is my experience right now?' (thoughts, feelings, sensations).",
            "Second minute: Gather attention to the breath, focusing on physical sensations.",
            "Third minute: Expand awareness to the whole body, your posture, and facial expression."
        ]
    },
    {
        "id": "act-13", "title": "Cognitive Shuffle", "category": "Sleep Hygiene", "duration": "15 min", "difficulty": "Beginner",
        "short_desc": "A mental scramble game designed to trigger natural sleep onset by mimicking pre-sleep dream fragments.",
        "purpose": "Interrupt wake-maintaining analytical thoughts before sleep.",
        "moods": "Restless, Overactive, Tired", "conditions": "Primary Insomnia, Performance Anxiety",
        "benefits": "Speeds up sleep onset, reduces rumination, and signals safety to the brain.",
        "precautions": "Use only in bed when intending to fall asleep.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "The brain checks for coherent thinking before allowing sleep. Scrambled thoughts trigger sleep mechanisms.", "evidence": "Level 3",
        "instructions": [
            "Lie down in bed ready for sleep.",
            "Choose a simple 4- or 5-letter word (e.g., 'CALM').",
            "Take the first letter 'C' and think of words starting with 'C' (e.g., Cat, Car, Cup).",
            "Visualize each word for a few seconds. Do this until you run out of words.",
            "Move to the next letter 'A' and repeat. Continue through the word."
        ]
    },
    {
        "id": "act-14", "title": "Sleep Worry Dump", "category": "Sleep Hygiene", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "A bedtime journaling intervention to offload worries onto paper before turning off the lights.",
        "purpose": "Reduce nighttime cognitive arousal and sleep-related anxiety.",
        "moods": "Anxious, Overthinking, Restless", "conditions": "Sleep-Onset Insomnia, Generalized Anxiety",
        "benefits": "Speeds up sleep onset compared to typical evening journaling.",
        "precautions": "Keep worry dumping brief (under 10 mins). Do not analyze; just export.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Pen and paper or journal",
        "rationale": "Offloading tasks and worries onto physical paper reduces working memory load and cognitive arousal.", "evidence": "Level 1b",
        "instructions": [
            "About 20-30 minutes before sleep, sit with a notepad.",
            "List out everything you need to do tomorrow or are currently worrying about.",
            "Be as specific as possible (e.g., 'email Sarah about the budget').",
            "Close the notepad and tell yourself: 'It is written down. I can deal with it tomorrow.'",
            "Go to bed immediately after."
        ]
    },
    {
        "id": "act-15", "title": "10-3-2-1-0 Sleep Protocol", "category": "Sleep Hygiene", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "A set of behavioral deadlines to optimize sleep hygiene throughout the day.",
        "purpose": "Address environmental and physiological disruptors of sleep.",
        "moods": "Fatigued, Groggy, Sleepless", "conditions": "Circadian Rhythm Sleep Disorders, Daytime Fatigue",
        "benefits": "Improves deep sleep architecture and reduces night-waking.",
        "precautions": "Adjust caffeine window if you are highly sensitive/fast metabolizer.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Creates circadian entrainment and prevents metabolic/stimulatory sleep fragmentation.", "evidence": "Level 4",
        "instructions": [
            "10 hours before bed: Stop consuming caffeine.",
            "3 hours before bed: Stop eating heavy meals or drinking alcohol.",
            "2 hours before bed: Stop working or engaging in high-stress thinking.",
            "1 hour before bed: Turn off all electronic screens.",
            "Morning: Do not hit the snooze button."
        ]
    },
    {
        "id": "act-16", "title": "PMR for Sleep", "category": "Sleep Hygiene", "duration": "15 min", "difficulty": "Beginner",
        "short_desc": "A somatic relaxation sequence that tenses and releases muscles to induce deep sleep.",
        "purpose": "Reduce physical somatic tension and induce the relaxation response.",
        "moods": "Restless, Physically Tense, Stressed", "conditions": "Secondary Insomnia, Muscle Tension Headache",
        "benefits": "Lowers heart rate, decreases systolic blood pressure, and accelerates sleep onset.",
        "precautions": "Do not tense areas with acute physical injuries or spasms.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "A comfortable bed",
        "rationale": "Consciously tensing muscles before release enhances the contrast, allowing for a deeper somatic rest.", "evidence": "Level 1a",
        "instructions": [
            "Lie flat in bed, close your eyes, and take three deep breaths.",
            "Inhale and tense your toe muscles tightly for 5 seconds.",
            "Exhale and completely release the tension, feeling the muscles relax.",
            "Progressively move up your body tensing and releasing.",
            "Enjoy the feeling of heaviness and drift to sleep."
        ]
    },
    {
        "id": "act-17", "title": "Three Good Things", "category": "Gratitude", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "An evidence-based positive psychology exercise to shift cognitive attention to positive daily events.",
        "purpose": "Counteract negativity bias and improve mood baseline.",
        "moods": "Depressed, Pessimistic, Sad", "conditions": "Mild to Moderate Depression, Chronic Pessimism",
        "benefits": "Long-term increases in happiness levels and decrease in depressive symptoms.",
        "precautions": "Can be difficult on highly stressful days; focus on tiny victories.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Journal or notepad",
        "rationale": "Repeatedly scanning the environment for positive events strengthens positive cognitive filters.", "evidence": "Level 1b",
        "instructions": [
            "Every evening, write down three things that went well today.",
            "Next to each item, write why it went well.",
            "Reflect on these three positive events for a few minutes.",
            "Do this consistently for at least one week."
        ]
    },
    {
        "id": "act-18", "title": "Gratitude Letter Writing", "category": "Gratitude", "duration": "20 min", "difficulty": "Intermediate",
        "short_desc": "Write a letter to someone you are grateful to, expressing your sincere appreciation.",
        "purpose": "Build social connectedness and elevate relational satisfaction.",
        "moods": "Lonely, Distant, Demotivated", "conditions": "Social Isolation, Depression",
        "benefits": "Increases positive emotions that persist for weeks; strengthens relationship bonds.",
        "precautions": "You do not have to deliver it if you feel social anxiety; writing it still has benefit.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Paper and pen",
        "rationale": "Concretizing gratitude through written narrative activates reward neurocircuitry.", "evidence": "Level 1b",
        "instructions": [
            "Choose a person who has made a positive impact on your life but whom you haven't properly thanked.",
            "Write a detailed letter explaining what they did and how it affected you.",
            "Describe your current life situation and thank them clearly.",
            "Read the letter over. Deliver or mail it if you choose."
        ]
    },
    {
        "id": "act-19", "title": "Gratitude Jar Reflection", "category": "Gratitude", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "A visual tool to record and collect moments of gratitude over time, providing a tangible resource during low periods.",
        "purpose": "Form positive reference points to combat hopelessness.",
        "moods": "Hopeless, Forgetful, Sad", "conditions": "Depressive Disorders, Adjustment Disorder",
        "benefits": "Creates a physical visual cue of positive events; builds resilience.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "A jar, slips of paper, pen",
        "rationale": "Externalizing and storing positive memories provides a concrete counter-narrative to depressive schemas.", "evidence": "Level 4",
        "instructions": [
            "Write down one positive event or interaction on a slip of paper.",
            "Fold the slip and drop it into the jar.",
            "Repeat this daily or whenever a positive event occurs.",
            "During a difficult day, open the jar and read several slips."
        ]
    },
    {
        "id": "act-20", "title": "Mental Subtraction of Positive Events", "category": "Gratitude", "duration": "10 min", "difficulty": "Intermediate",
        "short_desc": "Improve life satisfaction by imagining what life would be like if positive events had not occurred.",
        "purpose": "Counteract habituation (taking positive circumstances for granted).",
        "moods": "Bored, Discontent, Apathetic", "conditions": "Pessimistic cognitive states",
        "benefits": "Increases joy, lowers expectations/entitlement, and improves contentment.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Reflective writing tools",
        "rationale": "Contrast thinking counteracts standard adaptation to positive events.", "evidence": "Level 1b",
        "instructions": [
            "Select a positive event from your life (e.g., meeting your partner).",
            "Imagine how your life would have developed if this had NOT happened.",
            "Write down the negative or less fulfilling pathways you might have taken.",
            "Redirect your focus back to reality, acknowledging the value of the event."
        ]
    },
    {
        "id": "act-21", "title": "CBT Thought Record", "category": "Journaling", "duration": "15 min", "difficulty": "Intermediate",
        "short_desc": "A structure to identify, challenge, and replace negative automatic thoughts with balanced alternatives.",
        "purpose": "Identify cognitive distortions and restructure maladaptive core beliefs.",
        "moods": "Self-Critical, Angry, Frustrated", "conditions": "Major Depressive Disorder, Generalized Anxiety",
        "benefits": "Reduces intensity of negative emotions; increases cognitive adaptability.",
        "precautions": "Not recommended during acute panic; best practiced once the panic subsides.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Pen/Paper",
        "rationale": "Structured cognitive restructuring activates the prefrontal cortex to downregulate amygdala threat appraisal.", "evidence": "Level 1a",
        "instructions": [
            "Write the Situation and your Emotion (1-100%).",
            "Identify the Automatic Thought that triggered the emotion.",
            "List evidence supporting the thought.",
            "List evidence contradicting the thought.",
            "Write a realistic, balanced alternative thought and re-rate your emotion."
        ]
    },
    {
        "id": "act-22", "title": "Expressive Writing", "category": "Journaling", "duration": "20 min", "difficulty": "Advanced",
        "short_desc": "A highly researched protocol to write about your deepest emotions regarding stressful or traumatic experiences.",
        "purpose": "Facilitate emotional processing of difficult memories.",
        "moods": "Heavy, Grieved, Unresolved", "conditions": "Post-Traumatic Stress Disorder (PTSD), Adjustment Disorder",
        "benefits": "Enhances immune system function and improves emotional integration.",
        "precautions": "Can trigger intense sadness during writing. Ensure you have a safe space.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Journal/Pad",
        "rationale": "Concretizing trauma in narrative form aids cognitive organization and facilitates emotional habituation.", "evidence": "Level 1a",
        "instructions": [
            "Set a timer for 20 minutes.",
            "Write continuously about your deepest emotions regarding a life stressor.",
            "Do not worry about spelling or grammar; just keep writing.",
            "Repeat this exercise for 4 consecutive days."
        ]
    },
    {
        "id": "act-23", "title": "Values-Clarification Journaling", "category": "Journaling", "duration": "15 min", "difficulty": "Intermediate",
        "short_desc": "Identify your top core values and document how your current behaviors align with them.",
        "purpose": "Clarify values to drive behavioral activation and reduce existential distress.",
        "moods": "Lost, Stuck, Demotivated", "conditions": "Depression, Identity Crisis",
        "benefits": "Increases sense of meaning, directs positive life choices, and reduces apathy.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Writing instrument",
        "rationale": "Connecting behaviors to valued directions enhances intrinsic motivation and behavioral activation.", "evidence": "Level 1b",
        "instructions": [
            "Select three core values (e.g., integrity, connection, growth).",
            "Write about why each value is important to you.",
            "Assess your activities from the past week for alignment.",
            "List one small action you can take tomorrow that supports one value."
        ]
    },
    {
        "id": "act-24", "title": "Future Self-Authoring", "category": "Journaling", "duration": "20 min", "difficulty": "Advanced",
        "short_desc": "Formulate a clear narrative of your goals and ideal future to increase self-efficacy.",
        "purpose": "Build future motivation, reduce procrastinating behaviors, and resolve aimlessness.",
        "moods": "Aimless, Impatient, Indecisive", "conditions": "Sub-clinical depression, Executive dysfunction",
        "benefits": "Improves performance and increases life focus.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Notebook/Computer",
        "rationale": "Creating a narrative representation of goals provides a cognitive blueprint, reducing uncertainty.", "evidence": "Level 1b",
        "instructions": [
            "Write about what you want your life to look like in 3 years.",
            "Write about a future you want to avoid (what your life looks like if you give in to bad habits).",
            "Define three concrete steps to work towards your positive vision.",
            "Read this narrative weekly."
        ]
    },
    {
        "id": "act-25", "title": "Vagus Nerve Hatha Yoga", "category": "Physical Activity", "duration": "15 min", "difficulty": "Beginner",
        "short_desc": "A series of slow, restorative yoga postures designed to stimulate the vagus nerve and promote calm.",
        "purpose": "Release somatic tension and increase parasympathetic vagal tone.",
        "moods": "Restless, Physically Stiff, Anxious", "conditions": "Mild Depression, Generalized Anxiety",
        "benefits": "Increases thalamic GABA levels and reduces heart rate.",
        "precautions": "Avoid poses that cause physical pain; adapt for joint injuries.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Yoga mat (optional)",
        "rationale": "Gentle stretching and abdominal compressions stimulate baroreceptors, increasing vagus nerve activation.", "evidence": "Level 1b",
        "instructions": [
            "Start in Child's Pose, breathing deeply into your lower back for 2 minutes.",
            "Move to a Cat-Cow flow, coordinating movement with breathing (10 repeats).",
            "Lie on your back and hug your knees to your chest.",
            "End in Savasana focusing on complete physical surrender."
        ]
    },
    {
        "id": "act-26", "title": "Brisk Mindful Walk", "category": "Physical Activity", "duration": "20 min", "difficulty": "Beginner",
        "short_desc": "An outdoor brisk walk combined with active sensory observation of your surroundings.",
        "purpose": "Engage behavioral activation and elevate endorphins.",
        "moods": "Depressed, Low Energy, Sluggish", "conditions": "Major Depressive Disorder, Sedentary Lifestyle",
        "benefits": "Improves cardiovascular circulation, lifts mood, and interrupts depressive rumination.",
        "precautions": "Check weather conditions and prioritize safety.",
        "setting": "Outdoor", "format_type": "Individual", "equipment": "Walking shoes",
        "rationale": "Bi-directional eye movements during walking and aerobic stimulation reduce amygdala overactivity.", "evidence": "Level 1a",
        "instructions": [
            "Plan a route in a park or safe neighborhood.",
            "Walk at a brisk pace that raises your heart rate slightly.",
            "While walking, actively observe the scenery (colors, sounds, wind).",
            "Bring focus back to your step rhythm if your mind wanders."
        ]
    },
    {
        "id": "act-27", "title": "Isometric Muscle Release", "category": "Physical Activity", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "A sequence of locking and releasing muscle groups to expel adrenaline during moments of high stress.",
        "purpose": "Quick somatic discharge of anxiety-induced arousal.",
        "moods": "Panicked, Restless, Angry", "conditions": "Acute Panic, Anger management issues",
        "benefits": "Replaces flight/fight motor patterns, lowers arterial stiffness, and promotes physical release.",
        "precautions": "Do not hold breath during contractions; breathe continuously.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Controlled muscle contraction followed by deliberate release creates a somatic reset of neural arousal.", "evidence": "Level 2",
        "instructions": [
            "Sit or stand up straight.",
            "Clasp your hands in front of your chest and push them together for 10 seconds.",
            "Release and breathe out slowly, noticing the change in sensation.",
            "Push your feet firmly into the floor for 10 seconds and release.",
            "Shrug shoulders towards ears for 10 seconds and release."
        ]
    },
    {
        "id": "act-28", "title": "Qi Gong Flow", "category": "Physical Activity", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "Gentle coordinated movements and slow breathing to release energy blockages and stress.",
        "purpose": "Provide a low-impact kinetic meditation to lower stress hormones.",
        "moods": "Tense, Fatigued, Scattered", "conditions": "Fibromyalgia, Anxiety, Occupational Stress",
        "benefits": "Reduces salivary cortisol levels and improves systemic balance.",
        "precautions": "None.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Rhythmic movement combined with paced breathing downregulates HPA axis activity.", "evidence": "Level 1a",
        "instructions": [
            "Stand with feet shoulder-width apart, knees slightly bent.",
            "Inhale, raising arms slowly to chest level with palms facing down.",
            "Exhale, lowering arms back down.",
            "Repeat this 'raising the water' flow slowly for 3 minutes.",
            "Continue with gentle side-to-side arm swings to release the spine."
        ]
    },
    {
        "id": "act-29", "title": "Autogenic Training", "category": "Relaxation", "duration": "15 min", "difficulty": "Intermediate",
        "short_desc": "A deep relaxation practice using auto-suggestion formulas focusing on body heaviness and warmth.",
        "purpose": "Induce deep relaxation response through cognitive autosuggestion.",
        "moods": "Overworked, Tired, Anxious", "conditions": "Essential Hypertension, Migraines, Chronic Stress",
        "benefits": "Significant reduction in physiological stress indicators; improves autonomic balance.",
        "precautions": "Not recommended for persons with severe heart conditions or active psychosis.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Quiet room, bed/reclining chair",
        "rationale": "Autosuggestion sets up a biofeedback loop that alters blood flow and muscle relaxation.", "evidence": "Level 1a",
        "instructions": [
            "Lie down in a quiet room, close your eyes.",
            "Silently repeat: 'My right arm is heavy' (repeat 6 times), 'I am completely calm.'",
            "Silently repeat: 'My right arm is warm' (repeat 6 times), 'I am completely calm.'",
            "Progress to: 'My heartbeat is calm and regular', then 'My breathing is calm.'",
            "End by taking a deep breath and opening your eyes."
        ]
    },
    {
        "id": "act-30", "title": "Guided Forest Imagery", "category": "Relaxation", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "A mental simulation of a peaceful forest walk to reduce systemic cortisol.",
        "purpose": "Provide a cognitive escape to decrease emotional and physical stress.",
        "moods": "Stressed, Burned Out, Impatient", "conditions": "Stress-Related Disorders, Pre-procedural Anxiety",
        "benefits": "Lowers heart rate and salivary cortisol levels.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "The brain processes mental imagery using similar neural pathways as real perception, inducing similar calming states.", "evidence": "Level 1b",
        "instructions": [
            "Sit or lie down in a quiet location with eyes closed.",
            "Visualize walking along a pathway into a green, lush forest.",
            "Hear the leaves rustle underfoot and see sunlight filtering through branches.",
            "Imagine the scent of pine and fresh soil, taking slow breaths.",
            "Explore this forest space for 10 minutes before slowly opening your eyes."
        ]
    },
    {
        "id": "act-31", "title": "Progressive Muscle Relaxation", "category": "Relaxation", "duration": "20 min", "difficulty": "Intermediate",
        "short_desc": "An extended physical relaxation technique tensing and releasing all major muscle groups.",
        "purpose": "Somatic release of chronic muscle tension and anxiety management.",
        "moods": "Stressed, Physically Exhausted, Anxious", "conditions": "Generalized Anxiety Disorder, Tension Headaches",
        "benefits": "Lowers heart rate, reduces muscle spasms, and improves somatic control.",
        "precautions": "Do not tense injured muscles.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Comfortable chair or mat",
        "rationale": "Contrast biofeedback teaches the central nervous system to detect and actively release micro-tensions.", "evidence": "Level 1a",
        "instructions": [
            "Find a quiet space, sit or lie down.",
            "Tense your face muscles for 7 seconds, then release for 15 seconds.",
            "Repeat with your neck, shoulders, arms, hands, abdomen, thighs, and feet.",
            "Focus on the physical sensation of relaxation as you release each muscle group."
        ]
    },
    {
        "id": "act-32", "title": "Ice Cube Sensory Reset", "category": "Grounding", "duration": "3 min", "difficulty": "Beginner",
        "short_desc": "Hold a piece of ice in your hand to halt high-distress loops and panic. A classic DBT skill.",
        "purpose": "Avert active self-harm urges, panic, or severe emotional dissociation.",
        "moods": "Panicked, Dissociated, Highly Distressed", "conditions": "Borderline Personality Disorder (BPD), Panic Disorder",
        "benefits": "Interrupts intense negative cognitive feedback loops immediately.",
        "precautions": "Do not hold the ice long enough to damage the skin (limit to a few minutes).",
        "setting": "Indoor", "format_type": "Individual", "equipment": "One or two ice cubes",
        "rationale": "Intense tactile/temperature input triggers a survival parasympathetic reflex, drawing cognitive energy away from panic.", "evidence": "Level 1a",
        "instructions": [
            "Go to the freezer and retrieve an ice cube.",
            "Place it in your bare hand, squeezing it slightly.",
            "Focus your entire attention on the coldness and melting water.",
            "If the cold becomes too intense, transfer it to the other hand. Continue until you feel grounded."
        ]
    },
    {
        "id": "act-33", "title": "5-4-3-2-1 Grounding", "category": "Grounding", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "Point out objects from each of your senses to anchor yourself in the present moment.",
        "purpose": "Ground attention out of cognitive threat loops into safety of local environment.",
        "moods": "Panicked, Anxious, Disconnected", "conditions": "Panic Attacks, Post-Traumatic Flashbacks",
        "benefits": "Rapidly reduces acute anxiety and stops derealization.",
        "precautions": "None.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Forcing sensory identification engages external perception systems, inhibiting worry loops.", "evidence": "Level 4",
        "instructions": [
            "Take a slow breath and look around you.",
            "Identify 5 things you can see.",
            "Identify 4 things you can physically feel.",
            "Identify 3 things you can hear.",
            "Identify 2 things you can smell.",
            "Identify 1 thing you can taste."
        ]
    },
    {
        "id": "act-34", "title": "Feet on Floor Grounding", "category": "Grounding", "duration": "3 min", "difficulty": "Beginner",
        "short_desc": "A quick physical centering exercise to re-establish spatial connection during anxiety spikes.",
        "purpose": "Ground physical posture and address hyperventilation.",
        "moods": "Anxious, Dizzy, Unsettled", "conditions": "Post-Traumatic Stress Disorder (PTSD), GAD",
        "benefits": "Instantly reduces physical balance insecurity and regulates rapid breathing.",
        "precautions": "If barefoot is not possible due to cold, perform with shoes on.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Conscious stimulation of plantar sensory receptors increases somatic safety appraisal.", "evidence": "Level 4",
        "instructions": [
            "Sit upright in a chair with both feet flat on the floor.",
            "Remove your shoes if possible to feel the ground texture.",
            "Press your heels, arches, and toes firmly down into the floor.",
            "Focus on the support of the earth holding you up. Breathe slowly for 3 minutes."
        ]
    },
    {
        "id": "act-35", "title": "Eisenhower Matrix", "category": "Stress Management", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "Sort your tasks into four quadrants based on urgency and importance to reduce overwhelm.",
        "purpose": "Reduce cognitive load and occupational self-efficacy distress.",
        "moods": "Overwhelmed, Stressed, Disorganized", "conditions": "Occupational burnout, ADHD management",
        "benefits": "Increases task control, lowers procrastination anxiety, and clarifies daily goals.",
        "precautions": "Be careful not to overcomplicate the list; limit total tasks to 12.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Paper and pen or checklist tool",
        "rationale": "Externalizing tasks and filtering them through importance metrics overrides executive overwhelm.", "evidence": "Level 4",
        "instructions": [
            "Draw a 2x2 grid. Label columns 'Urgent' & 'Not Urgent', rows 'Important' & 'Not Important'.",
            "Write tasks: 1) Urgent & Important, 2) Not Urgent & Important, 3) Urgent & Not Important, 4) Not Urgent & Not Important.",
            "Address items in quadrant 1 immediately."
        ]
    },
    {
        "id": "act-36", "title": "Circle of Control Mapping", "category": "Stress Management", "duration": "15 min", "difficulty": "Beginner",
        "short_desc": "A visual exercise to separate things you can control from things you cannot, reducing anxious catastrophizing.",
        "purpose": "Tackle external locus of control stress and helplessness cycles.",
        "moods": "Helpless, Overthinking, Stressed", "conditions": "Generalized Anxiety Disorder, Life Changes",
        "benefits": "Reduces anxiety about external events; increases personal agency.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Paper and pen",
        "rationale": "Defining action boundaries limits mental processing of uncontrollable external stimuli.", "evidence": "Level 2",
        "instructions": [
            "Draw a large circle with a smaller circle inside.",
            "Write down worries you cannot directly control in the outer circle.",
            "Write down action steps you can control in the inner circle.",
            "Focus your energy solely on executing the inner circle list."
        ]
    },
    {
        "id": "act-37", "title": "Somatic Shakeout", "category": "Stress Management", "duration": "3 min", "difficulty": "Beginner",
        "short_desc": "Shake your limbs vigorously to release stored adrenaline and stress hormones.",
        "purpose": "Somatic release of locked fight/flight energy.",
        "moods": "Agitated, Tense, Anxious", "conditions": "Acute Stress, Trauma recovery",
        "benefits": "Lowers immediate cortisol charge and releases rigid muscles.",
        "precautions": "Exercise care if you have joint hypermobility or balance issues.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Mimics structural mammalian shaking reflexes that discharge motor activation after stress.", "evidence": "Level 3",
        "instructions": [
            "Stand with feet apart in a comfortable space.",
            "Gently shake your right hand, then forearm, then full arm, letting it go floppy.",
            "Repeat with the left arm.",
            "Shake out your right leg, then the left leg.",
            "Finish by shaking your whole body, bouncing slightly on your heels for 1 minute."
        ]
    },
    {
        "id": "act-38", "title": "Paced Respiration (6 BPM)", "category": "Stress Management", "duration": "10 min", "difficulty": "Intermediate",
        "short_desc": "Breathe exactly 6 times a minute to maximize heart rate variability and calm your system.",
        "purpose": "Increase HRV and optimize cardiorespiratory resonance.",
        "moods": "Stressed, Tense, Irritable", "conditions": "Hypertension, GAD, Autonomic Dysregulation",
        "benefits": "Improves heart-rate variability, lowers blood pressure, and calms hyper-arousal.",
        "precautions": "Do not hold breath. Maintain a steady, smooth flow.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Pacing clock or breathing app",
        "rationale": "Resonant breathing aligns baroreflex activation with respiration, optimizing cardiovascular autonomic tone.", "evidence": "Level 1b",
        "instructions": [
            "Sit comfortably with feet flat.",
            "Inhale smoothly through your nose for 5 seconds.",
            "Exhale gently through your mouth/nose for 5 seconds.",
            "Repeat this count for 10 minutes."
        ]
    },
    {
        "id": "act-39", "title": "Worry Time", "category": "Anxiety Relief", "duration": "15 min", "difficulty": "Intermediate",
        "short_desc": "Designate a specific, limited window of time each day to worry, keeping the rest of your day worry-free.",
        "purpose": "Stimulus control therapy to contain worry behaviors.",
        "moods": "Anxious, Persistent Overthinking, Worried", "conditions": "Generalized Anxiety Disorder, Rumination Issues",
        "benefits": "Significantly decreases daily worry and increases control over thoughts.",
        "precautions": "Do not schedule Worry Time right before bedtime.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Clock/Timer",
        "rationale": "By separating worry from daily triggers, the automatic habit of worrying is broken.", "evidence": "Level 1b",
        "instructions": [
            "Set a daily 15-minute slot (e.g., 4:30 PM to 4:45 PM) as your 'Worry Time'.",
            "If a worry arises during the day, write it down and tell yourself: 'I will handle this at 4:30 PM'.",
            "At 4:30 PM, sit and worry actively about your list. Spend the time problem-solving.",
            "When 15 minutes are up, stop, destroy the list, and change your activity."
        ]
    },
    {
        "id": "act-40", "title": "Worry Box Writing", "category": "Anxiety Relief", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "Write down your worries and lock them in a physical box to symbolise mental externalisation.",
        "purpose": "Provide physical externalization of anxiety for cognitive boundary setting.",
        "moods": "Anxious, Overwhelmed, Stressed", "conditions": "Mild Anxiety, Hyper-vigilance",
        "benefits": "Creates a physical boundary between self and negative thoughts.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Paper, pen, any container with a lid",
        "rationale": "Constructing external containers for worries utilizes physical action to reinforce containment.", "evidence": "Level 4",
        "instructions": [
            "Write down an active, disruptive worry on a small piece of paper.",
            "Fold the paper up neatly.",
            "Place the slip inside your container and close the lid.",
            "Say to yourself: 'This worry is now stored. I am safe to proceed with my day.'"
        ]
    },
    {
        "id": "act-41", "title": "Decatastrophizing", "category": "Anxiety Relief", "duration": "10 min", "difficulty": "Intermediate",
        "short_desc": "A cognitive-behavioral worksheet to systematically challenge worst-case scenarios and find realistic odds.",
        "purpose": "Challenge irrational anxiety-fueled worst-case scenarios.",
        "moods": "Anxious, Scared, Overthinking", "conditions": "Generalized Anxiety Disorder, Panic Disorder",
        "benefits": "Reduces anxiety intensity; builds cognitive perspective and problem-solving.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Paper and pen",
        "rationale": "Reality testing disrupts negative cognitive schemas and reduces the perceived intensity of threat.", "evidence": "Level 1a",
        "instructions": [
            "Write down your catastrophe: 'What is the absolute worst thing that could happen?'.",
            "Write down: 'What is the absolute best thing that could happen?'.",
            "Write down: 'What is the most likely, realistic outcome?'.",
            "Design a simple plan on how you would cope if the worst outcome actually happened."
        ]
    },
    {
        "id": "act-42", "title": "Opposite Action", "category": "Emotional Regulation", "duration": "10 min", "difficulty": "Advanced",
        "short_desc": "A DBT skill where you identify a maladaptive emotional urge and deliberately execute the exact opposite behavior.",
        "purpose": "Interrupt self-reinforcing negative emotions.",
        "moods": "Angry, Fearful, Sad", "conditions": "Borderline Personality Disorder, Depressive Disorders",
        "benefits": "Rapidly changes emotional states and breaks avoidant behavior loops.",
        "precautions": "Only practice when the original emotional urge is maladaptive/harmful.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Action pathways directly feed back into emotional networks; executing opposite actions updates neural appraisals.", "evidence": "Level 1a",
        "instructions": [
            "Identify the emotion you are feeling (e.g., Sadness) and its urge (e.g., isolate in bed).",
            "Check if the emotion fits current facts. If it is non-adaptive, proceed.",
            "Plan the opposite action (e.g., go to a public park; call a friend).",
            "Execute the opposite action fully, focusing on changing your posture and expression."
        ]
    },
    {
        "id": "act-43", "title": "RAIN Technique", "category": "Emotional Regulation", "duration": "10 min", "difficulty": "Intermediate",
        "short_desc": "A mindfulness framework (Recognize, Allow, Investigate, Nurture) to safely navigate painful emotions.",
        "purpose": "Process difficult emotions and develop self-compassion.",
        "moods": "Hurting, Sad, Rejected", "conditions": "Depression, Emotional Dysregulation",
        "benefits": "Lowers reactivity to emotional triggers; increases self-acceptance.",
        "precautions": "Take breaks if investigating brings up intense trauma.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "None",
        "rationale": "Mindful acceptance inhibits autonomic fight/flight responses, transitioning brain states to reflection.", "evidence": "Level 3",
        "instructions": [
            "R: Recognize what emotion is here (e.g., name it 'hurt').",
            "A: Allow it to be just as it is, without resisting or judging.",
            "I: Investigate where it is in your body and what it is telling you.",
            "N: Nurture yourself with self-compassion (e.g., place hand on heart, say comforting words)."
        ]
    },
    {
        "id": "act-44", "title": "Emotion Wheel Mapping", "category": "Emotional Regulation", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "Map your general feeling to specific secondary/tertiary descriptors to resolve emotional alexithymia.",
        "purpose": "Optimize emotional granularity and labeling abilities.",
        "moods": "Confused, Frustrated, Numb", "conditions": "Alexithymia, Personality Disorders",
        "benefits": "Reduces raw amygdala distress via verbal labeling.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Emotion Wheel diagram",
        "rationale": "Verbal labeling of emotions activates right ventrolateral prefrontal cortex, dampening amygdala reactivity.", "evidence": "Level 2",
        "instructions": [
            "Identify a broad core emotion on the inside of the wheel (e.g., Sad).",
            "Move to the middle circle to find a secondary level (e.g., Lonely).",
            "Move to the outer circle for the tertiary, granular emotion (e.g., Abandoned).",
            "Write it down and breathe, acknowledging the specific feeling."
        ]
    },
    {
        "id": "act-45", "title": "Temperature TIPP Reset", "category": "Emotional Regulation", "duration": "2 min", "difficulty": "Beginner",
        "short_desc": "Splash very cold water on your face to trigger the mammalian dive reflex and slow down extreme stress.",
        "purpose": "Rapidly de-escalate crisis arousal levels.",
        "moods": "Furious, Panicked, Distressed", "conditions": "Borderline Personality Disorder, Panic Attacks",
        "benefits": "Rapid drop in heart rate and autonomic excitement; resets system.",
        "precautions": "Consult doctor first if you have cardiovascular disease.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Cold water, sink or bowl",
        "rationale": "Immersing face in cold water while holding breath activates the mammalian dive reflex, causing bradycardia.", "evidence": "Level 2",
        "instructions": [
            "Fill a sink or large bowl with cold water.",
            "Take a deep breath and hold it.",
            "Submerge your face for 15-30 seconds, covering nose and temples.",
            "Raise your face, breathe, and notice the change."
        ]
    },
    {
        "id": "act-46", "title": "Digital Detox Hour", "category": "Digital Wellbeing", "duration": "60 min", "difficulty": "Intermediate",
        "short_desc": "Unplug completely from all electronic screens for one hour to rest your attention filters.",
        "purpose": "Reduce sensory overstimulation and reset attention span.",
        "moods": "Distracted, Fatigued, Anxious", "conditions": "Internet Addiction, ADHD management",
        "benefits": "Restores cognitive baseline energy levels and lowers stress.",
        "precautions": "Inform family in advance to prevent check-in anxieties.",
        "setting": "Both", "format_type": "Individual", "equipment": "None",
        "rationale": "Continuous digital stimulus fragments attention; removing screens restores dopamine baseline.", "evidence": "Level 3",
        "instructions": [
            "Power down your smartphone, laptop, and television.",
            "Place devices out of sight in a drawer or another room.",
            "Spend the hour engaged in a screen-free activity (reading, walks, cleaning).",
            "Notice any digital cravings without acting on them."
        ]
    },
    {
        "id": "act-47", "title": "Grayscale Screen Transition", "category": "Digital Wellbeing", "duration": "5 min", "difficulty": "Beginner",
        "short_desc": "Turn your phone display settings to grayscale to dramatically reduce its reward-feedback look.",
        "purpose": "Interrupt reward loops linked to screen compulsion.",
        "moods": "Addicted, Distracted, Lethargic", "conditions": "Smartphone dependency",
        "benefits": "Reduces daily screen time and phone pick-up counts.",
        "precautions": "None.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Smartphone",
        "rationale": "Removing high-saturation colors reduces visual reward feedback, rendering the phone less appealing.", "evidence": "Level 1b",
        "instructions": [
            "Go to your smartphone Accessibility settings.",
            "Find Display or Color Filters and toggle Grayscale to ON.",
            "Observe how your screen looks. Maintain this setting for at least 24 hours.",
            "Evaluate your urge to check your phone when it lacks color."
        ]
    },
    {
        "id": "act-48", "title": "Notification Audit", "category": "Digital Wellbeing", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "Turn off all non-essential notifications to regain control of your attention direction.",
        "purpose": "Minimize task interruptions and decrease occupational cognitive load.",
        "moods": "Scattered, Anxious, Rushed", "conditions": "ADHD, Stress-aggravated symptoms",
        "benefits": "Lowers daily alert stress and improves concentration time.",
        "precautions": "Keep essential emergency contacts enabled.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Smartphone/Tablet",
        "rationale": "Each notification click triggers a cognitive task-switching cost that increases mental fatigue.", "evidence": "Level 1b",
        "instructions": [
            "Open phone settings and navigate to notifications.",
            "For every app, ask: 'Does this require my immediate response?'",
            "Disable notifications for all social media, news, tools, and game apps.",
            "Check these apps in batches twice a day instead of receiving alerts."
        ]
    },
    {
        "id": "act-49", "title": "Active Listening", "category": "Social Wellness", "duration": "15 min", "difficulty": "Intermediate",
        "short_desc": "A conversational exercise where you listen without interrupting, then summarize what you heard before responding.",
        "purpose": "Build relational trust and improve mutual empathy.",
        "moods": "Distant, Irritable, Misunderstood", "conditions": "Relationship conflicts, social anxiety",
        "benefits": "Strengthens social bonds, reduces conflict, and develops emotional attunement.",
        "precautions": "Do not offer unsolicited advice; focus only on reflecting content.",
        "setting": "Indoor", "format_type": "Group", "equipment": "A partner",
        "rationale": "Relational resonance is established when individuals feel heard, decreasing social defense responses.", "evidence": "Level 2",
        "instructions": [
            "Sit with a friend/partner. Have them talk about their day for 3 minutes without interrupting.",
            "When they finish, summarize what they said: 'What I hear is...'",
            "Ask if your summary was accurate.",
            "Switch roles and repeat."
        ]
    },
    {
        "id": "act-50", "title": "Circle of Support Mapping", "category": "Social Wellness", "duration": "10 min", "difficulty": "Beginner",
        "short_desc": "Map your helper resources into concentric circles of support to counter isolation.",
        "purpose": "Mitigate feelings of isolation and evaluate objective safety resources.",
        "moods": "Lonely, Vulnerable, Sad", "conditions": "Depression, Crisis support assessment",
        "benefits": "Improves perceptions of safety and decreases active isolation.",
        "precautions": "If your circle is small, notice professional resources as support elements.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Paper and pen",
        "rationale": "Concretization of support lines counters cognitive distortions of being alone, stabilizing safety perception.", "evidence": "Level 4",
        "instructions": [
            "Draw three concentric circles on a page.",
            "In the inner circle, write people you contact in emergencies.",
            "In the middle circle, write friends or groups you talk to regularly.",
            "In the outer circle, write professional supports (therapists, doctors, hotlines).",
            "Keep this list visible in your living area."
        ]
    },
    {
        "id": "act-51", "title": "Socratic Questioning", "category": "Cognitive Exercises", "duration": "15 min", "difficulty": "Advanced",
        "short_desc": "Deconstruct your problematic automatic thoughts by asking systematic logical questions.",
        "purpose": "Develop objectivity towards irrational beliefs.",
        "moods": "Self-Critical, Confused, Anxious", "conditions": "Generalized Anxiety Disorder, Obsessive Thinking",
        "benefits": "Weakens validation of destructive core beliefs; improves reality orientation.",
        "precautions": "Perform with guidance of a CBT therapist if working through deep childhood traumas.",
        "setting": "Indoor", "format_type": "Individual", "equipment": "Paper and pen",
        "rationale": "Socratic inquiry activates semantic networks, facilitating critical correction of assumptions.", "evidence": "Level 1a",
        "instructions": [
            "Write down a major automatic thought (e.g., 'I will fail this presentation').",
            "Ask yourself: 'What is the objective evidence for this thought?'",
            "Ask: 'Is this based on fact or feeling?'",
            "Ask: 'What is the worst that can happen, and how would I handle it?'",
            "Write down a rational perspective based on your answers."
        ]
    }
]

class Command(BaseCommand):
    help = "Seed database with 51 evidence-based therapy activities idempotently."

    def handle(self, *args, **options):
        import time
        from django.db import connection

        self.stdout.write("Starting database seeding for TherapyActivity...")
        created_count = 0
        updated_count = 0

        for act in ACTIVITIES:
            desc = make_desc(
                short_desc=act["short_desc"],
                purpose=act["purpose"],
                moods=act["moods"],
                conditions=act["conditions"],
                benefits=act["benefits"],
                precautions=act["precautions"],
                setting=act["setting"],
                format_type=act["format_type"],
                equipment=act["equipment"],
                rationale=act["rationale"],
                evidence=act["evidence"]
            )

            meta = ACTIVITY_METADATA.get(act["id"], {})
            defaults = {
                "title": act["title"],
                "category": act["category"],
                "duration": act["duration"],
                "difficulty": act["difficulty"],
                "description": desc,
                "instructions": act["instructions"],
                "mood_range": meta.get("mood_range", []),
                "stress_range": meta.get("stress_range", []),
                "topics": meta.get("topics", []),
                "emotions": meta.get("emotions", []),
            }

            # Retry each activity up to 3 times on connection failure
            for attempt in range(3):
                try:
                    # Close stale connection before each write so Django reopens it
                    connection.close()
                    obj, created = TherapyActivity.objects.update_or_create(
                        id=act["id"],
                        defaults=defaults,
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(f"Created: {act['title']} ({act['id']})")
                    else:
                        updated_count += 1
                        self.stdout.write(f"Updated: {act['title']} ({act['id']})")
                    break  # success — move to next activity
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Attempt {attempt + 1} failed for {act['id']}: {e}"
                        )
                    )
                    if attempt < 2:
                        time.sleep(2)
                    else:
                        self.stdout.write(
                            self.style.ERROR(f"Skipping {act['id']} after 3 failed attempts.")
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished seeding activities. Created: {created_count}, Updated: {updated_count}"
            )
        )
