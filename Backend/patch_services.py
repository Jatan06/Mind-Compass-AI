import re

with open("c:/Users/HP/Documents/mindCompass/Backend/recommendation/services.py", "r", encoding="utf-8") as f:
    content = f.read()

# We need to replace everything starting from:
#         # Evaluate conflict, Case 1, Case 3, and Wellness conditions
# up to the end of the method before:
#     @classmethod
#     def create_demo_recommendations...
# Actually, let's find the exact block and replace it using regex.

import ast
import codecs

# Safe way is just to manually rewrite the whole function. Let's do it using regex.
pattern = r'(        # Evaluate conflict, Case 1, Case 3, and Wellness conditions\n)(.*?)(        # Ensure unread status for API polling)'

replacement = r'''\1        has_conflict, conflict_reason = False, ""
        is_wellness_only = False
        journal_sent = ""

        if mood_log:
            if not is_quick and journal_entry and journal_entry.analysis:
                journal_sent = journal_entry.analysis.get("sentiment", "Neutral")
            has_conflict, conflict_reason = cls._detect_conflict(mood_log, journal_entry) if not is_quick else (False, "")
            
            if not is_quick:
                if mood_log.mood >= 4 and journal_sent == "Positive":
                    is_wellness_only = True
                elif mood_log.mood <= 2 and journal_sent == "Positive":
                    is_wellness_only = True
            else:
                if mood_log.mood >= 4:
                    is_wellness_only = True

        if is_wellness_only:
            wellness_ids = ['act-17', 'act-10', 'act-25', 'act-8', 'act-6', 'act-18', 'act-19', 'act-26', 'act-37', 'act-11', 'act-5']
            activities = [act for act in activities if act.id in wellness_ids]

        # ── Priority Weights Calculation ───────────────────────────────────
        # Suppress mood multiplier if there's conflict and elevate journal topics.
        conflict_suppressor = 0.0 if has_conflict else 1.0
        journal_multiplier = 2.0 if has_conflict else 1.0

        activity_scores = {}
        activity_metrics = {}

        def val_fmt(val):
            return int(val) if isinstance(val, (int, float)) and val == int(val) else round(val, 2)

        for act in activities:
            mood_match = 0.0
            emotion_match = 0.0
            topic_match = 0.0
            historical_success = 0.0
            user_preference = 0.0
            completion_rate = 0.0
            skip_penalty = 0.0
            recent_repetition = 0.0

            # Evaluate Mood Match
            current_mood_match = 0.0
            current_stress_match = 0.0
            if mood_log:
                if act.mood_range and len(act.mood_range) == 2:
                    if act.mood_range[0] <= mood_log.mood <= act.mood_range[1]:
                        current_mood_match = 1.0
                if act.stress_range and len(act.stress_range) == 2:
                    if act.stress_range[0] <= mood_log.stress <= act.stress_range[1]:
                        current_stress_match = 1.0
            mood_match = (current_mood_match + current_stress_match) / 2.0
            
            if goals:
                if any("sleep" in g for g in goals) and ("sleep" in act.topics or "sleep" in act.category.lower()):
                    mood_match = max(mood_match, 1.0)
                if any("stress" in g or "anxi" in g for g in goals) and ("Anxiety" in act.emotions or "Stress" in act.emotions or "breathing" in act.category.lower()):
                    mood_match = max(mood_match, 1.0)

            # Evaluate Emotion Match
            for emotion in recent_primary_emotions:
                if emotion in act.emotions:
                    emotion_match = 1.0
            if mood_log and mood_log.notes:
                notes_lower = mood_log.notes.lower()
                if any(e.lower() in notes_lower for e in act.emotions) or any(t.lower() in notes_lower for t in act.topics):
                    emotion_match = 1.0 

            # Evaluate Topic Match
            journal_themes_lower = [t.lower() for t in journal_themes]
            for theme in journal_themes_lower:
                if theme in act.topics or theme in act.category.lower() or theme in act.title.lower():
                    topic_match = 1.0

            # Historical Processing
            past_completed = Recommendation.objects.filter(user=user, activity=act, completed=True)
            past_all = Recommendation.objects.filter(user=user, activity=act)
            if past_all.exists():
                completion_rate = past_completed.count() / past_all.count()
            
            avg_impr = None
            if past_completed.exists():
                avg_impr = past_completed.aggregate(models.Avg('improvement_score'))['improvement_score__avg']
                if avg_impr is not None:
                    historical_success = min(1.0, max(0.0, avg_impr / 3.0))

            fbs = activity_fb_map.get(act.id, [])
            if fbs:
                avg_satisfaction = sum(f.satisfaction for f in fbs) / len(fbs)
                user_preference = avg_satisfaction / 5.0
                latest_fb = sorted(fbs, key=lambda f: f.created_at, reverse=True)[0]
                days_ago = (today - latest_fb.created_at.date()).days
                if days_ago < 2:
                    recent_repetition = 1.0
                elif days_ago < 5:
                    recent_repetition = 0.5

            ignored_recs = Recommendation.objects.filter(
                user=user, activity=act, completed=False, created_at__date__gte=today - timezone.timedelta(days=3)
            )
            if ignored_recs.exists():
                skip_penalty = min(1.0, ignored_recs.count() / 3.0)

            # CALCULATE ACTUAL SCORE EXCLUSIVELY VIA SUITABILITY
            eff_mood = mood_match * conflict_suppressor
            eff_emotion = emotion_match * journal_multiplier
            eff_topic = topic_match * journal_multiplier
            
            organic = (eff_mood + eff_emotion + eff_topic + historical_success + user_preference + completion_rate) - (skip_penalty + recent_repetition)
            total_score = max(1.0, organic * 16.6)
            
            activity_scores[act] = total_score
            activity_metrics[act] = {
                "mood": eff_mood,
                "emotion": eff_emotion,
                "topic": eff_topic,
                "history": historical_success,
                "penalty": skip_penalty + recent_repetition
            }

        # Pick highest scoring activity
        sorted_acts = sorted(activity_scores.items(), key=lambda item: item[1], reverse=True)
        selected_act, top_score = sorted_acts[0]
        runner_ups = sorted_acts[1:4] if len(sorted_acts) > 1 else []
        
        confidence_val = min(0.99, max(0.50, top_score / 100.0))
        
        # Activity success rate calculation
        total_p = Recommendation.objects.filter(user=user, activity=selected_act, created_at__date__lt=today).count()
        completed_p = Recommendation.objects.filter(user=user, activity=selected_act, completed=True, created_at__date__lt=today).count()
        success_rate_str = f"{int((completed_p / total_p) * 100)}%" if total_p > 0 else None

        # Build Dynamic Explanations
        sec1_reasons = []
        sel_metrics = activity_metrics[selected_act]
        
        if sel_metrics["emotion"] > 0:
            sec1_reasons.append(f"{selected_act.title} targets and down-regulates the distinct emotional trends found in your recent journaling.")
        elif sel_metrics["topic"] > 0:
            sec1_reasons.append(f"{selected_act.title} directly addresses the specific themes reflected in your current thoughts.")
            
        if sel_metrics["mood"] > 0:
            if mood_log and mood_log.stress >= 7:
                sec1_reasons.append(f"Clinically appropriate to manage your elevated stress pattern today.")
            elif mood_log and mood_log.mood <= 2:
                sec1_reasons.append(f"Provides immediate grounding techniques based on your low mood check-in.")
            elif mood_log and mood_log.mood >= 4:
                sec1_reasons.append(f"Focused on maximizing your current positive feeling state.")
            else:
                sec1_reasons.append(f"Recommended because it matches your recent physical and mood trends.")
                
        if has_conflict:
            sec1_reasons.append("Prioritized explicitly because your journal indicates underlying distress outweighing your check-in.")
                
        if sel_metrics["history"] > 0:
            sec1_reasons.append(f"This activity has a proven history of improving your mood previously.")
            
        if not sec1_reasons:
            sec1_reasons.append(f"Generated organically to support your long-term wellness milestones.")
            
        reason_section_1 = " ".join(sec1_reasons)
        
        # Section 2 Explanation (Runner Ups)
        runner_up_names = []
        reason_section_2 = "No alternative activities were evaluated for your profile today."
        
        if runner_ups:
            for ru_act, ru_score in runner_ups:
                ru_metrics = activity_metrics[ru_act]
                
                # Check why it lost to selected_act
                deficit = "it is a solid alternative but scored slightly lower on overall clinical fit"
                if ru_metrics["penalty"] > 0:
                    deficit = "it was repeatedly suggested recently and penalized to encourage diversity"
                elif sel_metrics["emotion"] > ru_metrics["emotion"]:
                    deficit = "it did not connect as closely to your current emotional NLP analysis"
                elif sel_metrics["topic"] > ru_metrics["topic"]:
                    deficit = "it lacked direct alignment with your journal topics"
                elif sel_metrics["history"] > ru_metrics["history"]:
                    deficit = "it lacks the historical success rate that your selected activity holds"
                    
                runner_up_names.append(f"{ru_act.title} (Reason skipped: {deficit})")
                
            reason_section_2 = "The AI evaluated other interventions: " + "; ".join(runner_up_names) + "."

        reasons_dict = {
            "section_1": reason_section_1,
            "section_2": reason_section_2
        }

        rectype = 'complete'
        if is_quick:
            rectype = 'quick'
        elif is_wellness_only:
            rectype = 'wellness'

        daily_suggestion = cls._generate_suggestion(journal_entry, mood_log)
        rec_trigger = today_text[:200] if today_text else ""
        rec_theme = ", ".join(journal_themes) if journal_themes else ""

        rec = Recommendation.objects.create(
            user=user,
            activity=selected_act,
            reason="Placeholder reason",
            is_active=True,
            trigger=rec_trigger,
            journal_theme=rec_theme,
            mood=mood_log.mood if mood_log else None,
            stress=mood_log.stress if mood_log else None,
            score=top_score,
            confidence=confidence_val,
            reasons_list=reasons_dict,
            historical_matches=similar_journals_count,
            success_rate=success_rate_str,
            rec_type=rectype,
            daily_suggestion=daily_suggestion
        )
'''

import sys
try:
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    with open("c:/Users/HP/Documents/mindCompass/Backend/recommendation/services.py", "w", encoding="utf-8") as f:
        f.write(content)
except Exception as e:
    print(e)
    sys.exit(1)
print("services patched successfully!")
